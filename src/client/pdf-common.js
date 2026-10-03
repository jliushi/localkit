// Shared PDF helpers: pdf.js for rendering, pdf-lib for writing. Both load on demand.
import { LK, el } from './lib.js';

let pdfjsPromise = null;
export function pdfjs() {
  pdfjsPromise ||= import('pdfjs-dist').then((m) => {
    m.GlobalWorkerOptions.workerSrc = `${LK.base}/vendor/pdfjs/pdf.worker.min.mjs`;
    return m;
  });
  return pdfjsPromise;
}

export const pdflib = () => import('pdf-lib');

/** Releases a pdf.js document (the API moved between versions). */
export function closeDoc(doc) {
  if (!doc) return;
  const pending = typeof doc.destroy === 'function' ? doc.destroy() : doc.loadingTask?.destroy?.();
  pending?.catch?.(() => {});
}

export class PdfError extends Error {}

/** Opens a PDF for rendering. `bytes` is copied because pdf.js transfers the buffer to its worker. */
export async function openForRender(bytes) {
  const lib = await pdfjs();
  try {
    return await lib.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
  } catch (e) {
    if (e?.name === 'PasswordException') throw new PdfError(LK.lang === 'zh' ? '这个 PDF 有密码保护，请先用密码打开并另存为无密码版本。' : 'This PDF is password-protected. Open it with its password and save an unprotected copy first.');
    throw new PdfError(LK.lang === 'zh' ? '无法读取这个 PDF 文件，它可能已损坏。' : 'This file could not be read as a PDF. It may be damaged.');
  }
}

/** Loads a PDF for editing with pdf-lib. */
export async function openForEdit(bytes) {
  const { PDFDocument } = await pdflib();
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
  } catch (e) {
    if (/encrypt/i.test(e?.message || '')) throw new PdfError(LK.lang === 'zh' ? '这个 PDF 已加密，无法编辑。请先用密码打开并另存为无密码版本。' : 'This PDF is encrypted and cannot be edited. Open it with its password and save an unprotected copy first.');
    throw new PdfError(LK.lang === 'zh' ? '无法读取这个 PDF 文件，它可能已损坏。' : 'This file could not be read as a PDF. It may be damaged.');
  }
}

/** Renders one page into a new canvas whose longest side is about `size` CSS pixels. */
export async function renderPage(doc, pageNumber, size = 160, extraRotation = 0) {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1, rotation: (page.rotate + extraRotation) % 360 });
  const scale = size / Math.max(base.width, base.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vp = page.getViewport({ scale: scale * dpr, rotation: (page.rotate + extraRotation) % 360 });
  const canvas = el('canvas', { width: Math.ceil(vp.width), height: Math.ceil(vp.height) });
  canvas.style.width = `${Math.ceil(vp.width / dpr)}px`;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp, canvas }).promise;
  page.cleanup();
  return canvas;
}

export const readBytes = async (file) => new Uint8Array(await file.arrayBuffer());

export const pdfBlob = (bytes) => new Blob([bytes], { type: 'application/pdf' });

/**
 * Parses page ranges like "1-3, 5, 8-" into arrays of 1-based page numbers.
 * Returns [[1,2,3],[5],[8,9,10]] for a 10-page document; throws on invalid input.
 */
export function parseRanges(text, pageCount) {
  const groups = [];
  for (const part of text.trim().replace(/\s*([-–~])\s*/g, '$1').split(/[,，;；\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*[-–~]\s*(\d*)$/) || part.match(/^(\d+)$/);
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

/** Makes children of `list` reorderable by dragging; calls onMove(from, to). Works with mouse and touch. */
export function sortable(list, onMove) {
  let dragIndex = -1;
  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest('[draggable="true"]');
    if (!item) return;
    dragIndex = [...list.children].indexOf(item);
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  list.addEventListener('dragend', (e) => { e.target.closest?.('[draggable="true"]')?.classList.remove('dragging'); dragIndex = -1; });
  list.addEventListener('dragover', (e) => { if (dragIndex >= 0) e.preventDefault(); });
  list.addEventListener('drop', (e) => {
    if (dragIndex < 0) return;
    e.preventDefault();
    const target = e.target.closest('[draggable="true"]');
    const to = target ? [...list.children].indexOf(target) : list.children.length - 1;
    if (to >= 0 && to !== dragIndex) onMove(dragIndex, to);
    dragIndex = -1;
  });
}

export function move(arr, from, to) {
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
}
