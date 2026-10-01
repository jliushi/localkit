import { $, t, el, dropzone, download, downloadZip, baseName, status } from './lib.js';
import { openForRender, openForEdit, renderPage, readBytes, pdfBlob, pdflib, parseRanges, PdfError , closeDoc } from './pdf-common.js';

const st = status($('#ps-status'));
let bytes = null, name = '', count = 0;
const selected = new Set();

function updateCount() {
  $('#ps-count').textContent = t('selectedN', selected.size, count);
  for (const th of document.querySelectorAll('#ps-thumbs .thumb')) th.classList.toggle('selected', selected.has(Number(th.dataset.n)));
}

$('#ps-mode').addEventListener('change', () => { $('#ps-ranges-wrap').hidden = $('#ps-mode').value !== 'ranges'; });
$('#ps-all').addEventListener('click', () => { for (let i = 1; i <= count; i++) selected.add(i); updateCount(); });
$('#ps-none').addEventListener('click', () => { selected.clear(); updateCount(); });

dropzone($('#ps-drop'), {
  accept: '.pdf,application/pdf',
  onFiles: async ([file]) => {
    st.clear();
    selected.clear();
    $('#ps-thumbs').replaceChildren();
    try {
      bytes = await readBytes(file);
      name = baseName(file.name);
      const doc = await openForRender(bytes);
      count = doc.numPages;
      $('#ps-work').hidden = false;
      updateCount();
      st.busy(t('loading'));
      for (let n = 1; n <= count; n++) {
        const th = el('div', { class: 'thumb', 'data-n': n, tabindex: 0, role: 'checkbox' }, el('div', { class: 'pg', text: t('page', n) }));
        th.addEventListener('click', () => { selected.has(n) ? selected.delete(n) : selected.add(n); updateCount(); });
        th.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); th.click(); } });
        $('#ps-thumbs').append(th);
      }
      for (let n = 1; n <= count; n++) $(`#ps-thumbs .thumb[data-n="${n}"]`).prepend(await renderPage(doc, n, 120));
      st.clear();
      closeDoc(doc);
    } catch (e) {
      st.error(e);
    }
  },
});

$('#ps-go').addEventListener('click', async () => {
  const mode = $('#ps-mode').value;
  let groups;
  try {
    if (mode === 'selected') {
      if (!selected.size) throw new PdfError(t('noneSelected'));
      groups = [[...selected].sort((a, b) => a - b)];
    } else if (mode === 'ranges') {
      try { groups = parseRanges($('#ps-ranges').value, count); } catch (e) { throw new PdfError(t('badRange', e.message)); }
    } else {
      groups = Array.from({ length: count }, (_, i) => [i + 1]);
    }
  } catch (e) {
    st.error(e);
    return;
  }
  st.busy(t('working'));
  try {
    const { PDFDocument } = await pdflib();
    const src = await openForEdit(bytes);
    const outs = [];
    for (const g of groups) {
      const doc = await PDFDocument.create();
      for (const p of await doc.copyPages(src, g.map((n) => n - 1))) doc.addPage(p);
      const label = g.length === 1 ? `${g[0]}` : `${g[0]}-${g[g.length - 1]}`;
      outs.push({ name: `${name}_${mode === 'selected' && g.length > 1 ? 'pages' : `p${label}`}.pdf`, blob: pdfBlob(await doc.save()) });
    }
    if (outs.length === 1) download(outs[0].blob, outs[0].name);
    else await downloadZip(outs, `${name}_split.zip`);
    st.ok(t('done', outs.length));
  } catch (e) {
    st.error(e);
  }
});
