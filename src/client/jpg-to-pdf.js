import { $, $$, t, c, el, icon, filePicker, progress, alertBox, errorText, download, fmtBytes, extOf, LK } from './lib.js';
import { pdflib, pdfBlob, sortable, move, tbtn } from './pdf-common.js';
import { IMAGE_ACCEPT, decodeImage, drawRotated, toBlob, imageSize } from './image-core.js';

const items = []; // { file, img, rot, thumb }
const grid = $('#ip-pages');
const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

const sample = { url: `${LK.base}/assets/samples/photo.jpg`, name: 'photo.jpg', type: 'image/jpeg' };
const pick = filePicker($('#ip-pick'), { accept: IMAGE_ACCEPT, multiple: true, iconName: 'images', title: t('drop'), hint: t('dropHint'), sample, onFiles: add });
filePicker($('#ip-more'), { accept: IMAGE_ACCEPT, multiple: true, compact: true, iconName: 'plus', title: t('add'), onFiles: add });

function card(it, i) {
  return el('div', { class: 'pg', draggable: 'true' },
    el('div', { class: 'pv' }, it.thumb || el('span', { class: 'spinner' })),
    el('div', { class: 'num', text: t('image', i + 1) }),
    el('div', { class: 'pg-tools' },
      tbtn('arrowLeft', t('left'), () => { move(items, i, i - 1); render(); }, i === 0),
      tbtn('rotateCcw', t('rotL'), () => { it.rot = (it.rot + 270) % 360; it.thumb = drawRotated(it.img, it.rot, 300); render(); }),
      tbtn('rotateCw', t('rotR'), () => { it.rot = (it.rot + 90) % 360; it.thumb = drawRotated(it.img, it.rot, 300); render(); }),
      tbtn('x', c('remove'), () => { items.splice(i, 1); render(); }),
      tbtn('arrowRight', t('right'), () => { move(items, i, i + 1); render(); }, i === items.length - 1)));
}

function render() {
  grid.replaceChildren(...items.map(card));
  $('#ip-count').textContent = t('count', items.length);
  $('#ip-pick').hidden = items.length > 0;
  $('#ip-work').hidden = items.length === 0;
  $('#ip-go').disabled = !items.some((x) => x.img);
}
sortable(grid, (from, to) => { move(items, from, to); render(); });

async function add(files) {
  $('#ip-result').replaceChildren();
  $('#ip-alert').replaceChildren();
  const fresh = files.map((file) => ({ file, img: null, rot: 0, thumb: null }));
  items.push(...fresh);
  render();
  for (const it of fresh) {
    try {
      it.img = await decodeImage(it.file);
      it.thumb = drawRotated(it.img, 0, 300);
    } catch (e) {
      items.splice(items.indexOf(it), 1);
      $('#ip-alert').replaceChildren(alertBox(`${it.file.name}: ${errorText(e)}`));
    }
    render();
  }
}

$('#ip-go').addEventListener('click', async () => {
  const size = $$('input[name="ip-size"]').find((r) => r.checked).value;
  const orient = $$('input[name="ip-or"]').find((r) => r.checked).value;
  const margin = Number($$('input[name="ip-m"]').find((r) => r.checked).value);
  $('#ip-go').disabled = true;
  const list = items.filter((x) => x.img);
  const task = progress($('#ip-task'), { title: t('creating', 1, list.length) });
  try {
    const { PDFDocument } = await pdflib();
    const pdf = await PDFDocument.create();
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      task.title(t('creating', i + 1, list.length));
      // JPGs that need no rotation are embedded byte-for-byte; everything else is re-encoded.
      let image;
      const ext = extOf(it.file.name);
      if (!it.rot && (ext === 'jpg' || ext === 'jpeg' || it.file.type === 'image/jpeg')) {
        try { image = await pdf.embedJpg(new Uint8Array(await it.file.arrayBuffer())); } catch { image = null; }
        // An EXIF-rotated photo decodes with swapped dimensions; PDF ignores EXIF, so re-encode those.
        const [w0, h0] = imageSize(it.img);
        if (image && (image.width !== w0 || image.height !== h0)) image = null;
      }
      if (!image && !it.rot && (ext === 'png' || it.file.type === 'image/png')) {
        try { image = await pdf.embedPng(new Uint8Array(await it.file.arrayBuffer())); } catch { image = null; }
      }
      if (!image) {
        const cv = drawRotated(it.img, it.rot, 4000, '#fff');
        image = await pdf.embedJpg(new Uint8Array(await (await toBlob(cv, 'image/jpeg', 0.92)).arrayBuffer()));
      }
      const [iw0, ih0] = imageSize(it.img);
      const [iw, ih] = it.rot % 180 ? [ih0, iw0] : [iw0, ih0];
      let pw, ph;
      if (size === 'fit') { pw = iw * 0.75 + margin * 2; ph = ih * 0.75 + margin * 2; } else {
        [pw, ph] = SIZES[size];
        const landscape = orient === 'l' || (orient === 'auto' && iw > ih);
        if (landscape) [pw, ph] = [ph, pw];
      }
      const page = pdf.addPage([pw, ph]);
      const k = Math.min((pw - margin * 2) / iw, (ph - margin * 2) / ih);
      const w = iw * k, h = ih * k;
      page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      task.set((i + 1) / list.length);
    }
    const bytes = await pdf.save();
    task.close();
    const blob = pdfBlob(bytes);
    const name = list.length === 1 ? `${list[0].file.name.replace(/\.[^.]+$/, '')}.pdf` : 'images.pdf';
    download(blob, name);
    $('#ip-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', list.length, fmtBytes(bytes.length))),
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: () => download(blob, name) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => { items.length = 0; render(); pick.open(); } }, t('another')))));
  } catch (e) {
    task.close();
    $('#ip-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#ip-go').disabled = false;
  }
});
