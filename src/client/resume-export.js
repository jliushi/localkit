// Pagination + export for the resume builder.
//
// Approach: each A4 sheet hosts a full template frame; module sections are
// distributed across the sheets by measured pixel height (whole sections move,
// so nothing is ever clipped across a break; a section taller than one page
// keeps its inner article rows intact where the template renders them as
// .pv-item pages). PDF output rides the browser's native print path
// (intercepted beforeprint when available) — text stays selectable and the
// page breaks are guaranteed to match the preview, because both use the very
// same pre-paginated DOM. PNG/JPG rasterize the preview sheets through an
// SVG foreignObject snapshot of the local stylesheet.
import { el } from './lib.js';
import { A4 } from './resume-model.js';
import { buildRoots } from './resume-view.js';

export const MARGIN_DEFAULT = 64;
const contentH = (style) => A4.h - ((style.margin ?? MARGIN_DEFAULT) * 2 - MARGIN_DEFAULT);
const sheetPadding = (style) => Math.round((style.margin ?? MARGIN_DEFAULT) / 2);

/** Lane content width for measuring. */
export function laneWidth(tpl, style, slot = 'flow') {
  const w = A4.w - 2 * sheetPadding(style);
  const pairs = { neon: [246, 18], orbit: [268, 22], atlas: [Math.round((w - 28) / 2), 8], ivory: [216, 26], bfly: [260, 24], yolk: [236, 22] };
  if (tpl === 'bob') return Math.round((w - 36) / 3);
  if (tpl in pairs) {
    const [sideW, gap] = pairs[tpl];
    return slot === 'side' ? sideW - 44 : w - sideW - gap;
  }
  return w;
}

// ---------------------------------------------------------------- measure

/**
 * Renders one pass off-screen and measures every module section plus the head.
 * Returns { headH, footerH, sections: [{ el, h, slot }], head } — els stay in the
 * measured frame which the caller keeps around for the actual sheets.
 */
export function measure(doc, t, host) {
  const frame = buildRoots(doc, t).frame;
  const style = doc.style;
  const box = el('div', { class: 'pv-measure', style: { position: 'absolute', left: '-100000px', top: '0px', width: `${A4.w}px` } });
  box.append(frame);
  (host || document.body).append(box);
  for (const lane of frame.querySelectorAll('[data-slot]')) lane.style.width = `${laneWidth(doc.template, style, lane.dataset.slot)}px`;
  const sections = [];
  for (const lane of frame.querySelectorAll('[data-slot]')) {
    for (const sec of lane.querySelectorAll(':scope > .pv-se')) {
      sec.style.marginBottom = '0px';
      sections.push({ el: sec, h: sec.getBoundingClientRect().height, slot: lane.dataset.slot });
    }
  }
  const headEl = frame.querySelector('.pv-headline, .pv-bob-head, .pv-tr-head');
  const headH = headEl ? headEl.getBoundingClientRect().height : 0;
  const footEl = frame.querySelector('.pv-foot');
  const footerH = footEl ? footEl.getBoundingClientRect().height : 0;
  return { frame, sections, headEl, headH, footerH, box };
}

/**
 * Distributes measured sections into pages (page 1 includes head height).
 * Ordering inside a lane stays stable (per-slot lists).
 */
export function paginate(measured, doc) {
  const H = contentH(doc.style);
  const pages = [newPage()];
  for (const slot of ['head', 'A', 'B', 'C', 'flow', 'main', 'side', 'table']) {
    const list = measured.sections.filter((s) => s.slot === slot);
    let lanePage = 0;
    let used = pageContentBase(measured, slot, doc);
    for (const s of list) {
      if (used > 4 && used + s.h > H - measured.footerH) { lanePage++; used = 0; }
      while (pages.length <= lanePage) pages.push(newPage());
      pages[lanePage].items.push(s);
      used += s.h;
      s.pageIndex = lanePage;
    }
  }
  return { pages, pageCount: pages.length };
}
const newPage = () => ({ items: [] });
function pageContentBase(measured, slot, doc) {
  if (slot === 'head' || slot === 'table' || slot === 'flow' || slot === 'main') return measured.headH;
  return slot === 'side' && ['ivory'].includes(doc.template) ? measured.headH : 0;
}

