// Shared PDF helpers: pdf.js for rendering, pdf-lib for writing. Both load on demand.
import { LK, el, icon } from './lib.js';

let pdfjsPromise = null;
export function pdfjs() {
  pdfjsPromise ||= import('pdfjs-dist').then((m) => {
    m.GlobalWorkerOptions.workerSrc = `${LK.base}/vendor/pdfjs/pdf.worker.min.mjs`;
    return m;
  });
  return pdfjsPromise;
}

export const pdflib = () => import('pdf-lib');

export class PdfError extends Error {}

const MSG = {
  en: { pw: 'This PDF is password-protected. Open it with its password and save an unprotected copy first.', bad: 'This file could not be read as a PDF. It may be damaged.' },
  zh: { pw: '这个 PDF 有密码保护。请先用密码打开，另存为无密码的副本后再试。', bad: '无法把这个文件读取为 PDF，它可能已损坏。' },
};
const msg = (k) => (MSG[LK.lang] || MSG.en)[k];

/** Opens a PDF for rendering. `bytes` is copied because pdf.js transfers the buffer to its worker. */
export async function openForRender(bytes) {
  const lib = await pdfjs();
  try {
    return await lib.getDocument({ data: bytes.slice(0), isEvalSupported: false, standardFontDataUrl: `${LK.base}/vendor/pdfjs/standard_fonts/` }).promise;
  } catch (e) {
    throw new PdfError(e?.name === 'PasswordException' ? msg('pw') : msg('bad'));
  }
}

/** Loads a PDF for editing with pdf-lib. */
export async function openForEdit(bytes) {
  const { PDFDocument } = await pdflib();
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    throw new PdfError(/encrypt/i.test(e?.message || '') ? msg('pw') : msg('bad'));
  }
}

export function closeDoc(doc) {
  if (!doc) return;
  const pending = typeof doc.destroy === 'function' ? doc.destroy() : doc.loadingTask?.destroy?.();
  pending?.catch?.(() => {});
}

/** Renders one page into a canvas whose longest side is about `size` CSS pixels. */
export async function renderPage(doc, pageNumber, size = 160, extraRotation = 0) {
  const page = await doc.getPage(pageNumber);
  const rot = (page.rotate + extraRotation) % 360;
  const base = page.getViewport({ scale: 1, rotation: rot });
  const scale = size / Math.max(base.width, base.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vp = page.getViewport({ scale: scale * dpr, rotation: rot });
  const canvas = el('canvas', { width: Math.ceil(vp.width), height: Math.ceil(vp.height) });
  canvas.style.width = `${Math.ceil(vp.width / dpr)}px`;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  page.cleanup();
  return canvas;
}

export const readBytes = async (file) => new Uint8Array(await file.arrayBuffer());
export const pdfBlob = (bytes) => new Blob([bytes], { type: 'application/pdf' });

/** "1-3, 5, 8-" → [[1,2,3],[5],[8..n]]; throws PdfError(part) on invalid input. */
export function parseRanges(text, pageCount) {
  const groups = [];
  for (const part of text.trim().replace(/\s*([-–~～])\s*/g, '$1').split(/[,，;；\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*[-–~～]\s*(\d*)$/) || part.match(/^(\d+)$/);
    if (!m) throw new PdfError(part);
    let a, b;
    if (m.length === 2) a = b = Number(m[1]);
    else { a = m[1] ? Number(m[1]) : 1; b = m[2] ? Number(m[2]) : pageCount; }
    if (a < 1 || b > pageCount || a > b) throw new PdfError(part);
    groups.push(Array.from({ length: b - a + 1 }, (_, i) => a + i));
  }
  if (!groups.length) throw new PdfError(text);
  return groups;
}

/** Drag-to-reorder for the direct children of `list` that have draggable="true". */
export function sortable(list, onMove) {
  let from = -1;
  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest?.('[draggable="true"]');
    if (!item || item.parentElement !== list) return;
    from = [...list.children].indexOf(item);
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(from));
  });
  list.addEventListener('dragend', (e) => { e.target.closest?.('[draggable="true"]')?.classList.remove('dragging'); });
  list.addEventListener('dragover', (e) => { if (from >= 0) e.preventDefault(); });
  list.addEventListener('drop', (e) => {
    if (from < 0) return;
    e.preventDefault();
    const target = e.target.closest('[draggable="true"]');
    const to = target && target.parentElement === list ? [...list.children].indexOf(target) : list.children.length - 1;
    if (to >= 0 && to !== from) onMove(from, to);
    from = -1;
  });
}

export function move(arr, from, to) {
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
}

export const SAMPLE_PDF = () => ({ url: `${LK.base}/assets/samples/sample.pdf`, name: 'sample.pdf', type: 'application/pdf' });

/** Small icon button used on page thumbnails. */
export const tbtn = (name, label, onclick, disabled) => el('button', { type: 'button', title: label, 'aria-label': label, onclick, disabled: !!disabled }, icon(name));

