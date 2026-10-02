// Text-run discovery for the PDF editor: groups pdf.js text items into editable lines
// (in "base page space": points, y down, origin top-left of the page as pdf.js shows it unrotated by the user)
// and samples the colours of the rendered page so edited text can match the original.
import { pdfjs } from './pdf-common.js';

const isCjk = (s) => /[⺀-鿿豈-﫿＀-￯　-〿]/.test(s);

function guessFont(name, styleFamily, str, width, size) {
  const n = name || '';
  const bold = /bold|black|heavy|semibold|demi|粗|黑/i.test(n);
  const italic = /italic|oblique|slanted|kursiv/i.test(n);
  let fam = null;
  if (/courier|mono|consolas|menlo|typewriter|lucida console|等宽/i.test(n)) fam = 'mono';
  else if (/times|georgia|garamond|palatino|cambria|minion|bookman|century|serif(?!.*sans)|song|ming|simsun|宋|明|romans?/i.test(n) && !/sans/i.test(n)) fam = 'serif';
  else if (/arial|helvet|calibri|verdana|tahoma|segoe|roboto|sans|gothic|yahei|hei|黑|dengxian|noto|source/i.test(n)) fam = 'sans';
  if (!fam) {
    if (styleFamily === 'serif') fam = 'serif';
    else if (styleFamily === 'monospace' && !isCjk(str) && str.length > 3 && Math.abs(width / str.length / size - 0.6) < 0.03) fam = 'mono';
    else fam = 'sans';
  }
  return { fam, bold, italic };
}

/**
 * Returns { lines, count } for a pdf.js page. `count` is the number of non-empty text items in stream order
 * (used to match them with the show-text operators of the content stream when the original text is removed).
 * Each line: { x, base, w, size, text, fam, bold, italic, ords: [item ordinals], top, h }.
 */
export async function extractLines(page, vp1) {
  const lib = await pdfjs();
  const tc = await page.getTextContent();
  const lines = [], strs = [];
  let ord = -1;
  for (const it of tc.items) {
    if (!('str' in it) || it.str === '') continue;
    ord++;
    strs.push(it.str);
    const m = lib.Util.transform(vp1.transform, it.transform);
    const size = Math.hypot(m[0], m[1]);
    if (!size || Math.abs(m[1]) > 0.03 * size || m[0] < 0 || Math.abs(m[2]) > 0.35 * size) continue; // rotated / vertical text
    let name = null;
    try { name = page.commonObjs.has(it.fontName) ? page.commonObjs.get(it.fontName)?.name : null; } catch { /* font not resolved yet */ }
    const style = tc.styles[it.fontName] || {};
    const x = m[4], base = m[5], w = it.width;
    let line = null;
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 12); i--) {
      const L = lines[i];
      const gap = x - (L.x + L.w);
      if (Math.abs(L.base - base) < 0.28 * size && Math.abs(L.size - size) < 0.16 * size && gap > -0.35 * size && gap < 1.4 * size) { line = L; break; }
    }
    if (line) {
      const gap = x - (line.x + line.w);
      if (gap > 0.14 * size && !/\s$/.test(line.text) && !/^\s/.test(it.str)) line.text += ' ';
      line.text += it.str;
      line.w = Math.max(line.w, x + w - line.x);
      line.ords.push(ord);
      line.fontNames.push(name);
    } else {
      const g = guessFont(name, style.fontFamily, it.str, w, size);
      lines.push({ x, base, w, size, text: it.str, ...g, ords: [ord], fontNames: [name], asc: style.ascent });
    }
  }
  const out = lines.filter((l) => l.text.trim());
  for (const l of out) { l.top = l.base - l.size * 0.9; l.h = l.size * 1.17; }
  out.sort((a, b) => (Math.abs(a.base - b.base) < 0.3 * Math.min(a.size, b.size) ? a.x - b.x : a.base - b.base));
  return { lines: out, count: ord + 1, strs };
}

const hex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Samples the rendered canvas inside a box (base-space points) → { fg, bg } hex colours. */
export function sampleColors(canvas, scale, box) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const x0 = Math.max(0, Math.floor(box.x * scale)), y0 = Math.max(0, Math.floor(box.y * scale));
  const w = Math.min(canvas.width - x0, Math.ceil(box.w * scale)), h = Math.min(canvas.height - y0, Math.ceil(box.h * scale));
  if (w < 1 || h < 1) return { fg: '#000000', bg: '#ffffff' };
  const d = ctx.getImageData(x0, y0, w, h).data;
  const hist = new Map();
  for (let i = 0; i < d.length; i += 4) {
    const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    const e = hist.get(k);
    if (e) { e[0]++; e[1] += d[i]; e[2] += d[i + 1]; e[3] += d[i + 2]; } else hist.set(k, [1, d[i], d[i + 1], d[i + 2]]);
  }
  let best = null;
  for (const e of hist.values()) if (!best || e[0] > best[0]) best = e;
  const bg = [best[1] / best[0], best[2] / best[0], best[3] / best[0]];
  let maxd = 0;
  const dist = (r, g, b) => Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
  for (const e of hist.values()) maxd = Math.max(maxd, dist(e[1] / e[0], e[2] / e[0], e[3] / e[0]));
  if (maxd < 60) return { fg: '#000000', bg: hex(...bg) };
  let n = 0, r = 0, g = 0, b = 0;
  for (const e of hist.values()) {
    if (dist(e[1] / e[0], e[2] / e[0], e[3] / e[0]) > maxd * 0.7) { n += e[0]; r += e[1]; g += e[2]; b += e[3]; }
  }
  return { fg: hex(r / n, g / n, b / n), bg: hex(...bg) };
}
