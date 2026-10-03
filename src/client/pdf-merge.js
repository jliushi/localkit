import { $, t, c, el, dropzone, download, fmtBytes, status, beginTask } from './lib.js';
import { openForEdit, readBytes, pdfBlob, pdflib, sortable, move } from './pdf-common.js';

const items = []; // { file, bytes, pages, error }
const st = status($('#pm-status'));
const list = $('#pm-files');
const go = $('#pm-go');

function render() {
  list.replaceChildren(...items.map((it, i) => el('li', { draggable: 'true' },
    el('span', { class: 'handle', text: '⋮⋮', 'aria-hidden': 'true' }),
    el('span', { class: 'name', text: it.file.name, title: it.file.name }),
    el('span', { class: 'meta', text: it.error ? it.error : `${t('pages', it.pages ?? '…')} · ${fmtBytes(it.file.size)}` }),
    el('button', { class: 'btn danger', text: '↑', title: t('up'), disabled: i === 0, onclick: () => { move(items, i, i - 1); render(); } }),
    el('button', { class: 'btn danger', text: '↓', title: t('down'), disabled: i === items.length - 1, onclick: () => { move(items, i, i + 1); render(); } }),
    el('button', { class: 'btn danger', text: '×', title: c('remove'), onclick: () => { items.splice(i, 1); render(); } }))));
  go.disabled = items.some((x) => !x.error && !x.pages) || items.filter((x) => !x.error && x.pages).length < 2;
}

sortable(list, (from, to) => { move(items, from, to); render(); });

dropzone($('#pm-drop'), {
  accept: '.pdf,application/pdf',
  multiple: true,
  onFiles: async (files) => {
    st.clear();
    for (const file of files) {
      const it = { file, bytes: null, pages: null, error: null };
      items.push(it);
      render();
      try {
        it.bytes = await readBytes(file);
        it.pages = (await openForEdit(it.bytes)).getPageCount();
      } catch (e) {
        it.error = e.message;
      }
      render();
    }
  },
});

go.addEventListener('click', async () => {
  const ok = items.filter((x) => !x.error && x.pages);
  if (ok.length < 2) { st.error(new Error(t('needTwo'))); return; }
  go.disabled = true;
  const task = beginTask();
  st.busy(t('merging'));
  try {
    const { PDFDocument } = await pdflib();
    const out = await PDFDocument.create();
    for (const it of ok) {
      const src = await openForEdit(it.bytes);
      const pages = await out.copyPages(src, src.getPageIndices());
      for (const p of pages) out.addPage(p);
    }
    const bytes = await out.save();
    download(pdfBlob(bytes), t('outName'));
    st.ok(t('done', ok.length, out.getPageCount(), fmtBytes(bytes.length)));
  } catch (e) {
    st.error(e);
  } finally {
    render();
    task.finish();
  }
});
