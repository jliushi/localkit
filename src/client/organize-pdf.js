import { $, t, el, icon, filePicker, progress, alertBox, errorText, download, fmtBytes, baseName } from './lib.js';
import { openForRender, openForEdit, renderPage, readBytes, pdfBlob, pdflib, sortable, move, closeDoc, SAMPLE_PDF, tbtn } from './pdf-common.js';

const sources = []; // { bytes, doc }
let pages = []; // { src, n, rot, deleted, sel, canvas }
let name = 'document', last = -1;
const grid = $('#po-pages');

const pick = filePicker($('#po-pick'), { accept: '.pdf,application/pdf', iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: ([f]) => { reset(); addPdf(f); } });
filePicker($('#po-add'), { accept: '.pdf,application/pdf', compact: true, iconName: 'plus', title: t('addPdf'), onFiles: ([f]) => addPdf(f) });

function reset() {
  for (const s of sources) closeDoc(s.doc);
  sources.length = 0;
  pages = [];
  grid.replaceChildren();
  $('#po-result').replaceChildren();
  $('#po-alert').replaceChildren();
}

function card(p, i) {
  if (p.canvas) p.canvas.style.transform = `rotate(${p.rot}deg) scale(${p.rot % 180 ? 0.72 : 1})`;
  return el('div', { class: `pg selectable${p.sel ? ' sel' : ''}${p.deleted ? ' off' : ''}`, draggable: 'true', 'data-i': i },
    el('div', { class: 'pv' }, p.canvas || el('span', { class: 'spinner' })),
    el('div', { class: 'num', text: t('page', i + 1) }),
    el('div', { class: 'pg-tools' },
      tbtn('arrowLeft', t('left'), (e) => { e.stopPropagation(); move(pages, i, i - 1); render(); }, i === 0),
      tbtn('rotateCcw', t('rotL'), (e) => { e.stopPropagation(); p.rot = (p.rot + 270) % 360; render(); }),
      tbtn('rotateCw', t('rotR'), (e) => { e.stopPropagation(); p.rot = (p.rot + 90) % 360; render(); }),
      tbtn('trash', t('del'), (e) => { e.stopPropagation(); p.deleted = !p.deleted; render(); }),
      tbtn('arrowRight', t('right'), (e) => { e.stopPropagation(); move(pages, i, i + 1); render(); }, i === pages.length - 1)));
}

function render() {
  grid.replaceChildren(...pages.map(card));
  const sel = pages.filter((p) => p.sel).length;
  $('#po-sum').textContent = t('summary', pages.length, sel, pages.filter((p) => p.deleted).length);
  $('#po-rotsel').disabled = $('#po-delsel').disabled = !sel;
}

async function addPdf(file) {
  $('#po-pick').hidden = true;
  $('#po-work').hidden = false;
  if (!sources.length) name = baseName(file.name);
  try {
    const bytes = await readBytes(file);
    const doc = await openForRender(bytes);
    const src = sources.push({ bytes, doc }) - 1;
    const fresh = Array.from({ length: doc.numPages }, (_, i) => ({ src, n: i + 1, rot: 0, deleted: false, sel: false, canvas: null }));
    pages.push(...fresh);
    render();
    for (const p of fresh) {
      p.canvas = await renderPage(doc, p.n, 150);
      const idx = pages.indexOf(p);
      const node = grid.children[idx];
      if (node) node.replaceWith(card(p, idx));
    }
  } catch (e) {
    $('#po-alert').replaceChildren(alertBox(errorText(e)));
    if (!sources.length) { $('#po-pick').hidden = false; $('#po-work').hidden = true; }
  }
}

grid.addEventListener('click', (e) => {
  const node = e.target.closest('.pg');
  if (!node || e.target.closest('button')) return;
  const i = Number(node.dataset.i);
  if (e.shiftKey && last >= 0) {
    const [a, b] = [Math.min(last, i), Math.max(last, i)];
    for (let k = a; k <= b; k++) pages[k].sel = true;
  } else pages[i].sel = !pages[i].sel;
  last = i;
  render();
});
sortable(grid, (from, to) => { move(pages, from, to); render(); });

$('#po-rotall').addEventListener('click', () => { for (const p of pages) p.rot = (p.rot + 90) % 360; render(); });
$('#po-rotsel').addEventListener('click', () => { for (const p of pages) if (p.sel) p.rot = (p.rot + 90) % 360; render(); });
$('#po-delsel').addEventListener('click', () => { for (const p of pages) if (p.sel) { p.deleted = true; p.sel = false; } render(); });
$('#po-selall').addEventListener('click', () => { for (const p of pages) p.sel = true; render(); });
$('#po-selnone').addEventListener('click', () => { for (const p of pages) p.sel = false; render(); });

$('#po-save').addEventListener('click', async () => {
  const keep = pages.filter((p) => !p.deleted);
  if (!keep.length) { $('#po-alert').replaceChildren(alertBox(t('allDeleted'))); return; }
  $('#po-alert').replaceChildren();
  $('#po-save').disabled = true;
  const task = progress($('#po-task'), { title: t('saving') });
  try {
    const { PDFDocument, degrees } = await pdflib();
    const out = await PDFDocument.create();
    const loaded = await Promise.all(sources.map((s) => openForEdit(s.bytes)));
    for (let i = 0; i < keep.length; i++) {
      const p = keep[i];
      const [page] = await out.copyPages(loaded[p.src], [p.n - 1]);
      if (p.rot) page.setRotation(degrees((page.getRotation().angle + p.rot) % 360));
      out.addPage(page);
      if (i % 20 === 0) task.set(i / keep.length);
    }
    const bytes = await out.save();
    task.close();
    const blob = pdfBlob(bytes);
    const outName = `${name}-organized.pdf`;
    download(blob, outName);
    $('#po-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', keep.length, fmtBytes(bytes.length))),
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: () => download(blob, outName) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
  } catch (e) {
    task.close();
    $('#po-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#po-save').disabled = false;
  }
});
