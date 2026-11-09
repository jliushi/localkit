import { $, $$, t, el, filePicker, progress, alertBox, errorText, download, fmtBytes, baseName, icon, toast } from './lib.js';
import { openForRender, openForEdit, readBytes, pdfBlob, pdflib, closeDoc, renderPage, sortable, move, SAMPLE_PDF } from './pdf-common.js';
import { pic } from './edit-pdf-icons.js';
import { extractLines, sampleColors, showOpTexts } from './pdf-text.js';
import { buildPdf, BASELINE } from './pdf-edit-save.js';

// ============================================================================ state
// Everything the user can undo lives in `pgs` (page list) and `anns` (annotations); all positions are "base page space":
// points of the page as pdf.js shows it (original rotation applied, y down) — the user's own page rotation is applied on top by CSS.
let bytes = null, name = 'document', doc = null;
let srcPages = []; // [{ page, vp1 }] pdf.js pages of the original file
let pgs = []; // [{ id, src (index | null for blank), w, h, rot }]
let anns = [];
let imgs = {}; // image key → data URL
let history = [], future = [];
let sel = new Set();
let pending = null; // { img, ratio, w } image/signature waiting for a click
let clip = []; // copied annotations
let zoom = 1, fit = 1, fitMode = true;
let nextId = 1, nextPg = 1;
let tool = 'edit';
let formInfo = null; // { fields: [{ name, kind, widgets: [{ src, rect, on }], options, value, multiline, readOnly }] }
let formVals = {};
const views = new Map(); // pg.id → view
const defaults = { font: 'sans', size: 14, bold: false, italic: false, align: 'left', width: 2 };
const toolColor = { text: '#111111', date: '#111111', check: '#111111', hl: '#ffe14d', ul: '#e11d48', st: '#e11d48', pen: '#e11d48', rect: '#e11d48', ell: '#e11d48', line: '#e11d48', arrow: '#e11d48', note: '#ffe14d', edit: '#111111', select: '#111111' };
const FONTCSS = {
  sans: 'Helvetica, Arial, "Liberation Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  serif: '"Times New Roman", Times, "Liberation Serif", "Songti SC", SimSun, "Noto Serif SC", serif',
  mono: '"Courier New", Courier, "Liberation Mono", "PingFang SC", "Microsoft YaHei", monospace',
  cjk: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
};
const MARKS = new Set(['hl', 'ul', 'st']);
const SHAPES = new Set(['rect', 'ell', 'line', 'arrow', 'ink']);
const LINE_TOOLS = new Set(['edit', 'hl', 'ul', 'st']);
const DRAG_TOOLS = new Set(['hl', 'ul', 'st', 'pen', 'rect', 'ell', 'line', 'arrow']);
const S = () => fit * zoom; // CSS px per point
const byId = (id) => anns.find((a) => a.id === id);
const pgOf = (id) => pgs.find((p) => p.id === id);

filePicker($('#pe-pick'), { accept: '.pdf,application/pdf', iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: ([f]) => load(f) });

// decorative icons in the static markup
for (const n of $$('[data-ic]')) n.replaceChildren(pic(n.dataset.ic));

// ============================================================================ history
const snapshot = () => JSON.stringify({ pgs, anns });
function remember() { history.push(snapshot()); if (history.length > 150) history.shift(); future = []; updateUndo(); }
function restore(s) {
  const o = JSON.parse(s);
  pgs = o.pgs; anns = o.anns; sel = new Set([...sel].filter((id) => byId(id)));
  rebuildPages();
}
function undo() { if (!history.length) return; future.push(snapshot()); restore(history.pop()); updateUndo(); }
function redo() { if (!future.length) return; history.push(snapshot()); restore(future.pop()); updateUndo(); }
function updateUndo() { $('#pe-undo').disabled = !history.length; $('#pe-redo').disabled = !future.length; }

// ============================================================================ geometry helpers
const dBase = (rot, dx, dy) => ({ 0: [dx, dy], 90: [dy, -dx], 180: [-dx, -dy], 270: [-dy, dx] }[rot % 360]);

/** Pointer position → base page space. */
function toBase(e, v) {
  const r = v.inner.getBoundingClientRect(), s = S(), pg = v.pg;
  const px = e.clientX - r.left, py = e.clientY - r.top, W = pg.w * s, H = pg.h * s;
  const [bx, by] = { 0: [px, py], 90: [py, H - px], 180: [W - px, H - py], 270: [W - py, px] }[pg.rot % 360];
  return { x: bx / s, y: by / s };
}

