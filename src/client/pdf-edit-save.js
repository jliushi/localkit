// Writes the editor's state into a PDF with pdf-lib: real text (standard fonts + subsetted Noto Sans SC for CJK),
// vector shapes, markup, notes, images, form values, page operations — and removes edited text from the content stream.
import { LK, el } from './lib.js';
import { pdflib, openForEdit, PdfError } from './pdf-common.js';

const FAMS = {
  sans: ['Helvetica', 'HelveticaBold', 'HelveticaOblique', 'HelveticaBoldOblique'],
  serif: ['TimesRoman', 'TimesRomanBold', 'TimesRomanItalic', 'TimesRomanBoldItalic'],
  mono: ['Courier', 'CourierBold', 'CourierOblique', 'CourierBoldOblique'],
};
/** Baseline position inside a 1.2-line-height box, as a fraction of the font size (matches the CSS used in the editor). */
export const BASELINE = { sans: 0.947, serif: 0.938, mono: 0.867, cjk: 0.95 };
export const LINE_HEIGHT = 1.2;

export const hexToRgb = (hex) => {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? [...h].map((c) => c + c).join('') : h.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};

// ---------------------------------------------------------------- CJK font slices

let sliceIndex = null;
const cpCache = new Map();
async function loadIndex() {
  sliceIndex ||= fetch(`${LK.base}/vendor/fonts/notosc/index.json`).then((r) => r.json());
  return sliceIndex;
}
async function sliceOf(cp) {
  if (cpCache.has(cp)) return cpCache.get(cp);
  const idx = await loadIndex();
  let found = null;
  // Prefer the dedicated CJK slices (numbered) over latin/cyrillic ones for ideographs; first match otherwise.
  for (const [file, ranges] of idx) if (ranges.some(([a, b]) => cp >= a && cp <= b)) { found = file; break; }
  cpCache.set(cp, found);
  return found;
}

