// Export: browser print (vector PDF), image PDF (pdf-lib), PNG/JPG (SVG foreignObject -> canvas), JSON.
import { download, downloadZip } from './lib.js';
import { A4 } from './resume-data.js';
import { buildPages, ensureCss } from './resume-layout.js';
import { RV_CSS } from './resume-css.js';

const safeName = (s) => (String(s || 'resume').replace(/[\\/:*?"<>|]+/g, '').trim() || 'resume').slice(0, 60);

/** Print path: pre-paginated page windows are put into #rv-print and the browser print dialog is opened. */
export async function printPdf(doc, fit, title) {
  ensureCss();
  const { pages, count } = buildPages(doc);
  document.getElementById('rv-print')?.remove();
  const box = document.createElement('div');
  box.id = 'rv-print';
  box.append(...pages);
  document.body.append(box);
  const prevTitle = document.title;
  document.title = safeName(title);
  const cleanup = () => { box.remove(); document.title = prevTitle; window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.print();
  // some browsers never fire afterprint (or print() returns immediately); keep DOM a little while
  setTimeout(() => { if (box.isConnected) cleanup(); }, 120000);
  return count;
}

async function pageToCanvas(page, scale) {
  const w = A4.w, h = A4.h;
  const xml = new XMLSerializer().serializeToString(page);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px"><style>${RV_CSS.replace(/]]>/g, '')}</style>${xml}</div></foreignObject></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('render failed')); img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = w * scale; canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}
const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

/** Renders every page to canvases. */
export async function renderPages(doc, fit, scale = 2, onProgress) {
  ensureCss();
  const { pages } = buildPages(doc);
  const out = [];
  for (let i = 0; i < pages.length; i++) { out.push(await pageToCanvas(pages[i], scale)); onProgress?.((i + 1) / pages.length); }
  return out;
}

export async function exportImages(doc, fit, type, title, onProgress) {
  const canvases = await renderPages(doc, fit, 2, onProgress);
  const ext = type === 'image/png' ? 'png' : 'jpg';
  const files = [];
  for (let i = 0; i < canvases.length; i++) {
    files.push({ name: canvases.length > 1 ? `${safeName(title)}-${i + 1}.${ext}` : `${safeName(title)}.${ext}`, blob: await toBlob(canvases[i], type, 0.93) });
  }
  if (files.length === 1) download(files[0].blob, files[0].name); else await downloadZip(files, `${safeName(title)}.zip`);
  return files.length;
}

/** Image-based PDF built in the browser (exact look; text is not selectable). */
export async function exportImagePdf(doc, fit, title, onProgress) {
  const { PDFDocument } = await import('pdf-lib');
  const canvases = await renderPages(doc, fit, 2, onProgress);
  const pdf = await PDFDocument.create();
  pdf.setTitle(safeName(title));
  pdf.setProducer('LocalKit Resume Builder');
  for (const cv of canvases) {
    const jpg = await pdf.embedJpg(await (await toBlob(cv, 'image/jpeg', 0.92)).arrayBuffer());
    const page = pdf.addPage([595.28, 841.89]);
    page.drawImage(jpg, { x: 0, y: 0, width: 595.28, height: 841.89 });
  }
  download(new Blob([await pdf.save()], { type: 'application/pdf' }), `${safeName(title)}.pdf`);
  return canvases.length;
}

export function exportJson(doc) {
  download(new Blob([JSON.stringify({ app: 'localkit-resume', ...doc }, null, 2)], { type: 'application/json' }), `${safeName(doc.name)}.json`);
}

/** Reads a File into a data URL. */
export const readAsDataUrl = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
