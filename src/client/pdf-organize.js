import { $, t, el, dropzone, download, baseName, status } from './lib.js';
import { openForRender, openForEdit, renderPage, readBytes, pdfBlob, pdflib, sortable, move, PdfError , closeDoc } from './pdf-common.js';

const st = status($('#po-status'));
const grid = $('#po-thumbs');
let bytes = null, name = '';
let pages = []; // { n (1-based original), rot (extra degrees), deleted, canvas }
let doc = null;

function render() {
  grid.replaceChildren(...pages.map((p, i) => {
    const holder = el('div', { class: 'thumb-img' }, p.canvas);
    p.canvas.style.transform = `rotate(${p.rot}deg)`;
    p.canvas.style.transition = 'transform .2s';
    return el('div', { class: `thumb${p.deleted ? ' deleted' : ''}`, draggable: 'true' },
      holder,
      el('div', { class: 'pg', text: t('page', p.n) }),
      el('div', { class: 'tools' },
        el('button', { title: t('left'), 'aria-label': t('left'), text: '←', disabled: i === 0, onclick: () => { move(pages, i, i - 1); render(); } }),
        el('button', { title: t('rotL'), 'aria-label': t('rotL'), text: '⟲', onclick: () => { p.rot = (p.rot + 270) % 360; render(); } }),
        el('button', { title: t('rotR'), 'aria-label': t('rotR'), text: '⟳', onclick: () => { p.rot = (p.rot + 90) % 360; render(); } }),
        el('button', { title: t('del'), 'aria-label': t('del'), text: '🗑', onclick: () => { p.deleted = !p.deleted; render(); } }),
        el('button', { title: t('right'), 'aria-label': t('right'), text: '→', disabled: i === pages.length - 1, onclick: () => { move(pages, i, i + 1); render(); } })));
  }));
}

sortable(grid, (from, to) => { move(pages, from, to); render(); });

dropzone($('#po-drop'), {
  accept: '.pdf,application/pdf',
  onFiles: async ([file]) => {
    st.clear();
    try {
      bytes = await readBytes(file);
      name = baseName(file.name);
      closeDoc(doc);
      doc = await openForRender(bytes);
      pages = [];
      $('#po-work').hidden = false;
      $('#po-drop').hidden = true;
      st.busy(t('loading'));
      for (let n = 1; n <= doc.numPages; n++) {
        pages.push({ n, rot: 0, deleted: false, canvas: await renderPage(doc, n, 110) });
        if (n % 4 === 0 || n === doc.numPages) render();
      }
      st.clear();
    } catch (e) {
      st.error(e);
    }
  },
});

$('#po-rotall').addEventListener('click', () => { for (const p of pages) p.rot = (p.rot + 90) % 360; render(); });
$('#po-reset').addEventListener('click', () => { pages = []; grid.replaceChildren(); $('#po-work').hidden = true; $('#po-drop').hidden = false; st.clear(); });

$('#po-save').addEventListener('click', async () => {
  const keep = pages.filter((p) => !p.deleted);
  if (!keep.length) { st.error(new PdfError(t('allDeleted'))); return; }
  st.busy(t('saving'));
  try {
    const { PDFDocument, degrees } = await pdflib();
    const src = await openForEdit(bytes);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, keep.map((p) => p.n - 1));
    copied.forEach((page, i) => {
      const extra = keep[i].rot;
      if (extra) page.setRotation(degrees((page.getRotation().angle + extra) % 360));
      out.addPage(page);
    });
    download(pdfBlob(await out.save()), `${name}_edited.pdf`);
    st.ok(t('done', keep.length));
  } catch (e) {
    st.error(e);
  }
});