function bbox(a) {
  if (MARKS.has(a.type)) {
    const xs = a.rects.flatMap((r) => [r.x, r.x + r.w]), ys = a.rects.flatMap((r) => [r.y, r.y + r.h]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  if (a.type === 'ink') {
    const xs = a.pts.map((p) => p[0]), ys = a.pts.map((p) => p[1]), m = a.width / 2 + 2;
    const x = Math.min(...xs) - m, y = Math.min(...ys) - m;
    return { x, y, w: Math.max(...xs) - x + m, h: Math.max(...ys) - y + m };
  }
  if (a.type === 'line' || a.type === 'arrow') {
    const m = 8 + a.width;
    const x = Math.min(a.x1, a.x2) - m, y = Math.min(a.y1, a.y2) - m;
    return { x, y, w: Math.abs(a.x2 - a.x1) + 2 * m, h: Math.abs(a.y2 - a.y1) + 2 * m };
  }
  if (a.type === 'note') return { x: a.x, y: a.y, w: 20, h: 20 };
  if (a.type === 'check') return { x: a.x, y: a.y, w: a.size, h: a.size * 1.1 };
  return { x: a.x, y: a.y, w: a.w ?? 0, h: a.h ?? 0 };
}

function translate(a, dx, dy) {
  if (MARKS.has(a.type)) for (const r of a.rects) { r.x += dx; r.y += dy; }
  else if (a.type === 'ink') a.pts = a.pts.map(([x, y]) => [x + dx, y + dy]);
  else if (a.type === 'line' || a.type === 'arrow') { a.x1 += dx; a.x2 += dx; a.y1 += dy; a.y2 += dy; }
  else { a.x += dx; a.y += dy; }
}

// ============================================================================ loading
async function load(file) {
  $('#pe-pick').hidden = true;
  $('#pe-work').hidden = false;
  $('#pe-alert').replaceChildren();
  $('#pe-result').replaceChildren();
  anns = []; history = []; future = []; sel = new Set(); pending = null; zoom = 1; fitMode = true; imgs = {}; formVals = {}; formInfo = null; pgs = [];
  for (const v of views.values()) { io.unobserve(v.wrap); dropCanvas(v); v.wrap.remove(); }
  views.clear();
  closeDoc(doc);
  const task = progress($('#pe-task'), { lock: true, title: t('loading') });
  try {
    bytes = await readBytes(file);
    name = baseName(file.name);
    await openForEdit(bytes); // fails early for encrypted files
    doc = await openForRender(bytes);
    srcPages = new Array(doc.numPages);
    for (let i = 0; i < doc.numPages; i += 12) {
      await Promise.all(Array.from({ length: Math.min(12, doc.numPages - i) }, async (_, k) => {
        const page = await doc.getPage(i + k + 1);
        srcPages[i + k] = { page, vp1: page.getViewport({ scale: 1 }) };
      }));
      task.set(Math.min(1, (i + 12) / doc.numPages));
    }
  } catch (e) {
    task.close();
    $('#pe-alert').replaceChildren(alertBox(errorText(e)));
    $('#pe-pick').hidden = false;
    $('#pe-work').hidden = true;
    return;
  }
  task.close();
  pgs = srcPages.map((sp, i) => ({ id: nextPg++, src: i, w: sp.vp1.width, h: sp.vp1.height, rot: 0 }));
  formInfo = await detectForm(bytes).catch(() => null);
  $('#pe-formbar').hidden = !formInfo;
  if (formInfo) $('#pe-formmsg').textContent = t('formFound', formInfo.fields.length);
  computeFit();
  rebuildPages();
  layoutAll();
  setTool('edit');
  updateUndo();
  const firstPageId = pgs[0]?.id;
  setTimeout(async () => {
    const firstView = views.get(firstPageId);
    if (!firstView) return;
    const lines = await ensureLines(firstView).catch(() => null);
    if (views.get(firstPageId) === firstView && lines && !lines.lines.length && pgs.length === 1) $('#pe-alert').replaceChildren(alertBox(t('noText'), 'info'));
  }, 600);
}

function computeFit() {
  const avail = Math.min(1000, $('#pe-main').clientWidth - 24);
  fit = Math.max(0.2, Math.min(2, avail / Math.max(...pgs.map((p) => (p.rot % 180 ? p.h : p.w)))));
}

// ============================================================================ page views
const io = new IntersectionObserver((entries) => {
  for (const en of entries) {
    const v = en.target._view;
    if (!v) continue;
    v.near = en.isIntersecting;
    if (v.near) enqueueRender(v); else dropCanvas(v);
  }
}, { rootMargin: '900px 0px' });

function makeView(pg) {
  const wrap = el('div', { class: 'epage', 'data-id': pg.id });
  const inner = el('div', { class: 'epage-in' });
  const layer = el('div', { class: 'layer' });
  inner.append(layer);
  wrap.append(inner);
  const v = { pg, wrap, inner, layer, canvas: null, near: false, token: 0, lines: null, scale: 1 };
  wrap._view = v;
  inner.addEventListener('pointerdown', (e) => onPageDown(e, v));
  inner.addEventListener('mousedown', (e) => { if (!e.target.closest('.fl, .ann')) e.preventDefault(); }); // keep the caret where the tool puts it
  inner.addEventListener('pointermove', (e) => onHover(e, v));
  inner.addEventListener('pointerleave', () => hideHover(v));
  io.observe(wrap);
  return v;
}

function viewport(pg) {
  if (pg.src != null) return srcPages[pg.src].vp1;
  return { rotation: 0, width: pg.w, height: pg.h, convertToPdfPoint: (x, y) => [x, pg.h - y], convertToViewportPoint: (x, y) => [x, pg.h - y] };
}

function layoutView(v) {
  const pg = v.pg, s = S(), r = pg.rot % 360;
  const bw = pg.w * s, bh = pg.h * s;
  v.wrap.style.width = `${r % 180 ? bh : bw}px`;
  v.wrap.style.height = `${r % 180 ? bw : bh}px`;
  v.inner.style.width = `${bw}px`;
  v.inner.style.height = `${bh}px`;
  v.inner.style.transform = { 0: '', 90: `translate(${bh}px,0) rotate(90deg)`, 180: `translate(${bw}px,${bh}px) rotate(180deg)`, 270: `translate(0,${bw}px) rotate(270deg)` }[r];
  if (v.canvas) { v.canvas.style.width = `${bw}px`; v.canvas.style.height = `${bh}px`; }
}

let renderChain = Promise.resolve();
function enqueueRender(v) {
  if (v.pg.src == null) return;
  const token = ++v.token;
  renderChain = renderChain.then(() => renderView(v, token)).catch(() => {});
}
async function renderView(v, token) {
  if (!v.near || token !== v.token || !views.has(v.pg.id)) return;
  const s = S(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sp = srcPages[v.pg.src];
  const vp = sp.page.getViewport({ scale: s * dpr });
  const canvas = el('canvas', { width: Math.round(vp.width), height: Math.round(vp.height) });
  canvas.style.width = `${v.pg.w * s}px`;
  canvas.style.height = `${v.pg.h * s}px`;
  await sp.page.render({ canvasContext: canvas.getContext('2d'), viewport: vp, canvas }).promise;
  if (token !== v.token || !v.near) return;
  if (v.canvas) v.canvas.replaceWith(canvas); else v.inner.prepend(canvas);
  v.canvas = canvas;
  ensureLines(v).catch(() => {});
  v.scale = vp.width / v.pg.w;
  v.inner.classList.add('rendered');
}
function dropCanvas(v) {
  v.token++;
  if (v.canvas) { v.canvas.remove(); v.canvas = null; v.inner.classList.remove('rendered'); }
}

/** Rebuilds the page list in the order of `pgs` (after load, undo, or page operations). */
function rebuildPages() {
  const keep = new Set(pgs.map((p) => p.id));
  for (const [id, v] of views) if (!keep.has(id)) { v.wrap.remove(); dropCanvas(v); views.delete(id); }
  const holder = $('#pe-pages');
  const frag = document.createDocumentFragment();
  for (const pg of pgs) {
    let v = views.get(pg.id);
    if (!v) { v = makeView(pg); views.set(pg.id, v); }
    v.pg = pg;
    layoutView(v);
    frag.append(v.wrap);
  }
  holder.replaceChildren(frag);
  for (const v of views.values()) { renderAnns(v); renderForms(v); }
  buildThumbs();
  syncProps();
  $('#pe-pagecount').textContent = t('pageCount', pgs.length);
}

function layoutAll() {
  for (const v of views.values()) { layoutView(v); renderAnns(v); renderForms(v); if (v.near) enqueueRender(v); }
  $('#pe-zoom').textContent = `${Math.round((S() / (96 / 72)) * 100)}%`;
}
function setZoom(z, fitW = false) {
  if (fitW) { fitMode = true; zoom = 1; computeFit(); } else { fitMode = false; zoom = Math.max(0.2, Math.min(5, z)); }
  layoutAll();
}
window.addEventListener('resize', () => { if (fitMode && !$('#pe-work').hidden) { const old = fit; computeFit(); if (Math.abs(old - fit) > 0.01) layoutAll(); } });

// ============================================================================ text lines (existing text)
function ensureLines(v) {
  if (v.pg.src == null) return Promise.resolve({ lines: [], count: 0, strs: [] });
  const sp = srcPages[v.pg.src];
  sp.linesP ||= extractLines(sp.page, sp.vp1).then((r) => { sp.lines = r; return r; });
  return sp.linesP.then((r) => { v.lines = r; return r; });
}

let hoverBox = null;
let hoverRaf = 0;
function hideHover(v) { v.layer.querySelector('.hoverbox')?.remove(); }
function onHover(e, v) {
  if (!LINE_TOOLS.has(tool) || e.pointerType === 'touch') return;
  if (!v.lines) { ensureLines(v); return; }
  if (hoverRaf) return;
  hoverRaf = requestAnimationFrame(() => {
    hoverRaf = 0;
    const p = toBase(e, v);
    const l = lineAt(v, p);
    let box = v.layer.querySelector('.hoverbox');
    if (!l || e.target.closest?.('.ann')) { box?.remove(); v.inner.style.cursor = ''; return; }
    if (!box) { box = el('div', { class: 'hoverbox' }); v.layer.append(box); }
    const s = S();
    Object.assign(box.style, { left: `${(l.x - 1.5) * s}px`, top: `${l.top * s}px`, width: `${(l.w + 3) * s}px`, height: `${l.h * s}px` });
    v.inner.style.cursor = tool === 'edit' ? 'text' : '';
  });
}
function lineAt(v, p) {
  let best = null;
  for (const l of v.lines?.lines || []) {
    if (p.x >= l.x - 2 && p.x <= l.x + l.w + 2 && p.y >= l.top - 1 && p.y <= l.top + l.h + 1) {
      if (!best || l.w * l.h < best.w * best.h) best = l;
    }
  }
  return best;
}

async function startEdit(v, line) {
  const key = `${v.pg.id}:${line.ords[0]}`;
  let a = anns.find((x) => x.lk === key);
  if (!a) {
    const size = Math.round(line.size * 10) / 10;
    const col = v.canvas ? sampleColors(v.canvas, v.scale, { x: line.x - 1, y: line.top, w: line.w + 2, h: line.h }) : { fg: '#000000', bg: '#ffffff' };
    remember();
    a = { id: nextId++, pg: v.pg.id, type: 'text', x: line.x, y: line.base - BASELINE[line.fam] * size, w: null, text: line.text, font: line.fam, size, bold: line.bold, italic: line.italic, align: 'left', color: col.fg,
      cover: { x: line.x - 1.5, y: line.top + 0.4, w: line.w + 3, h: line.h, color: col.bg }, kill: line.ords, lk: key, orig: line.text, histLen: history.length };
    anns.push(a);
    renderAnns(v);
  }
  select([a.id]);
  focusText(a);
}

// ============================================================================ annotations: rendering
function buildNode(a, v) {
  const s = S();
  const node = el('div', { class: `ann t-${a.type}${SHAPES.has(a.type) || MARKS.has(a.type) ? ' pass' : ''}`, 'data-id': a.id, tabindex: -1 });
  const b = bbox(a);
  node.style.left = `${b.x * s}px`;
  node.style.top = `${b.y * s}px`;
  if (a.type === 'text') {
    const ed = el('div', { class: 'tx', spellcheck: 'false', 'data-ph': t('typeHere'), text: a.text });
    try { ed.contentEditable = 'plaintext-only'; } catch { /* fallback below */ }
    if (ed.contentEditable !== 'plaintext-only') ed.contentEditable = 'true';
    const st = ed.style;
    st.fontFamily = FONTCSS[a.font] || FONTCSS.sans;
    st.fontSize = `${a.size * s}px`;
    st.fontWeight = a.bold ? 700 : 400;
    st.fontStyle = a.italic ? 'italic' : 'normal';
    st.color = a.color;
    st.textAlign = a.align || 'left';
    if (a.w) { st.width = `${a.w * s}px`; st.whiteSpace = 'pre-wrap'; st.overflowWrap = 'anywhere'; }
    ed.addEventListener('focus', () => { select([a.id]); });
    ed.addEventListener('input', () => { a.text = ed.innerText.replace(/\n$/, ''); a.touched = true; });
    ed.addEventListener('paste', (e) => { if (ed.contentEditable !== 'plaintext-only') { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); } });
    ed.addEventListener('blur', () => endText(a, v));
    node.append(ed);
  } else if (a.type === 'check') {
    node.style.width = `${a.size * s}px`;
    node.append(el('div', { class: 'tx chk', text: '✓', style: { fontSize: `${a.size * s}px`, color: a.color } }));
  } else {
    node.style.width = `${b.w * s}px`;
    node.style.height = `${b.h * s}px`;
    if (a.type === 'white') node.style.background = a.color || '#fff';
    else if (a.type === 'image') node.append(el('img', { src: imgs[a.img], alt: '' }));
    else if (MARKS.has(a.type)) {
      for (const r of a.rects) {
        const d = el('div', { class: 'mk' });
        Object.assign(d.style, { left: `${(r.x - b.x) * s}px`, top: `${(r.y - b.y) * s}px`, width: `${r.w * s}px`, height: `${r.h * s}px` });
        if (a.type === 'hl') d.style.background = a.color;
        else {
          const th = Math.max(1, r.h * 0.07 * s);
          d.append(el('i', { style: { position: 'absolute', left: 0, right: 0, height: `${th}px`, top: `${a.type === 'ul' ? r.h * s - th - 1 : r.h * 0.55 * s}px`, background: a.color } }));
        }
        node.append(d);
      }
    } else if (SHAPES.has(a.type)) node.append(shapeSvg(a, b, s));
    else if (a.type === 'note') {
      node.style.background = a.color;
      node.append(pic('note'));
      const ta = el('textarea', { class: 'np', placeholder: t('notePh'), rows: 3 });
      ta.value = a.text || '';
      ta.addEventListener('input', () => { a.text = ta.value; });
      ta.addEventListener('pointerdown', (e) => e.stopPropagation());
      ta.addEventListener('keydown', (e) => e.stopPropagation());
      node.append(ta);
    }
  }
  if (['white', 'image', 'rect', 'ell'].includes(a.type) || (a.type === 'text')) node.append(el('span', { class: 'rs' }));
  if (a.type === 'line' || a.type === 'arrow') {
    for (const k of ['s', 'e']) {
      const h = el('span', { class: `rs pt-${k}` });
      h.style.left = `${((k === 's' ? a.x1 : a.x2) - b.x) * s}px`;
      h.style.top = `${((k === 's' ? a.y1 : a.y2) - b.y) * s}px`;
      node.append(h);
    }
  }
  node.append(el('button', { type: 'button', class: 'x', title: t('del'), 'aria-label': t('del'), onpointerdown: (e) => e.stopPropagation(), onclick: () => deleteSel([a.id]) }, '×'));
  node.addEventListener('pointerdown', (e) => onAnnDown(e, a, node, v));
  if (sel.has(a.id)) node.classList.add('on');
  return node;
}

function shapeSvg(a, b, s) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', b.w * s);
  svg.setAttribute('height', b.h * s);
  svg.style.overflow = 'visible';
  const mk = (tag, attrs) => { const n = document.createElementNS(ns, tag); for (const [k, val] of Object.entries(attrs)) n.setAttribute(k, val); svg.append(n); return n; };
  const common = { stroke: a.color, 'stroke-width': a.width * s, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (a.type === 'ink') {
    mk('path', { ...common, d: a.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x - b.x) * s} ${(y - b.y) * s}${a.pts.length === 1 ? ` L${(x - b.x) * s + 0.01} ${(y - b.y) * s}` : ''}`).join('') });
  } else if (a.type === 'rect') mk('rect', { ...common, x: (a.w < 0 ? a.w : 0) * s, y: 0, width: Math.abs(a.w) * s, height: Math.abs(a.h) * s });
  else if (a.type === 'ell') mk('ellipse', { ...common, cx: (a.w / 2) * s, cy: (a.h / 2) * s, rx: Math.abs(a.w / 2) * s, ry: Math.abs(a.h / 2) * s });
  else {
    const x1 = (a.x1 - b.x) * s, y1 = (a.y1 - b.y) * s, x2 = (a.x2 - b.x) * s, y2 = (a.y2 - b.y) * s;
    mk('line', { ...common, x1, y1, x2, y2 });
    if (a.type === 'arrow') {
      const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.max(8, a.width * 4.5) * s;
      for (const k of [-1, 1]) mk('line', { ...common, x1: x2, y1: y2, x2: x2 - len * Math.cos(ang + k * 0.45), y2: y2 - len * Math.sin(ang + k * 0.45) });
    }
  }
  return svg;
}

/** Rebuilds all annotation nodes of one page. */
function renderAnns(v) {
  const focusId = document.activeElement?.closest?.('.ann')?.dataset.id;
  for (const n of $$('.ann, .pcv', v.layer)) n.remove();
  const s = S();
  for (const a of anns) {
    if (a.pg !== v.pg.id) continue;
    if (a.cover) {
      const c = el('div', { class: 'pcv' });
      Object.assign(c.style, { left: `${a.cover.x * s}px`, top: `${a.cover.y * s}px`, width: `${a.cover.w * s}px`, height: `${a.cover.h * s}px`, background: a.cover.color });
      v.layer.append(c);
    }
    v.layer.append(buildNode(a, v));
  }
  if (focusId) { const n = v.layer.querySelector(`.ann[data-id="${focusId}"] .tx`); if (n && n.isContentEditable) focusEnd(n); }
}
const renderAll = () => { for (const v of views.values()) renderAnns(v); };
function refreshAnn(a) {
  const v = views.get(a.pg);
  if (!v) return;
  const old = v.layer.querySelector(`.ann[data-id="${a.id}"]`);
  const n = buildNode(a, v);
  if (old) old.replaceWith(n); else v.layer.append(n);
  return n;
}

function focusEnd(ed) {
  ed.focus({ preventScroll: true });
  const r = document.createRange();
  r.selectNodeContents(ed);
  r.collapse(false);
  const sl = getSelection();
  sl.removeAllRanges();
  sl.addRange(r);
}
function focusText(a, selectAll = false) {
  const ed = $(`.ann[data-id="${a.id}"] .tx`);
  if (!ed) return;
  ed.focus({ preventScroll: true });
  if (selectAll) getSelection().selectAllChildren(ed); else focusEnd(ed);
}
function endText(a, v) {
  if (!byId(a.id)) return;
  const empty = !String(a.text).trim();
  if (a.orig != null && !a.cover) return;
  if (a.cover && a.text === a.orig && !a.touched) { // nothing changed → put the original back
    anns = anns.filter((x) => x.id !== a.id);
    if (history.length === a.histLen + 1) history.pop();
    sel.delete(a.id);
    renderAnns(v);
    updateUndo();
  } else if (empty && !a.cover) {
    anns = anns.filter((x) => x.id !== a.id);
    sel.delete(a.id);
    renderAnns(v);
  }
}

// ============================================================================ selection & props
function select(ids, add = false) {
  if (!add) sel = new Set();
  for (const id of ids) sel.add(id);
  for (const n of $$('.ann')) n.classList.toggle('on', sel.has(Number(n.dataset.id)));
  const a = sel.size === 1 ? byId([...sel][0]) : null;
  if (a) {
    for (const k of ['font', 'size', 'bold', 'italic', 'align', 'width']) if (a[k] != null) defaults[k] = a[k];
    if (a.color) $('#pe-color').value = a.color.length === 7 ? a.color : '#111111';
  }
  syncProps();
}

const TEXTY = new Set(['text', 'check']);
function syncProps() {
  const a = sel.size === 1 ? byId([...sel][0]) : null;
  const kind = a ? a.type : tool;
  const isText = ['text', 'edit', 'date'].includes(kind);
  $('#pe-g-text').hidden = !isText;
  $('#pe-g-size').hidden = !(isText || kind === 'check');
  $('#pe-g-width').hidden = !(['pen', 'rect', 'ell', 'line', 'arrow', 'ink'].includes(kind));
  $('#pe-g-color').hidden = !['text', 'edit', 'date', 'check', 'hl', 'ul', 'st', 'pen', 'rect', 'ell', 'line', 'arrow', 'note', 'ink'].includes(kind);
  $('#pe-font').value = defaults.font;
  $('#pe-size').value = Math.round(defaults.size * 10) / 10;
  $('#pe-width').value = defaults.width;
  $('#pe-bold').setAttribute('aria-pressed', String(!!defaults.bold));
  $('#pe-italic').setAttribute('aria-pressed', String(!!defaults.italic));
  for (const b of $$('#pe-g-text [data-align]')) b.setAttribute('aria-pressed', String(b.dataset.align === defaults.align));
  $('#pe-del').disabled = !sel.size;
  $('#pe-dup').disabled = !sel.size;
}

function applyProp(k, val) {
  defaults[k] = val;
  const targets = [...sel].map(byId).filter(Boolean);
  const keyFor = (a) => ({ font: 'font', size: 'size', bold: 'bold', italic: 'italic', align: 'align', width: 'width', color: 'color' }[k]);
  let changed = false;
  for (const a of targets) {
    if (k === 'color' || (['font', 'size', 'bold', 'italic', 'align'].includes(k) && a.type === 'text') || (k === 'size' && a.type === 'check') || (k === 'width' && SHAPES.has(a.type))) {
      if (!changed) { remember(); changed = true; }
      a[keyFor(a)] = val;
      a.touched = true;
      if (k === 'color' && a.type === 'white') a.color = val;
    }
  }
  if (k === 'color') toolColor[tool] = val;
  if (changed) {
    const ed = document.activeElement?.closest?.('.ann')?.dataset.id;
    for (const a of targets) refreshAnn(a);
    if (ed) { const n = $(`.ann[data-id="${ed}"] .tx`); if (n) focusEnd(n); }
    for (const n of $$('.ann')) n.classList.toggle('on', sel.has(Number(n.dataset.id)));
  }
  syncProps();
}

$('#pe-font').addEventListener('change', (e) => applyProp('font', e.target.value));
$('#pe-size').addEventListener('change', (e) => applyProp('size', Math.max(4, Math.min(200, Number(e.target.value) || 12))));
$('#pe-width').addEventListener('change', (e) => applyProp('width', Math.max(0.5, Math.min(40, Number(e.target.value) || 2))));
$('#pe-color').addEventListener('input', (e) => applyProp('color', e.target.value));
$('#pe-bold').addEventListener('click', () => applyProp('bold', !defaults.bold));
$('#pe-italic').addEventListener('click', () => applyProp('italic', !defaults.italic));
for (const b of $$('#pe-g-text [data-align]')) b.addEventListener('click', () => applyProp('align', b.dataset.align));
for (const b of $$('.pe-props button, .pe-props select, .pe-props input')) b.addEventListener('pointerdown', (e) => { if (e.target.tagName === 'BUTTON') e.preventDefault(); }); // keep focus in the text box

// ============================================================================ tools
const HINTS = { select: 'hintSelect', edit: 'hintEdit', text: 'hintText', hl: 'hintHl', ul: 'hintHl', st: 'hintHl', pen: 'hintPen', rect: 'hintShape', ell: 'hintShape', line: 'hintShape', arrow: 'hintShape', note: 'hintNote', sign: 'hintPlace', date: 'hintDate', check: 'hintCheck', image: 'hintPlace', white: 'hintWhite' };
function setTool(v) {
  tool = v;
  if (v !== 'sign' && v !== 'image') pending = pending && (v === 'select') ? pending : null;
  for (const b of $$('#pe-tools [data-tool]')) b.setAttribute('aria-pressed', String(b.dataset.tool === v));
  $('#pe-pages').dataset.tool = v;
  $('#pe-hint').textContent = pending ? t('hintPlace') : t(HINTS[v]);
  if (toolColor[v] && !sel.size) $('#pe-color').value = toolColor[v];
  syncProps();
}
for (const b of $$('#pe-tools [data-tool]')) {
  b.addEventListener('click', () => {
    const v = b.dataset.tool;
    pending = null;
    document.activeElement?.blur?.();
    select([]);
    setTool(v);
    if (v === 'sign') openSign();
    if (v === 'image') $('#pe-img').click();
  });
}

function addAnn(a) {
  remember();
  a.id = nextId++;
  anns.push(a);
  const v = views.get(a.pg);
  refreshAnn(a);
  select([a.id]);
  return a;
}

/** Drag helper: calls onMove(dx, dy) in CSS px; onUp(moved). */
function dragging(e, onMove, onUp) {
  const sx = e.clientX, sy = e.clientY;
  let moved = false;
  const mv = (ev) => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < 3) return;
    moved = true;
    onMove(dx, dy, ev);
  };
  const up = (ev) => {
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    onUp?.(moved, ev);
  };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function onPageDown(e, v) {
  if (e.target.closest('.ann') || e.target.closest('.fl')) return;
  if (e.button > 0) return;
  const active = document.activeElement;
  if (active?.isContentEditable || active?.tagName === 'TEXTAREA') active.blur();
  const p = toBase(e, v);
  const pg = v.pg;
  const color = $('#pe-color').value;
  if (pending) {
    e.preventDefault();
    const w = pending.w, h = w / pending.ratio;
    addAnn({ type: 'image', pg: pg.id, x: p.x - w / 2, y: p.y - h / 2, w, h, img: pending.img, ratio: pending.ratio });
    pending = null;
    setTool('select');
    return;
  }
  const size = defaults.size;
  switch (tool) {
    case 'edit': {
      e.preventDefault();
      const go = () => { const l = lineAt(v, p); if (l) startEdit(v, l); else select([]); };
      if (v.lines) go(); else ensureLines(v).then(go);
      break;
    }
    case 'text': case 'date': {
      e.preventDefault();
      const txt = tool === 'date' ? new Date().toLocaleDateString(document.documentElement.lang === 'zh' ? 'zh-CN' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const a = addAnn({ type: 'text', pg: pg.id, x: p.x, y: p.y - size * 0.6, w: null, text: txt, font: txt && document.documentElement.lang === 'zh' ? 'cjk' : defaults.font, size, bold: defaults.bold, italic: defaults.italic, align: defaults.align, color });
      requestAnimationFrame(() => focusText(a, !!txt));
      break;
    }
    case 'check':
      e.preventDefault();
      addAnn({ type: 'check', pg: pg.id, x: p.x - size * 0.4, y: p.y - size * 0.6, size: Math.max(size, 14), color });
      break;
    case 'white':
      e.preventDefault();
      addAnn({ type: 'white', pg: pg.id, x: p.x - 50, y: p.y - 10, w: 100, h: 20, color: '#ffffff' });
      break;
    case 'note': {
      e.preventDefault();
      const a = addAnn({ type: 'note', pg: pg.id, x: p.x, y: p.y, text: '', color });
      requestAnimationFrame(() => $(`.ann[data-id="${a.id}"] .np`)?.focus({ preventScroll: true }));
      break;
    }
    case 'hl': case 'ul': case 'st': {
      e.preventDefault();
      ensureLines(v).then((L) => beginMark(e, v, p, L.lines));
      break;
    }
    case 'pen': {
      e.preventDefault();
      remember();
      const a = { id: nextId++, type: 'ink', pg: pg.id, pts: [[p.x, p.y]], color, width: defaults.width };
      anns.push(a);
      let node = refreshAnn(a);
      dragging(e, (dx, dy, ev) => {
        const q = toBase(ev, v), last = a.pts[a.pts.length - 1];
        if (Math.hypot(q.x - last[0], q.y - last[1]) < 0.6) return;
        a.pts.push([q.x, q.y]);
        node = refreshAnn(a);
      }, () => { select([a.id]); });
      break;
    }
    case 'rect': case 'ell': case 'line': case 'arrow': {
      e.preventDefault();
      remember();
      const a = tool === 'rect' || tool === 'ell'
        ? { id: nextId++, type: tool, pg: pg.id, x: p.x, y: p.y, w: 0, h: 0, color, width: defaults.width }
        : { id: nextId++, type: tool, pg: pg.id, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, width: defaults.width };
      anns.push(a);
      dragging(e, (dx, dy, ev) => {
        const q = toBase(ev, v);
        if (a.x1 !== undefined) { a.x2 = q.x; a.y2 = q.y; }
        else { a.x = Math.min(p.x, q.x); a.y = Math.min(p.y, q.y); a.w = Math.abs(q.x - p.x); a.h = Math.abs(q.y - p.y); }
        refreshAnn(a);
      }, (moved) => {
        if (!moved) { anns = anns.filter((x) => x !== a); history.pop(); updateUndo(); renderAnns(v); return; }
        select([a.id]);
      });
      break;
    }
    default: { // select: rubber band
      select([]);
      const band = el('div', { class: 'band' });
      v.layer.append(band);
      const s = S();
      dragging(e, (dx, dy, ev) => {
        const q = toBase(ev, v);
        const x = Math.min(p.x, q.x), y = Math.min(p.y, q.y);
        Object.assign(band.style, { left: `${x * s}px`, top: `${y * s}px`, width: `${Math.abs(q.x - p.x) * s}px`, height: `${Math.abs(q.y - p.y) * s}px` });
      }, (moved, ev) => {
        band.remove();
        if (!moved) return;
        const q = toBase(ev, v);
        const x0 = Math.min(p.x, q.x), x1 = Math.max(p.x, q.x), y0 = Math.min(p.y, q.y), y1 = Math.max(p.y, q.y);
        const ids = anns.filter((a) => a.pg === pg.id).filter((a) => {
          const bb = a.type === 'text' ? textBox(a) : bbox(a);
          return bb.x < x1 && bb.x + bb.w > x0 && bb.y < y1 && bb.y + bb.h > y0;
        }).map((a) => a.id);
        select(ids);
      });
    }
  }
}

function textBox(a) {
  const n = $(`.ann[data-id="${a.id}"]`);
  const v = views.get(a.pg);
  if (!n || !v) return { x: a.x, y: a.y, w: a.w || 10, h: a.size * 1.2 };
  const s = S();
  return { x: a.x, y: a.y, w: n.offsetWidth / s, h: n.offsetHeight / s };
}

function beginMark(e, v, p, lines) {
  remember();
  const a = { id: nextId++, type: tool, pg: v.pg.id, rects: [], color: $('#pe-color').value };
  anns.push(a);
  const compute = (q) => {
    const top = Math.min(p.y, q.y), bot = Math.max(p.y, q.y);
    const hit = lines.filter((l) => l.top <= bot && l.top + l.h >= top);
    const pa = p.y <= q.y ? p : q, pb = p.y <= q.y ? q : p; // upper / lower pointer
    const R = (l, x0, x1) => ({ x: Math.max(l.x, Math.min(x0, x1)), y: l.base - l.size * 0.84, w: Math.max(2, Math.min(l.x + l.w, Math.max(x0, x1)) - Math.max(l.x, Math.min(x0, x1))), h: l.size * 1.08 });
    if (hit.length === 1) {
      const l = hit[0];
      return [Math.abs(p.x - q.x) < 3 ? R(l, l.x, l.x + l.w) : R(l, p.x, q.x)];
    }
    return hit.map((l, i) => (i === 0 ? R(l, pa.x, l.x + l.w) : i === hit.length - 1 ? R(l, l.x, pb.x) : R(l, l.x, l.x + l.w)));
  };
  const finish = (q) => {
    a.rects = compute(q);
    if (!a.rects.length) {
      const x = Math.min(p.x, q.x), y = Math.min(p.y, q.y), w = Math.abs(q.x - p.x), h = Math.abs(q.y - p.y);
      if (w > 4 && h > 3) a.rects = [{ x, y, w, h }];
    }
  };
  dragging(e, (dx, dy, ev) => { finish(toBase(ev, v)); if (a.rects.length) refreshAnn(a); }, (moved, ev) => {
    finish(moved ? toBase(ev, v) : p);
    if (!a.rects.length) { anns = anns.filter((x) => x !== a); history.pop(); updateUndo(); renderAnns(v); return; }
    refreshAnn(a);
    select([a.id]);
  });
}

function onAnnDown(e, a, node, v) {
  const typing = a.type === 'text' && e.target.classList.contains('tx') && document.activeElement === e.target;
  if (typing) return;
  if (e.target.closest('.np')) return;
  if (tool === 'edit' && a.type === 'text' && e.target.classList.contains('tx')) { e.stopPropagation(); select([a.id]); return; } // click → caret
  if (e.target.classList.contains('x')) return;
  // clicking an annotation while a placement/drawing tool is active adds to the page instead of selecting, except text-ish ones
  if (node.classList.contains('pass') && tool !== 'select') return;
  e.stopPropagation();
  const additive = e.shiftKey || e.ctrlKey || e.metaKey;
  if (additive) { if (sel.has(a.id)) { sel.delete(a.id); select([...sel]); } else select([a.id], true); return; }
  if (!sel.has(a.id)) select([a.id]);
  const resizeEl = e.target.closest('.rs');
  e.preventDefault();
  const rot = v.pg.rot, s = S();
  const targets = [...sel].map(byId).filter(Boolean);
  const origin = new Map(targets.map((x) => [x.id, JSON.parse(JSON.stringify(x))]));
  let started = false;
  dragging(e, (dx, dy) => {
    if (!started) { remember(); started = true; }
    const [bx, by] = dBase(rot, dx / s, dy / s);
    if (resizeEl) {
      const o = origin.get(a.id);
      if (a.type === 'text') { a.w = Math.max(20, (o.w || textBox(o).w) + bx); }
      else if (a.type === 'line' || a.type === 'arrow') {
        if (resizeEl.classList.contains('pt-s')) { a.x1 = o.x1 + bx; a.y1 = o.y1 + by; } else { a.x2 = o.x2 + bx; a.y2 = o.y2 + by; }
      } else if (a.type === 'image') { a.w = Math.max(8, o.w + bx); a.h = a.w / a.ratio; }
      else { a.w = Math.max(4, o.w + bx); a.h = Math.max(4, o.h + by); }
      refreshAnn(a);
      for (const n of $$('.ann')) n.classList.toggle('on', sel.has(Number(n.dataset.id)));
      return;
    }
    for (const x of targets) {
      const o = origin.get(x.id);
      Object.assign(x, JSON.parse(JSON.stringify(o)));
      translate(x, bx, by);
      const n = $(`.ann[data-id="${x.id}"]`);
      if (n) { const bb = bbox(x); n.style.left = `${bb.x * s}px`; n.style.top = `${bb.y * s}px`; }
    }
  }, (moved) => {
    if (!moved && a.type === 'text') focusText(a);
    if (moved && resizeEl) { /* handled */ }
    if (moved) for (const x of targets) x.touched = true;
  });
}

// ============================================================================ delete / copy / paste
function deleteSel(ids = [...sel]) {
  if (!ids.length) return;
  remember();
  const pagesTouched = new Set(ids.map((id) => byId(id)?.pg));
  anns = anns.filter((a) => !ids.includes(a.id));
  sel = new Set();
  for (const id of pagesTouched) { const v = views.get(id); if (v) renderAnns(v); }
  syncProps();
}
function copySel() { clip = [...sel].map(byId).filter(Boolean).map((a) => JSON.parse(JSON.stringify(a))); }
function pasteClip(offset = 14) {
  if (!clip.length) return;
  remember();
  const ids = [];
  const fallbackPg = clip[0].pg;
  const target = pgOf(fallbackPg) ? fallbackPg : pgs[0].id;
  for (const c of clip) {
    const a = JSON.parse(JSON.stringify(c));
    a.id = nextId++; a.pg = target;
    delete a.cover; delete a.kill; delete a.lk; delete a.orig;
    translate(a, offset, offset);
    anns.push(a); ids.push(a.id);
  }
  clip = clip.map((c) => { const k = JSON.parse(JSON.stringify(c)); translate(k, offset, offset); return k; });
  renderAll();
  select(ids);
}
$('#pe-del').addEventListener('click', () => deleteSel());
$('#pe-dup').addEventListener('click', () => { copySel(); pasteClip(); });

document.addEventListener('keydown', (e) => {
  if ($('#app')?.getAttribute('aria-busy') === 'true') return;
  if ($('#pe-work').hidden || $('#pe-sig').open) return;
  const ae = document.activeElement;
  const typing = ae?.isContentEditable || ae?.tagName === 'TEXTAREA' || (ae?.tagName === 'INPUT' && !/^(checkbox|radio|button|color)$/.test(ae.type)) || ae?.tagName === 'SELECT';
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && k === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape') { if (typing) ae.blur(); select([]); if (pending) { pending = null; setTool('select'); } return; }
  if (typing) return;
  if (mod && k === 'c' && sel.size) { e.preventDefault(); copySel(); return; }
  if (mod && k === 'x' && sel.size) { e.preventDefault(); copySel(); deleteSel(); return; }
  if (mod && k === 'v' && clip.length) { e.preventDefault(); pasteClip(); return; }
  if (mod && k === 'a') { e.preventDefault(); const v = currentView(); select(anns.filter((a) => a.pg === v?.pg.id).map((a) => a.id)); return; }
  if (!sel.size) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); return; }
  const step = e.shiftKey ? 10 : 1;
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (d) {
    e.preventDefault();
    remember();
    for (const a of [...sel].map(byId).filter(Boolean)) {
      const [bx, by] = dBase(pgOf(a.pg).rot, d[0], d[1]);
      translate(a, bx, by);
      a.touched = true;
      refreshAnn(a);
    }
    for (const n of $$('.ann')) n.classList.toggle('on', sel.has(Number(n.dataset.id)));
  }
});

$('#pe-undo').addEventListener('click', undo);
$('#pe-redo').addEventListener('click', redo);
$('#pe-zin').addEventListener('click', () => setZoom(zoom * 1.2));
$('#pe-zout').addEventListener('click', () => setZoom(zoom / 1.2));
$('#pe-fit').addEventListener('click', () => setZoom(1, true));

// ============================================================================ page panel
let curPage = 0;
function currentView() {
  const mid = window.innerHeight * 0.4;
  let best = null, bestD = Infinity;
  for (const p of pgs) {
    const r = views.get(p.id)?.wrap.getBoundingClientRect();
    if (!r) continue;
    if (r.top <= mid && r.bottom >= mid) return views.get(p.id);
    const d = Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (d < bestD) { bestD = d; best = views.get(p.id); }
  }
  return best;
}
let scrollRaf = 0;
window.addEventListener('scroll', () => {
  if (scrollRaf || $('#pe-work').hidden) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    const v = currentView();
    if (!v) return;
    const idx = pgs.indexOf(v.pg);
    if (idx === curPage) return;
    curPage = idx;
    for (const th of $$('#pe-thumbs .th')) th.classList.toggle('cur', Number(th.dataset.id) === v.pg.id);
    $('#pe-thumbs .th.cur')?.scrollIntoView({ block: 'nearest' });
  });
}, { passive: true });

const thumbCache = new Map();
const thumbIO = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    thumbIO.unobserve(en.target);
    fillThumb(en.target);
  }
}, { root: null, rootMargin: '300px' });
async function fillThumb(th) {
  const pg = pgOf(Number(th.dataset.id));
  if (!pg || pg.src == null) return;
  const key = `${pg.src}:${pg.rot}`;
  let cv = thumbCache.get(key);
  if (!cv) {
    cv = await renderPage(doc, pg.src + 1, 120, pg.rot).catch(() => null);
    if (!cv) return;
    thumbCache.set(key, cv);
  }
  const copy = el('canvas', { width: cv.width, height: cv.height });
  copy.getContext('2d').drawImage(cv, 0, 0);
  copy.style.width = cv.style.width;
  th.querySelector('.ph')?.replaceChildren(copy);
}

function buildThumbs() {
  const list = $('#pe-thumbs');
  list.replaceChildren();
  pgs.forEach((pg, i) => {
    const ph = el('div', { class: 'ph' });
    const r = pg.rot % 180;
    const w = r ? pg.h : pg.w, h = r ? pg.w : pg.h;
    const k = 100 / Math.max(w, h);
    ph.style.width = `${w * k}px`; ph.style.height = `${h * k}px`;
    const th = el('div', { class: `th${i === curPage ? ' cur' : ''}`, draggable: 'true', 'data-id': pg.id },
      ph,
      el('div', { class: 'pn' }, String(i + 1)),
      el('div', { class: 'pa' },
        tb('rotate', t('rotate'), () => rotatePage(pg)),
        tb('copy', t('dupPage'), () => dupPage(pg)),
        tb('up', t('moveUp'), () => movePage(i, i - 1), i === 0),
        tb('down', t('moveDown'), () => movePage(i, i + 1), i === pgs.length - 1),
        tb('trash', t('delPage'), () => delPage(pg), pgs.length < 2)));
    th.addEventListener('click', (e) => { if (e.target.closest('.pa')) return; curPage = i; for (const x of $$('#pe-thumbs .th')) x.classList.toggle('cur', x === th); views.get(pg.id)?.wrap.scrollIntoView({ block: 'start', behavior: 'smooth' }); if (innerWidth < 860) $('#pe-side').classList.remove('open'); });
    if (pg.src == null) ph.style.background = '#fff'; else thumbIO.observe(th);
    list.append(th);
  });
}
const tb = (ic, label, fn, disabled) => el('button', { type: 'button', title: label, 'aria-label': label, disabled: !!disabled, onclick: (e) => { e.stopPropagation(); fn(); } }, pic(ic));
sortable($('#pe-thumbs'), (from, to) => movePage(from, to));

function pageChanged() { if (fitMode) computeFit(); rebuildPages(); }
function rotatePage(pg) { remember(); pg.rot = (pg.rot + 90) % 360; pageChanged(); views.get(pg.id)?.wrap.scrollIntoView({ block: 'nearest' }); }
function movePage(from, to) { if (to < 0 || to >= pgs.length) return; remember(); move(pgs, from, to); pageChanged(); }
function delPage(pg) {
  if (pgs.length < 2) return;
  remember();
  pgs = pgs.filter((p) => p !== pg);
  anns = anns.filter((a) => a.pg !== pg.id);
  sel = new Set([...sel].filter((id) => byId(id)));
  pageChanged();
}
function dupPage(pg) {
  remember();
  const copy = { ...pg, id: nextPg++ };
  pgs.splice(pgs.indexOf(pg) + 1, 0, copy);
  for (const a of anns.filter((x) => x.pg === pg.id)) {
    const c = JSON.parse(JSON.stringify(a));
    c.id = nextId++; c.pg = copy.id;
    if (c.lk) c.lk = `${copy.id}:${c.kill[0]}`;
    anns.push(c);
  }
  pageChanged();
}
function addBlank() {
  const v = currentView();
  const base = v?.pg || pgs[0];
  remember();
  const pg = { id: nextPg++, src: null, w: base.w, h: base.h, rot: 0 };
  pgs.splice(pgs.indexOf(base) + 1, 0, pg);
  pageChanged();
  setTimeout(() => views.get(pg.id)?.wrap.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
}
$('#pe-addpage').addEventListener('click', addBlank);
$('#pe-panel').addEventListener('click', () => $('#pe-side').classList.toggle('open'));

// ============================================================================ signature & images
const SIG_KEY = 'lk-pe-signatures';
const readSigs = () => { try { return JSON.parse(localStorage.getItem(SIG_KEY) || '[]'); } catch { return []; } };
const writeSigs = (list) => { try { localStorage.setItem(SIG_KEY, JSON.stringify(list.slice(0, 6))); } catch { /* storage unavailable */ } };

const pad = $('#pe-pad');
const pctx = pad.getContext('2d');
let drawing = false, drawn = false, sigTab = 'draw', sigUpload = null;
const padPoint = (e) => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * (pad.width / r.width), (e.clientY - r.top) * (pad.height / r.height)]; };
pad.addEventListener('pointerdown', (e) => {
  drawing = true; drawn = true;
  pad.setPointerCapture(e.pointerId);
  Object.assign(pctx, { lineWidth: 6, lineCap: 'round', lineJoin: 'round', strokeStyle: '#10204a' });
  pctx.beginPath();
  pctx.moveTo(...padPoint(e));
});
pad.addEventListener('pointermove', (e) => { if (!drawing) return; pctx.lineTo(...padPoint(e)); pctx.stroke(); });
pad.addEventListener('pointerup', () => { drawing = false; });

const SIG_FONT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", "Bradley Hand", "STXingkai", "KaiTi", "Kaiti SC", cursive';
function drawTyped() {
  const cv = $('#pe-sigprev');
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const text = $('#pe-sigtext').value.trim();
  if (!text) return;
  let px = 150;
  ctx.font = `${px}px ${SIG_FONT}`;
  while (ctx.measureText(text).width > cv.width - 60 && px > 30) { px -= 6; ctx.font = `${px}px ${SIG_FONT}`; }
  ctx.fillStyle = '#10204a';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, cv.width / 2, cv.height / 2);
}
$('#pe-sigtext').addEventListener('input', drawTyped);

for (const b of $$('#pe-sig [data-tab]')) {
  b.addEventListener('click', () => {
    sigTab = b.dataset.tab;
    for (const x of $$('#pe-sig [data-tab]')) x.setAttribute('aria-selected', String(x === b));
    for (const p of $$('#pe-sig [data-pane]')) p.hidden = p.dataset.pane !== sigTab;
    if (sigTab === 'type') $('#pe-sigtext').focus();
  });
}

/** Crops transparent (or near-white, for uploads) margins and makes white transparent. */
function trimCanvas(cv, whiteToAlpha) {
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = img.data;
  let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const i = (y * cv.width + x) * 4;
    if (whiteToAlpha) {
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      d[i + 3] = lum > 200 ? 0 : Math.min(255, (230 - lum) * 4);
    }
    if (d[i + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  if (whiteToAlpha) ctx.putImageData(img, 0, 0);
  const m = 6;
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(cv.width - 1, x1 + m); y1 = Math.min(cv.height - 1, y1 + m);
  const out = el('canvas', { width: x1 - x0 + 1, height: y1 - y0 + 1 });
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function imageToCanvas(file, max = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = el('canvas', { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv;
}
$('#pe-sigfile').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) sigUpload = await imageToCanvas(f, 1200); });

function renderSaved() {
  const list = readSigs();
  const box = $('#pe-saved');
  box.hidden = !list.length;
  box.replaceChildren(el('span', { class: 'small muted' }, t('savedSigs')),
    ...list.map((s, i) => el('span', { class: 'sv' },
      el('button', { type: 'button', class: 'use', title: t('use'), onclick: () => placeSignature(s.src, s.ratio) }, el('img', { src: s.src, alt: '' })),
      el('button', { type: 'button', class: 'rm', title: t('del'), 'aria-label': t('del'), onclick: () => { const l = readSigs(); l.splice(i, 1); writeSigs(l); renderSaved(); } }, '×'))));
}
function openSign() { renderSaved(); $('#pe-sig').showModal(); }
function placeSignature(src, ratio) {
  const key = `sig${Object.keys(imgs).length}_${Date.now()}`;
  imgs[key] = src;
  pending = { img: key, ratio, w: 150 };
  $('#pe-sig').close();
  setTool('select');
  $('#pe-hint').textContent = t('hintPlace');
}
$('#pe-sig-use').addEventListener('click', () => {
  let cv = null;
  if (sigTab === 'draw' && drawn) cv = trimCanvas(pad, false);
  else if (sigTab === 'type') { drawTyped(); cv = trimCanvas($('#pe-sigprev'), false); }
  else if (sigTab === 'upload' && sigUpload) cv = trimCanvas(sigUpload, true);
  if (!cv) return;
  const src = cv.toDataURL('image/png'), ratio = cv.width / cv.height;
  if ($('#pe-sig-save').checked) { const l = readSigs().filter((x) => x.src !== src); l.unshift({ src, ratio }); writeSigs(l); }
  placeSignature(src, ratio);
});
$('#pe-sig-clear').addEventListener('click', () => { pctx.clearRect(0, 0, pad.width, pad.height); drawn = false; $('#pe-sigtext').value = ''; drawTyped(); sigUpload = null; $('#pe-sigfile').value = ''; });
$('#pe-sig-cancel').addEventListener('click', () => { $('#pe-sig').close(); setTool('select'); });
$('#pe-sig').addEventListener('cancel', () => setTool('select'));

$('#pe-img').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) { setTool('select'); return; }
  const cv = await imageToCanvas(f);
  const key = `img${Date.now()}`;
  imgs[key] = cv.toDataURL('image/png');
  pending = { img: key, ratio: cv.width / cv.height, w: Math.min(260, srcWidth() * 0.5) };
  setTool('select');
  $('#pe-hint').textContent = t('hintPlace');
});
const srcWidth = () => pgs[0]?.w || 400;

// ============================================================================ form fields
async function detectForm(buf) {
  const lib = await pdflib();
  const pdf = await openForEdit(buf);
  const form = pdf.getForm();
  const fields = form.getFields();
  if (!fields.length) return null;
  // widget → page
  const pageOf = new Map();
  pdf.getPages().forEach((p, i) => { const an = p.node.Annots(); if (an) for (let k = 0; k < an.size(); k++) { const r = an.get(k); pageOf.set(r.toString(), i); } });
  const out = [];
  for (const f of fields) {
    let kind = null;
    if (f instanceof lib.PDFTextField) kind = 'text';
    else if (f instanceof lib.PDFCheckBox) kind = 'check';
    else if (f instanceof lib.PDFRadioGroup) kind = 'radio';
    else if (f instanceof lib.PDFDropdown) kind = 'select';
    else if (f instanceof lib.PDFOptionList) kind = 'select';
    if (!kind) continue;
    const widgets = [];
    for (const w of f.acroField.getWidgets()) {
      const ref = pdf.context.getObjectRef(w.dict);
      const src = ref ? pageOf.get(ref.toString()) : undefined;
      if (src == null) continue;
      let on = null;
      if (kind === 'radio' || kind === 'check') { try { on = w.getOnValue()?.decodeText?.() ?? null; } catch { /* no on value */ } }
      widgets.push({ src, rect: w.getRectangle(), on });
    }
    if (!widgets.length) continue;
    const info = { name: f.getName(), kind, widgets, readOnly: f.isReadOnly() };
    if (kind === 'text') { info.value = f.getText() || ''; info.multiline = f.isMultiline(); info.maxLength = f.getMaxLength(); }
    if (kind === 'check') info.value = f.isChecked();
    if (kind === 'radio') { info.value = f.getSelected() || ''; const opts = f.getOptions(); info.widgets.forEach((w, i) => { w.on = opts[i] ?? w.on; }); }
    if (kind === 'select') { info.options = f.getOptions(); info.value = f.getSelected()[0] || ''; }
    out.push(info);
  }
  return out.length ? { fields: out } : null;
}

function renderForms(v) {
  for (const n of $$('.fl', v.layer)) n.remove();
  if (!formInfo || v.pg.src == null) return;
  if (pgs.find((p) => p.src === v.pg.src) !== v.pg) return; // duplicated pages keep the original's fields only
  const s = S(), vp = srcPages[v.pg.src].vp1;
  for (const f of formInfo.fields) {
    f.widgets.forEach((w, wi) => {
      if (w.src !== v.pg.src) return;
      const [x1, y1] = vp.convertToViewportPoint(w.rect.x, w.rect.y), [x2, y2] = vp.convertToViewportPoint(w.rect.x + w.rect.width, w.rect.y + w.rect.height);
      const x = Math.min(x1, x2), y = Math.min(y1, y2), ww = Math.abs(x2 - x1), hh = Math.abs(y2 - y1);
      const cur = f.name in formVals ? formVals[f.name] : f.value;
      let inp;
      if (f.kind === 'text') {
        inp = el(f.multiline ? 'textarea' : 'input', { class: 'fi', type: f.multiline ? null : 'text', 'aria-label': f.name, maxlength: f.maxLength || null });
        inp.value = cur;
        inp.style.fontSize = `${Math.max(8, Math.min(hh * 0.62, 16)) * s}px`;
        inp.addEventListener('input', () => { formVals[f.name] = inp.value; });
      } else if (f.kind === 'check') {
        inp = el('input', { class: 'fi', type: 'checkbox', 'aria-label': f.name });
        inp.checked = !!cur;
        inp.addEventListener('change', () => { formVals[f.name] = inp.checked; });
      } else if (f.kind === 'radio') {
        inp = el('input', { class: 'fi', type: 'radio', name: `pe-${f.name}`, value: w.on ?? String(wi), 'aria-label': `${f.name}: ${w.on ?? wi}` });
        inp.checked = cur === (w.on ?? String(wi));
        inp.addEventListener('change', () => { if (inp.checked) { formVals[f.name] = inp.value; for (const r of $$(`input[type=radio]`)) if (r.name === inp.name && r !== inp) r.checked = false; } });
      } else {
        inp = el('select', { class: 'fi', 'aria-label': f.name }, el('option', { value: '' }, ''), ...f.options.map((o) => el('option', { value: o }, o)));
        inp.value = cur;
        inp.style.fontSize = `${Math.max(8, Math.min(hh * 0.62, 16)) * s}px`;
        inp.addEventListener('change', () => { formVals[f.name] = inp.value; });
      }
      inp.disabled = f.readOnly;
      const box = el('div', { class: 'fl' }, inp);
      Object.assign(box.style, { left: `${x * s}px`, top: `${y * s}px`, width: `${ww * s}px`, height: `${hh * s}px` });
      v.layer.append(box);
    });
  }
}

// ============================================================================ save
const dirty = () => anns.length || Object.keys(formVals).length || pgs.length !== srcPages.length || pgs.some((p, i) => p.src !== i || p.rot) ;

$('#pe-save').addEventListener('click', async () => {
  document.activeElement?.blur?.();
  $('#pe-alert').replaceChildren();
  if (!dirty()) { $('#pe-alert').replaceChildren(alertBox(t('empty'), 'info')); return; }
  $('#pe-save').disabled = true;
  const task = progress($('#pe-task'), { lock: true, title: t('saving') });
  try {
    const vps = new Map(), items = new Map();
    for (const pg of pgs) {
      vps.set(pg.id, viewport(pg));
      if (anns.some((a) => a.pg === pg.id && a.kill)) items.set(pg.id, { strs: (await ensureLines(views.get(pg.id))).strs, ops: await showOpTexts(srcPages[pg.src].page) });
    }
    const flatten = $('#pe-flatten').checked;
    const res = await buildPdf({ bytes, pgs, anns, imgs, vps, items, form: formInfo ? { values: formVals, flatten } : null }, (p) => task.set(p));
    task.close();
    const blob = pdfBlob(res.bytes);
    const outName = `${name}-edited.pdf`;
    download(blob, outName);
    const subs = anns.some((a) => a.cover);
    $('#pe-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtBytes(res.bytes.length))),
      subs ? el('p', { class: 'note' }, t('fontNote')) : null,
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: () => download(blob, outName) }, icon('download'), t('download')))));
  } catch (e) {
    task.close();
    console.error(e);
    $('#pe-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#pe-save').disabled = false;
  }
});

// test hook (read-only view of the editor state)
window.__pe = { lines: async (i = 0) => (await ensureLines(views.get(pgs[i].id))).lines, get anns() { return anns; }, get pgs() { return pgs; }, get formVals() { return formVals; } };