/** A canvas-rendered glyph run for characters no font covers (emoji, rare symbols). */
async function rasterChar(ch, size, color, bold) {
  const k = 4, px = Math.ceil(size * 1.25 * k);
  const cv = el('canvas', { width: px, height: px });
  const ctx = cv.getContext('2d');
  ctx.font = `${bold ? 700 : 400} ${size * k}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(ch, 0, size * k * 0.95);
  const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w: px / k };
}

class Fonts {
  constructor(pdf, lib) {
    this.pdf = pdf; this.lib = lib;
    this.std = new Map(); this.sets = new Map(); this.slices = new Map(); this.kit = false; this.usedCjk = false;
  }
  async stdFont(fam, bold, italic) {
    const key = `${fam}${bold ? 'B' : ''}${italic ? 'I' : ''}`;
    if (!this.std.has(key)) {
      const names = FAMS[fam] || FAMS.sans;
      const font = await this.pdf.embedFont(this.lib.StandardFonts[names[(bold ? 1 : 0) + (italic ? 2 : 0)]]);
      this.std.set(key, font);
      this.sets.set(font, new Set(font.getCharacterSet()));
    }
    return this.std.get(key);
  }
  async slice(file) {
    if (!this.slices.has(file)) {
      if (!this.kit) { this.pdf.registerFontkit((await import('@pdf-lib/fontkit')).default); this.kit = true; }
      const bytes = new Uint8Array(await (await fetch(`${LK.base}/vendor/fonts/notosc/${file}`)).arrayBuffer());
      this.slices.set(file, await this.pdf.embedFont(bytes, { subset: true }));
    }
    return this.slices.get(file);
  }
  /** → { kind: 'std'|'cjk'|'img', font } for one character. */
  async resolve(ch, fam, bold, italic) {
    const cp = ch.codePointAt(0);
    if (fam !== 'cjk') {
      const f = await this.stdFont(fam, bold, italic);
      if (this.sets.get(f).has(cp)) return { kind: 'std', font: f };
    }
    const file = await sliceOf(cp);
    if (file) { this.usedCjk = true; return { kind: 'cjk', font: await this.slice(file) }; }
    return { kind: 'img' };
  }
}

// ---------------------------------------------------------------- text layout

const TOKEN = /[ \t]+|[^\s⺀-鿿豈-﫿＀-￯　-〿]+|[\s\S]/gu;

async function layoutText(fonts, a) {
  const size = a.size;
  const out = [];
  for (const para of String(a.text).split('\n')) {
    const chars = [...para];
    const info = [];
    for (const ch of chars) {
      const r = await fonts.resolve(ch, a.font || 'sans', a.bold, a.italic);
      const w = r.kind === 'img' ? size * 1.1 : r.font.widthOfTextAtSize(ch, size);
      info.push({ ch, ...r, w });
    }
    let lines = [[]];
    if (a.w) {
      let pos = 0, cur = 0;
      for (const tok of para.match(TOKEN) || []) {
        const n = [...tok].length;
        const tw = info.slice(pos, pos + n).reduce((s, c) => s + c.w, 0);
        const L = lines[lines.length - 1];
        if (cur + tw > a.w && L.length && !/^\s+$/.test(tok)) { lines.push([]); cur = 0; }
        // a single very long word: break by character
        if (tw > a.w && n > 1) {
          for (const c of info.slice(pos, pos + n)) {
            if (cur + c.w > a.w && lines[lines.length - 1].length) { lines.push([]); cur = 0; }
            lines[lines.length - 1].push(c); cur += c.w;
          }
        } else { lines[lines.length - 1].push(...info.slice(pos, pos + n)); cur += tw; }
        pos += n;
      }
    } else lines = [info];
    out.push(...lines);
  }
  return out;
}

// ---------------------------------------------------------------- content-stream scrub

/** Finds the show-text operators (Tj TJ ' ") of a content stream. Returns null when the stream cannot be parsed safely. */
function findShowOps(src) {
  const n = src.length;
  const isWs = (c) => c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f' || c === '\0';
  const isDelim = (c) => '()<>[]{}/%'.includes(c);
  const readString = (i) => {
    let depth = 0;
    for (let j = i; j < n; j++) {
      const c = src[j];
      if (c === '\\') { j++; continue; }
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return j + 1;
    }
    return -1;
  };
  const ops = [];
  let lastStr = null, lastArr = null, i = 0;
  while (i < n) {
    const c = src[i];
    if (isWs(c)) { i++; continue; }
    if (c === '%') { while (i < n && src[i] !== '\n' && src[i] !== '\r') i++; continue; }
    if (c === '(') { const e = readString(i); if (e < 0) return null; lastStr = { from: i, to: e, ne: e - i > 2, raw: src.slice(i + 1, e - 1) }; i = e; continue; }
    if (c === '<') {
      if (src[i + 1] === '<') { i += 2; continue; }
      const e = src.indexOf('>', i);
      if (e < 0) return null;
      lastStr = { from: i, to: e + 1, ne: src.slice(i + 1, e).trim().length > 0, raw: null };
      i = e + 1; continue;
    }
    if (c === '>') { i += src[i + 1] === '>' ? 2 : 1; continue; }
    if (c === '[') {
      let depth = 0, j = i, ne = false;
      for (; j < n; j++) {
        const ch = src[j];
        if (ch === '(') { const e = readString(j); if (e < 0) return null; if (e - j > 2) ne = true; j = e - 1; }
        else if (ch === '<' && src[j + 1] !== '<') { const e = src.indexOf('>', j); if (e < 0) return null; if (e - j > 1) ne = true; j = e; }
        else if (ch === '[') depth++;
        else if (ch === ']' && --depth === 0) break;
      }
      if (j >= n) return null;
      lastArr = { from: i, to: j + 1, ne };
      i = j + 1; continue;
    }
    if (c === ']' || c === '{' || c === '}') { i++; continue; }
    if (c === '/') { i++; while (i < n && !isWs(src[i]) && !isDelim(src[i])) i++; continue; }
    const s = i;
    while (i < n && !isWs(src[i]) && !isDelim(src[i])) i++;
    const tok = src.slice(s, i);
    if (!/^[A-Za-z'"]/.test(tok)) continue; // number
    if (tok === 'BI') {
      const id = /\sID\s/.exec(src.slice(i));
      if (!id) return null;
      const from = i + id.index + id[0].length;
      const ei = /\sEI(?=\s|$)/.exec(src.slice(from));
      if (!ei) return null;
      i = from + ei.index + ei[0].length;
    } else if (tok === 'Tj' || tok === "'" || tok === '"') {
      if (!lastStr) return null;
      ops.push({ ...lastStr, kind: 'str' });
    } else if (tok === 'TJ') {
      if (!lastArr) return null;
      ops.push({ ...lastArr, kind: 'arr' });
    }
    lastStr = lastArr = null;
  }
  return ops;
}

/**
 * Maps every pdf.js text item to the show-text operators that produced it, by matching the item text with the glyph
 * text of the operators (pdf.js merges neighbouring operators into one item). Returns null when they do not line up.
 */
function mapItemsToOps(strs, opTexts) {
  const norm = (x) => x.normalize('NFKC').replace(/\s+/g, '');
  const res = [];
  let j = 0;
  for (const str of strs) {
    const target = norm(str);
    const idx = [];
    let acc = '';
    while (j < opTexts.length && acc.length < target.length) { acc += norm(opTexts[j]); idx.push(j); j++; }
    if (acc !== target) return null;
    res.push(idx);
  }
  return res;
}

/**
 * Empties the show-text operators behind the given text-item ordinals. `info` = { strs, ops } from pdf.js (item texts and
 * per-operator glyph texts). Returns true when the content stream was rewritten.
 */
async function scrubText(pdf, lib, page, ordinals, info) {
  const { PDFName, PDFArray, PDFRawStream, decodePDFRawStream } = lib;
  try {
    if (!info) return false;
    const contents = page.node.Contents();
    const streams = [];
    if (contents instanceof PDFArray) for (let i = 0; i < contents.size(); i++) streams.push(contents.lookup(i));
    else if (contents) streams.push(contents);
    if (!streams.length || !streams.every((s) => s instanceof PDFRawStream)) return false;
    const dec = new TextDecoder('latin1');
    const src = streams.map((s) => dec.decode(decodePDFRawStream(s).decode())).join('\n');
    const ops = findShowOps(src);
    if (!ops) return false;
    const real = ops.filter((o) => o.ne);
    if (real.length !== info.ops.length) return false; // e.g. text inside form XObjects
    const map = mapItemsToOps(info.strs, info.ops);
    if (!map) return false;
    const kill = new Set();
    for (const k of ordinals) for (const j of map[k] || []) kill.add(j);
    let out = src;
    for (const j of [...kill].sort((x, y) => y - x)) {
      const o = real[j];
      out = out.slice(0, o.from) + (o.kind === 'arr' ? '[]' : '()') + out.slice(o.to);
    }
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    page.node.set(PDFName.of('Contents'), pdf.context.register(pdf.context.flateStream(bytes)));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- the main entry

/**
 * state: { bytes, pgs: [{ id, src, w, h, rot }], anns, imgs, vps: Map(pg.id → base viewport), items: Map(pg.id → string[]),
 *          form: { values, flatten } }
 * `src` is the 0-based page of the original file (or null for a blank page of size w × h).
 */
export async function buildPdf(state, onProgress = () => {}) {
  const lib = await pdflib();
  const { rgb, degrees, BlendMode, LineCapStyle, StandardFonts, PDFName, PDFString, PDFNumber, PDFArray, PDFDict, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } = lib;
  const { bytes, pgs, anns, imgs, vps, items, form } = state;
  const pdf = await openForEdit(bytes);
  const fonts = new Fonts(pdf, lib);
  const origPages = pdf.getPages();
  const origRot = origPages.map((p) => p.getRotation().angle);
  const imageCache = new Map();
  const embedImg = async (key) => {
    if (!imageCache.has(key)) {
      const data = imgs[key];
      const buf = new Uint8Array(await (await fetch(data)).arrayBuffer());
      imageCache.set(key, /^data:image\/jpe?g/.test(data) ? await pdf.embedJpg(buf) : await pdf.embedPng(buf));
    }
    return imageCache.get(key);
  };

  // --- form values
  const fallbackText = []; // values the standard fonts cannot encode are drawn as text on top of the field
  if (form && Object.keys(form.values).length) {
    const f = pdf.getForm();
    for (const [name, v] of Object.entries(form.values)) {
      const field = f.getFieldMaybe(name);
      if (!field) continue;
      try {
        if (field instanceof PDFTextField) {
          try { field.setText(v || undefined); } catch { fallbackText.push({ field, v }); field.setText(undefined); }
        } else if (field instanceof PDFCheckBox) { if (v) field.check(); else field.uncheck(); }
        else if (field instanceof PDFRadioGroup) { if (v) field.select(v); else field.clear(); }
        else if (field instanceof PDFDropdown || field instanceof PDFOptionList) { if (v) field.select(v); else field.clear(); }
      } catch { /* ignore a field that cannot take the value */ }
    }
    f.updateFieldAppearances(await fonts.stdFont('sans', false, false));
  }

  // --- page objects, in output order
  const needPristine = pgs.some((p, i) => p.src != null && pgs.findIndex((q) => q.src === p.src) !== i);
  const pristine = needPristine ? await openForEdit(bytes) : null;
  const used = new Set();
  const objs = [];
  for (const pg of pgs) {
    let page;
    if (pg.src == null) page = pdf.addPage([pg.w, pg.h]);
    else if (!used.has(pg.src)) { page = origPages[pg.src]; used.add(pg.src); }
    else page = (await pdf.copyPages(pristine, [pg.src]))[0];
    objs.push(page);
  }

  const place = (vp, x, y) => vp.convertToPdfPoint(x, y);
  const drawText = async (page, vp, a) => {
    const lines = await layoutText(fonts, a);
    const size = a.size, lh = size * LINE_HEIGHT;
    const k = BASELINE[a.font] ?? 0.95;
    const color = rgb(...hexToRgb(a.color));
    const rot = vp.rotation % 360;
    let li = 0;
    for (const L of lines) {
      const lw = L.reduce((s, c) => s + c.w, 0);
      let cx = a.w ? { left: 0, center: (a.w - lw) / 2, right: a.w - lw }[a.align || 'left'] : 0;
      const by = a.y + k * size + li * lh;
      li++;
      for (let i = 0; i < L.length;) {
        let j = i, run = '';
        const c0 = L[i];
        while (j < L.length && L[j].kind === c0.kind && L[j].font === c0.font) { run += L[j].ch; j++; }
        const rw = L.slice(i, j).reduce((s, c) => s + c.w, 0);
        const [px, py] = place(vp, a.x + cx, by);
        if (c0.kind === 'img') {
          for (const c of L.slice(i, j)) {
            const r = await rasterChar(c.ch, size, a.color, a.bold);
            const im = await pdf.embedPng(r.bytes);
            const [ix, iy] = place(vp, a.x + cx, by + size * 0.3);
            page.drawImage(im, { x: ix, y: iy, width: r.w, height: r.w, rotate: degrees(rot) });
            cx += c.w;
          }
        } else {
          if (run.trim() || c0.kind === 'cjk') page.drawText(run, { x: px, y: py, size, font: c0.font, color, rotate: degrees(rot) });
          cx += rw;
        }
        i = j;
      }
    }
  };

  const draw = {
    async text(page, vp, a) {
      if (a.cover) await draw.white(page, vp, a.cover);
      if (String(a.text).trim()) await drawText(page, vp, a);
    },
    async white(page, vp, a) {
      const [x1, y1] = place(vp, a.x, a.y), [x2, y2] = place(vp, a.x + a.w, a.y + a.h);
      page.drawRectangle({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), color: rgb(...hexToRgb(a.color || '#ffffff')) });
    },
    async check(page, vp, a) {
      const f = await pdf.embedFont(StandardFonts.ZapfDingbats);
      const [px, py] = place(vp, a.x, a.y + a.size * 0.85);
      page.drawText('4', { x: px, y: py, size: a.size, font: f, color: rgb(...hexToRgb(a.color)), rotate: degrees(vp.rotation % 360) });
    },
    async image(page, vp, a) {
      const im = await embedImg(a.img);
      const [px, py] = place(vp, a.x, a.y + a.h);
      page.drawImage(im, { x: px, y: py, width: a.w, height: a.h, rotate: degrees(vp.rotation % 360) });
    },
    async mark(page, vp, a) {
      for (const r of a.rects) {
        const col = rgb(...hexToRgb(a.color));
        if (a.type === 'hl') {
          const [x1, y1] = place(vp, r.x, r.y), [x2, y2] = place(vp, r.x + r.w, r.y + r.h);
          page.drawRectangle({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), color: col, opacity: 0.55, blendMode: BlendMode.Multiply });
        } else {
          const yy = a.type === 'ul' ? r.y + r.h - 1 : r.y + r.h * 0.55;
          const [x1, y1] = place(vp, r.x, yy), [x2, y2] = place(vp, r.x + r.w, yy);
          page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: Math.max(0.8, r.h * 0.07), color: col });
        }
      }
    },
    async ink(page, vp, a) {
      const { pushGraphicsState, popGraphicsState, setLineWidth, setLineCap, setLineJoin, moveTo, lineTo, stroke, setStrokingRgbColor } = lib;
      const col = hexToRgb(a.color);
      const ops = [pushGraphicsState(), setLineWidth(a.width), setLineCap(LineCapStyle.Round), setLineJoin(1), setStrokingRgbColor(...col)];
      a.pts.forEach(([x, y], i) => { const [px, py] = place(vp, x, y); ops.push(i ? lineTo(px, py) : moveTo(px, py)); });
      if (a.pts.length === 1) { const [px, py] = place(vp, a.pts[0][0] + 0.01, a.pts[0][1]); ops.push(lineTo(px, py)); }
      ops.push(stroke(), popGraphicsState());
      page.pushOperators(...ops);
    },
    async rect(page, vp, a) {
      const [x1, y1] = place(vp, a.x, a.y), [x2, y2] = place(vp, a.x + a.w, a.y + a.h);
      page.drawRectangle({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), borderColor: rgb(...hexToRgb(a.color)), borderWidth: a.width });
    },
    async ell(page, vp, a) {
      const [x1, y1] = place(vp, a.x, a.y), [x2, y2] = place(vp, a.x + a.w, a.y + a.h);
      page.drawEllipse({ x: (x1 + x2) / 2, y: (y1 + y2) / 2, xScale: Math.abs(x2 - x1) / 2, yScale: Math.abs(y2 - y1) / 2, borderColor: rgb(...hexToRgb(a.color)), borderWidth: a.width });
    },
    async line(page, vp, a) {
      const col = rgb(...hexToRgb(a.color));
      const [x1, y1] = place(vp, a.x1, a.y1), [x2, y2] = place(vp, a.x2, a.y2);
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: a.width, color: col, lineCap: LineCapStyle.Round });
      if (a.type === 'arrow') {
        const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), len = Math.max(8, a.width * 4.5);
        for (const s of [-1, 1]) {
          const [hx, hy] = place(vp, a.x2 - len * Math.cos(ang + s * 0.45), a.y2 - len * Math.sin(ang + s * 0.45));
          page.drawLine({ start: { x: x2, y: y2 }, end: { x: hx, y: hy }, thickness: a.width, color: col, lineCap: LineCapStyle.Round });
        }
      }
    },
    async note(page, vp, a) {
      // A real PDF "Text" annotation with a visible yellow icon.
      const [x1, y1] = place(vp, a.x, a.y), [x2, y2] = place(vp, a.x + 20, a.y + 20);
      const R = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
      const ap = pdf.context.flateStream('1 0.92 0.23 rg 0 0 20 20 re f 0.55 0.45 0 RG 1 w 0.5 0.5 19 19 re S 0.55 0.45 0 RG 4 14 m 16 14 l S 4 10 m 16 10 l S 4 6 m 11 6 l S', {
        Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 20, 20],
      });
      const apRef = pdf.context.register(ap);
      const dict = pdf.context.obj({
        Type: 'Annot', Subtype: 'Text', Rect: R, Contents: PDFString.of(a.text || ''), Name: 'Comment', C: hexToRgb(a.color), F: 28,
        T: PDFString.of('LocalKit'), AP: { N: apRef },
      });
      const ref = pdf.context.register(dict);
      let annots = page.node.Annots();
      if (!annots) { annots = pdf.context.obj([]); page.node.set(PDFName.of('Annots'), annots); }
      annots.push(ref);
    },
  };
  draw.hl = draw.ul = draw.st = draw.mark;
  draw.arrow = draw.line;

  // --- fallback form text (non-WinAnsi values)
  for (const { field, v } of fallbackText) {
    const w = field.acroField.getWidgets()[0];
    if (!w) continue;
    const r = w.getRectangle();
    const idx = objs.findIndex((p) => { const an = p.node.Annots(); return an && an.asArray().some((x) => x === w.dict || (x.toString && w.dict && pdf.context.lookup(x) === w.dict)); });
    if (idx < 0) continue;
    const vp = vps.get(pgs[idx].id);
    const [bx, by] = vp.convertToViewportPoint(r.x, r.y + r.height);
    await drawText(objs[idx], vp, { x: bx + 2, y: by + Math.max(0, (r.height - 12) / 2) - 1, size: Math.min(12, r.height - 2), text: v, font: 'sans', color: '#000000', w: null });
  }

  // --- annotations per page
  let done = 0;
  for (let i = 0; i < pgs.length; i++) {
    const pg = pgs[i], page = objs[i], vp = vps.get(pg.id);
    const mine = anns.filter((a) => a.pg === pg.id);
    const ord = new Set();
    for (const a of mine) if (a.kill) for (const k of a.kill) ord.add(k);
    if (ord.size && pg.src != null) await scrubText(pdf, lib, page, ord, items.get(pg.id));
    for (const a of mine) {
      const fn = draw[a.type];
      if (fn) await fn(page, vp, a);
      onProgress(++done / Math.max(1, anns.length));
    }
    if (pg.src != null) page.setRotation(degrees((origRot[pg.src] + pg.rot) % 360));
    else page.setRotation(degrees(pg.rot % 360));
  }

  if (form?.flatten) { try { pdf.getForm().flatten(); } catch { /* no form */ } }

  // --- page order: remove everything, add back in order
  for (let i = pdf.getPageCount() - 1; i >= 0; i--) pdf.removePage(i);
  for (const p of objs) pdf.addPage(p);
  return { bytes: await pdf.save(), usedCjk: fonts.usedCjk };
}

export { PdfError };
