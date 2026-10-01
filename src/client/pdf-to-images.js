import { $, t, c, el, dropzone, download, downloadZip, baseName, fmtBytes, status } from './lib.js';
import { openForRender, readBytes, parseRanges, PdfError , closeDoc } from './pdf-common.js';

const st = status($('#pi-status'));
let bytes = null, name = '', count = 0;

dropzone($('#pi-drop'), {
  accept: '.pdf,application/pdf',
  onFiles: async ([file]) => {
    st.clear();
    try {
      bytes = await readBytes(file);
      name = baseName(file.name);
      const doc = await openForRender(bytes);
      count = doc.numPages;
      closeDoc(doc);
      $('#pi-info').textContent = t('fileInfo', file.name, count);
      $('#pi-go').disabled = false;
    } catch (e) {
      st.error(e);
    }
  },
});

$('#pi-go').addEventListener('click', async () => {
  let pages;
  try {
    const r = $('#pi-ranges').value.trim();
    pages = r ? [...new Set(parseRanges(r, count).flat())] : Array.from({ length: count }, (_, i) => i + 1);
  } catch (e) {
    st.error(new PdfError(t('badRange', e.message)));
    return;
  }
  const type = $('#pi-fmt').value;
  const ext = type === 'image/png' ? 'png' : 'jpg';
  const scale = Number($('#pi-dpi').value) / 72;
  $('#pi-go').disabled = true;
  $('#pi-results').replaceChildren();
  const outs = [];
  try {
    const doc = await openForRender(bytes);
    for (let i = 0; i < pages.length; i++) {
      st.busy(t('working', i + 1, pages.length), (i / pages.length) * 100);
      const page = await doc.getPage(pages[i]);
      const vp = page.getViewport({ scale });
      const canvas = el('canvas', { width: Math.round(vp.width), height: Math.round(vp.height) });
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
      page.cleanup();
      const blob = await new Promise((r) => canvas.toBlob(r, type, 0.92));
      const fname = `${name}_page${pages[i]}.${ext}`;
      outs.push({ name: fname, blob });
      $('#pi-results').append(el('div', { class: 'result' },
        el('img', { src: URL.createObjectURL(blob), alt: '' }),
        el('div', { class: 'name', text: fname }),
        el('div', { text: `${canvas.width} × ${canvas.height} · ${fmtBytes(blob.size)}` }),
        el('button', { class: 'btn ghost', text: `⬇ ${c('download')}`, onclick: () => download(blob, fname) })));
    }
    closeDoc(doc);
    if (outs.length === 1) download(outs[0].blob, outs[0].name);
    else await downloadZip(outs, `${name}_images.zip`);
    st.ok(t('done', outs.length));
  } catch (e) {
    st.error(e);
  } finally {
    $('#pi-go').disabled = false;
  }
});