/** Builds the stack of real A4 sheets from a measured pass. */
export function buildSheets(doc, t, measured, spec, { root } = {}) {
  root ??= el('div', { class: 'pv-host' });
  root.replaceChildren();
  const pad = sheetPadding(doc.style);
  for (let pi = 0; pi < spec.pages.length; pi++) {
    const { frame } = buildRoots(doc, t);
    const sheet = el('div', { class: 'pv-sheet', 'data-page': pi + 1, style: { width: `${A4.w}px`, height: `${A4.h}px`, padding: `${pad}px` } });
    const inner = el('div', { class: 'pv-sheet-in' });
    for (const lane of frame.querySelectorAll('[data-slot]')) {
      const want = lane.dataset.slot;
      const shell = lane.closest('.pv-lane') || lane;
      const list = measured.sections.filter((s) => s.pageIndex === pi && s.slot === want);
      shell.replaceChildren(...list.map((s) => s.el));
    }
    if (pi > 0) for (const dup of frame.querySelectorAll('.pv-headline, .pv-bob-head, .pv-rail-head, .pv-top, .pv-foot, .pv-tr-head ~ .pv-tr-head')) dup.remove();
    // Table template: rows are sections inside the table row wrapper; keep head row on page 0 only.
    if (['ledger', 'ledger2'].includes(doc.template) && pi > 0) stripTableHead(frame);
    inner.append(frame);
    sheet.append(inner, el('i', { class: 'pv-sheet-n', texts: [`${pi + 1}`] }));
    root.append(sheet);
  }
  return root;
}
function stripTableHead(frame) { frame.querySelector('.pv-tr-head')?.remove(); }

// ---------------------------------------------------------------- fit

/** Tries spacing/type tiers until the sheet fits one page. renderPages(style) → page count. */
export async function computeFit(doc, t, renderPages) {
  const style0 = structuredClone(doc.style);
  const tiers = [];
  for (const g of [1, 0.9, 0.8, 0.72, 0.66]) for (const f of [1, 0.96, 0.92, 0.88, 0.84]) tiers.push([g, f]);
  for (const [g, f] of tiers) {
    if (g === 1 && f === 1) continue;
    const s = { ...style0, fontSize: Math.max(9, +(style0.fontSize * f).toFixed(1)), moduleGap: Math.round(style0.moduleGap * g), itemGap: Math.round(style0.itemGap * g), headGap: Math.round(style0.headGap * g), lineHeight: Math.max(1.18, +(style0.lineHeight * (0.92 + 0.08 * g)).toFixed(2)) };
    const pages = await renderPages(s);
    if (pages <= 1) return { style: s, ok: true };
  }
  return { style: null, ok: false };
}

// ---------------------------------------------------------------- image

/** Rasterizes a width/height-fixed node through an SVG foreignObject snapshot. */
export async function rasterize(node, { scale = 2, background = '#ffffff' } = {}) {
  const w = node.offsetWidth, h = node.offsetHeight;
  const cssText = collectCss();
  const clone = node.cloneNode(true);
  clone.querySelectorAll('.pv-sheet-n').forEach((n) => n.remove());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}"><foreignObject x="0" y="0" width="${w}" height="${h}" style="
    transform-origin: 0 0"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;overflow:hidden"><style>${cssText}</style>${clone.outerHTML}</div></foreignObject></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('snapshot failed')); img.src = url; });
    const cv = el('canvas', { width: w * scale, height: h * scale });
    const cx = cv.getContext('2d');
    cx.fillStyle = background;
    cx.fillRect(0, 0, cv.width, cv.height);
    cx.setTransform(scale, 0, 0, scale, 0, 0);
    cx.drawImage(img, 0, 0, w, h);
    return cv;
  } finally { URL.revokeObjectURL(url); }
}
const collectCss = () => {
  let out = '';
  for (const sheet of document.styleSheets) {
    try { for (const rule of sheet.cssRules) out += rule.cssText + '\n'; } catch { /* cross-origin sheets ignored */ }
  }
  return out + '.rb-printing{display:block}';
};

/** canvas → Blob */
export const canvasBlob = (cv, mime, q = 0.9) => new Promise((res) => cv.toBlob(res, mime, q));

// ---------------------------------------------------------------- print

/** Appends the sheets as the print frame, runs window.print(), resolves after. */
export function printRoot(root, title) {
  return new Promise((resolve) => {
    const prev = document.title;
    if (title) document.title = title;
    const done = () => { document.body.classList.remove('rb-printing'); root.remove(); if (title) document.title = prev; resolve(); };
    root.id = 'print-root';
    document.body.append(root);
    document.body.classList.add('rb-printing');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
    setTimeout(() => { if (document.body.classList.contains('rb-printing') && !matchMedia('print').matches) done(); }, 1600);
  });
}
