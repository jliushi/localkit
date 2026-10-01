import { $, t, c, el, icon, filePicker, progress, alertBox, errorText, download, fmtBytes } from './lib.js';
import { openForRender, openForEdit, renderPage, readBytes, pdfBlob, pdflib, sortable, move, closeDoc, SAMPLE_PDF, tbtn } from './pdf-common.js';

const items = []; // { file, bytes, pages, thumb, error }
const list = $('#pm-list');

const pick = filePicker($('#pm-pick'), {
  accept: '.pdf,application/pdf', multiple: true, iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: add,
});
filePicker($('#pm-more'), { accept: '.pdf,application/pdf', multiple: true, compact: true, iconName: 'plus', title: t('add'), onFiles: add });

function render() {
  list.replaceChildren(...items.map((it, i) => el('li', { draggable: 'true' },
    el('span', { class: 'handle', 'aria-hidden': 'true' }, icon('grip')),
    it.thumb || el('span', { class: 'spinner' }),
    el('span', { class: 'name', text: it.file.name, title: it.file.name }),
    el('span', { class: 'meta', text: it.error ? it.error : it.pages == null ? t('reading') : `${it.pages === 1 ? t('page1') : t('pages', it.pages)} · ${fmtBytes(it.file.size)}` }),
    el('span', { class: 'pg-tools' },
      tbtn('arrowUp', t('up'), () => { move(items, i, i - 1); render(); }, i === 0),
      tbtn('arrowDown', t('down'), () => { move(items, i, i + 1); render(); }, i === items.length - 1),
      tbtn('x', c('remove'), () => { items.splice(i, 1); render(); })))));
  const ok = items.filter((x) => x.pages);
  $('#pm-total').textContent = ok.length ? t('total', ok.length, ok.reduce((a, x) => a + x.pages, 0)) : '';
  $('#pm-go').disabled = ok.length < 2;
  $('#pm-pick').hidden = items.length > 0;
  $('#pm-work').hidden = items.length === 0;
}

sortable(list, (from, to) => { move(items, from, to); render(); });

async function add(files) {
  $('#pm-result').replaceChildren();
  $('#pm-alert').replaceChildren();
  const fresh = files.map((file) => ({ file, bytes: null, pages: null, thumb: null, error: null }));
  items.push(...fresh);
  render();
  for (const it of fresh) {
    try {
      it.bytes = await readBytes(it.file);
      const doc = await openForRender(it.bytes);
      it.pages = doc.numPages;
      it.thumb = await renderPage(doc, 1, 52);
      closeDoc(doc);
    } catch (e) {
      it.error = e.message;
    }
    render();
  }
  if (items.filter((x) => x.pages).length === 1) $('#pm-alert').replaceChildren(alertBox(t('needTwo'), 'info'));
}

$('#pm-go').addEventListener('click', async () => {
  const ok = items.filter((x) => x.pages);
  $('#pm-go').disabled = true;
  $('#pm-alert').replaceChildren();
  const task = progress($('#pm-task'), { title: t('merging') });
  try {
    const { PDFDocument } = await pdflib();
    const out = await PDFDocument.create();
    for (let i = 0; i < ok.length; i++) {
      const src = await openForEdit(ok[i].bytes);
      for (const p of await out.copyPages(src, src.getPageIndices())) out.addPage(p);
      task.set((i + 1) / ok.length);
    }
    const bytes = await out.save();
    task.close();
    const blob = pdfBlob(bytes);
    download(blob, t('outName'));
    $('#pm-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', ok.length, out.getPageCount(), fmtBytes(bytes.length))),
      el('div', { class: 'actions' }, el('button', { class: 'btn lg', onclick: () => download(blob, t('outName')) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => { items.length = 0; render(); $('#pm-result').replaceChildren(); pick.open(); } }, c('startOver')))));
  } catch (e) {
    task.close();
    $('#pm-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#pm-go').disabled = items.filter((x) => x.pages).length < 2;
  }
});
