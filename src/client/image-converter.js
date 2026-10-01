import { $, t, c, el, dropzone, download, downloadZip, fmtBytes, baseName, extOf, status } from './lib.js';

const files = [];
const outputs = [];
const st = status($('#ic-status'));
const fmt = $('#ic-format');
const q = $('#ic-q');
const go = $('#ic-go');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/x-icon': 'ico' };

// Disable AVIF when the browser can't encode it (toBlob silently falls back to PNG).
(async () => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 2;
  const b = await new Promise((r) => cv.toBlob(r, 'image/avif', 0.5));
  if (b?.type !== 'image/avif') {
    const o = fmt.querySelector('option[value="image/avif"]');
    o.disabled = true;
    o.textContent = o.dataset.labelNo;
  }
})();

function refresh() {
  go.disabled = !files.length;
  go.textContent = t('convert', files.length);
  $('#ic-clear').hidden = !files.length;
  const lossy = ['image/jpeg', 'image/webp', 'image/avif'].includes(fmt.value);
  $('#ic-q-wrap').hidden = !lossy;
  $('#ic-bg-wrap').hidden = fmt.value !== 'image/jpeg';
  $('#ic-files').replaceChildren(...files.map((f, i) => el('li', {},
    el('span', { class: 'name', text: f.name }), el('span', { class: 'meta', text: fmtBytes(f.size) }),
    el('button', { class: 'btn danger', text: '×', 'aria-label': 'remove', onclick: () => { files.splice(i, 1); refresh(); } }))));
}

const isHeic = (f) => /^(heic|heif)$/.test(extOf(f.name)) || /image\/hei[cf]/.test(f.type);

async function decode(file) {
  let blob = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import('heic2any');
    const res = await heic2any({ blob: file, toType: 'image/png' });
    blob = Array.isArray(res) ? res[0] : res;
  }
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    // SVG and some formats only decode through <img>.
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    URL.revokeObjectURL(img.src);
    return img;
  }
}

/** Wraps a PNG in an ICO container (Vista+ PNG-compressed icon). */
async function pngToIco(pngBlob, w, h) {
  const png = new Uint8Array(await pngBlob.arrayBuffer());
  const buf = new ArrayBuffer(22);
  const v = new DataView(buf);
  v.setUint16(2, 1, true); v.setUint16(4, 1, true);
  v.setUint8(6, w >= 256 ? 0 : w); v.setUint8(7, h >= 256 ? 0 : h);
  v.setUint16(10, 1, true); v.setUint16(12, 32, true);
  v.setUint32(14, png.length, true); v.setUint32(18, 22, true);
  return new Blob([buf, png], { type: 'image/x-icon' });
}

async function convertOne(file, type, quality, max, bg) {
  const img = await decode(file);
  let w = img.width, h = img.height;
  const limit = type === 'image/x-icon' ? Math.min(max || 256, 256) : max;
  if (limit && Math.max(w, h) > limit) {
    const k = limit / Math.max(w, h);
    w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
  }
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  img.close?.();
  const encodeType = type === 'image/x-icon' ? 'image/png' : type;
  let blob = await new Promise((r) => cv.toBlob(r, encodeType, quality));
  if (!blob) throw new Error('encode failed');
  if (type === 'image/x-icon') blob = await pngToIco(blob, w, h);
  return { blob, w, h };
}

go.addEventListener('click', async () => {
  const type = fmt.value;
  const quality = Number(q.value) / 100;
  const max = Number($('#ic-max').value) || 0;
  const bg = $('#ic-bg').value;
  outputs.length = 0;
  $('#ic-results').replaceChildren();
  go.disabled = true;
  let inTotal = 0, outTotal = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    st.busy(isHeic(f) ? `${t('converting', i + 1, files.length)} ${t('decodingHeic')}` : t('converting', i + 1, files.length), ((i) / files.length) * 100);
    try {
      const { blob, w, h } = await convertOne(f, type, quality, max, bg);
      const name = `${baseName(f.name)}.${EXT[type]}`;
      outputs.push({ name, blob });
      inTotal += f.size; outTotal += blob.size;
      const pct = Math.round((1 - blob.size / f.size) * 100);
      $('#ic-results').append(el('div', { class: 'result' },
        el('img', { src: URL.createObjectURL(blob), alt: '' }),
        el('div', { class: 'name', text: name, title: name }),
        el('div', {}, `${w} × ${h} · ${fmtBytes(f.size)} → ${fmtBytes(blob.size)} `, el('span', { class: pct >= 0 ? 'saving' : 'growing', text: `${pct >= 0 ? '−' : '+'}${Math.abs(pct)}%` })),
        el('button', { class: 'btn ghost', text: `⬇ ${c('download')}`, onclick: () => download(blob, name) })));
    } catch (e) {
      $('#ic-results').append(el('div', { class: 'result' }, el('div', { class: 'name', text: f.name }), el('div', { class: 'growing', text: t('failed', f.name) })));
      console.warn(e);
    }
  }
  st.ok(t('doneN', outputs.length, fmtBytes(inTotal), fmtBytes(outTotal)));
  $('#ic-zip').hidden = outputs.length < 2;
  go.disabled = false;
});

$('#ic-zip').addEventListener('click', () => downloadZip(outputs, 'images.zip'));
$('#ic-clear').addEventListener('click', () => { files.length = 0; outputs.length = 0; $('#ic-results').replaceChildren(); st.clear(); $('#ic-zip').hidden = true; refresh(); });
q.addEventListener('input', () => { $('#ic-q-val').textContent = q.value; });
fmt.addEventListener('change', refresh);
dropzone($('#ic-drop'), {
  accept: 'image/*,.heic,.heif,.avif,.svg',
  multiple: true,
  onFiles: (list) => { files.push(...list); refresh(); },
});
refresh();
