import { $, t, c, el, dropzone, download, fmtBytes, extOf, status } from './lib.js';
import { pdflib, pdfBlob, sortable, move } from './pdf-common.js';

const st = status($('#sp-status'));
const grid = $('#sp-thumbs');
const items = []; // { file, bitmap, rot, preview }
const MAX_SIDE = 2200;

async function decode(file) {
  let blob = file;
  if (/^(heic|heif)$/.test(extOf(file.name)) || /image\/hei[cf]/.test(file.type)) {
    const { default: heic2any } = await import('heic2any');
    const r = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
    blob = Array.isArray(r) ? r[0] : r;
  }
  return createImageBitmap(blob, { imageOrientation: 'from-image' });
}

/** Draws the bitmap rotated and scaled so the longest side is at most `max`. */
function drawRotated(bitmap, rot, max) {
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * k), h = Math.round(bitmap.height * k);
  const swap = rot % 180 !== 0;
  const cv = el('canvas', { width: swap ? h : w, height: swap ? w : h });
  const ctx = cv.getContext('2d');
  ctx.translate(cv.width / 2, cv.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(bitmap, -w / 2, -h / 2, w, h);
  return cv;
}

// ---------------------------------------------------------------- scanner filters

function percentile(hist, total, p) {
  let acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * p) return i; }
  return 255;
}

export function applyFilter(cv, filter) {
  if (filter === 'original') return cv;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = img.data;
  const n = cv.width * cv.height;
  const gray = new Uint8ClampedArray(n);
  const hist = new Uint32Array(256);
  for (let i = 0, j = 0; j < n; i += 4, j++) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    gray[j] = g;
    hist[gray[j]]++;
  }
  const lo = percentile(hist, n, 0.01);
  const hi = Math.max(lo + 1, percentile(hist, n, 0.97));
  const stretch = (v) => ((v - lo) * 255) / (hi - lo);

  if (filter === 'enhance') {
    for (let i = 0; i < d.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const v = stretch(d[i + k]) / 255;
        d[i + k] = 255 * (v < 0.5 ? 2 * v * v : 1 - 2 * (1 - v) * (1 - v)) * 0.35 + stretch(d[i + k]) * 0.65; // mild S-curve
      }
    }
  } else if (filter === 'gray') {
    for (let i = 0, j = 0; j < n; i += 4, j++) d[i] = d[i + 1] = d[i + 2] = stretch(gray[j]);
  } else if (filter === 'bw') {
    // Bradley–Roth adaptive threshold: a pixel is black if it is clearly darker than its neighbourhood.
    const w = cv.width, h = cv.height;
    const integral = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += gray[y * w + x];
        integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
      }
    }
    const r = Math.max(8, Math.round(Math.max(w, h) / 24));
    const T = 0.15;
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
        const count = (x1 - x0 + 1) * (y1 - y0 + 1);
        const sum = integral[(y1 + 1) * (w + 1) + x1 + 1] - integral[y0 * (w + 1) + x1 + 1] - integral[(y1 + 1) * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
        const v = gray[y * w + x] * count <= sum * (1 - T) ? 0 : 255;
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

// ---------------------------------------------------------------- UI

async function preview(item) {
  const cv = applyFilter(drawRotated(item.bitmap, item.rot, 360), $('#sp-filter').value);
  item.preview = cv;
}

function render() {
  grid.replaceChildren(...items.map((it, i) => el('div', { class: 'thumb', draggable: 'true' },
    el('div', { class: 'thumb-img' }, it.preview),
    el('div', { class: 'pg', text: t('page', i + 1) }),
    el('div', { class: 'tools' },
      el('button', { title: t('left'), text: '←', disabled: i === 0, onclick: () => { move(items, i, i - 1); render(); } }),
      el('button', { title: t('rotL'), text: '⟲', onclick: async () => { it.rot = (it.rot + 270) % 360; await preview(it); render(); } }),
      el('button', { title: t('rotR'), text: '⟳', onclick: async () => { it.rot = (it.rot + 90) % 360; await preview(it); render(); } }),
      el('button', { title: c('remove'), text: '×', onclick: () => { items.splice(i, 1); render(); } }),
      el('button', { title: t('right'), text: '→', disabled: i === items.length - 1, onclick: () => { move(items, i, i + 1); render(); } })))));
  $('#sp-go').disabled = !items.length;
}

async function add(files) {
  st.clear();
  for (const file of files) {
    try {
      const it = { file, bitmap: await decode(file), rot: 0, preview: null };
      await preview(it);
      items.push(it);
      render();
    } catch (e) {
      st.error(e);
    }
  }
}

sortable(grid, (from, to) => { move(items, from, to); render(); });
dropzone($('#sp-drop'), { accept: 'image/*,.heic,.heif', multiple: true, onFiles: add });
$('#sp-cam').addEventListener('change', (e) => { add([...e.target.files]); e.target.value = ''; });
$('#sp-filter').addEventListener('change', async () => { for (const it of items) await preview(it); render(); });

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

$('#sp-go').addEventListener('click', async () => {
  $('#sp-go').disabled = true;
  try {
    const { PDFDocument } = await pdflib();
    const doc = await PDFDocument.create();
    const filter = $('#sp-filter').value;
    const margin = Number($('#sp-margin').value);
    for (let i = 0; i < items.length; i++) {
      st.busy(t('working', i + 1, items.length), (i / items.length) * 100);
      await new Promise((r) => setTimeout(r));
      const cv = applyFilter(drawRotated(items[i].bitmap, items[i].rot, MAX_SIDE), filter);
      const type = filter === 'bw' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise((r) => cv.toBlob(r, type, 0.85));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const image = type === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      let [pw, ph] = $('#sp-size').value === 'fit' ? [cv.width * 0.75 + margin * 2, cv.height * 0.75 + margin * 2] : SIZES[$('#sp-size').value];
      if ($('#sp-size').value !== 'fit' && cv.width > cv.height) [pw, ph] = [ph, pw]; // landscape photo → landscape page
      const page = doc.addPage([pw, ph]);
      const k = Math.min((pw - margin * 2) / cv.width, (ph - margin * 2) / cv.height);
      const w = cv.width * k, h = cv.height * k;
      page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
    const bytes = await doc.save();
    download(pdfBlob(bytes), t('outName'));
    st.ok(t('done', items.length, fmtBytes(bytes.length)));
  } catch (e) {
    st.error(e);
  } finally {
    $('#sp-go').disabled = false;
  }
});
