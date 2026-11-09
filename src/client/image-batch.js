// Batch image engine shared by Compress Image, HEIC to JPG and Convert Image:
// drop images → they are processed immediately → results grid with sizes and downloads.
// Changing an option re-processes everything.
import { $, t, c, el, icon, filePicker, alertBox, errorText, download, downloadZip, fmtBytes, baseName, LK, nextFrame } from './lib.js';
import { IMAGE_ACCEPT, decodeImage, drawRotated, toBlob } from './image-core.js';

export const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/x-icon': 'ico', 'image/gif': 'gif' };

/** Whether this browser can encode `type` with canvas.toBlob (it silently falls back to PNG otherwise). */
export async function canEncode(type) {
  const cv = el('canvas', { width: 2, height: 2 });
  const b = await new Promise((r) => cv.toBlob(r, type, 0.5));
  return b?.type === type;
}

/** Encodes a canvas; PNG can be colour-quantized (lossy, much smaller) via UPNG. */
export async function encode(canvas, type, quality, { quantizePng = false } = {}) {
  if (type === 'image/png' && quantizePng) {
    const { default: UPNG } = await import('upng-js');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const png = UPNG.encode([data.buffer], canvas.width, canvas.height, 256);
    return new Blob([png], { type: 'image/png' });
  }
  if (type === 'image/x-icon') {
    const png = new Uint8Array(await (await toBlob(canvas, 'image/png')).arrayBuffer());
    const head = new DataView(new ArrayBuffer(22));
    head.setUint16(2, 1, true); head.setUint16(4, 1, true);
    head.setUint8(6, canvas.width >= 256 ? 0 : canvas.width); head.setUint8(7, canvas.height >= 256 ? 0 : canvas.height);
    head.setUint16(10, 1, true); head.setUint16(12, 32, true); head.setUint32(14, png.length, true); head.setUint32(18, 22, true);
    return new Blob([head.buffer, png], { type: 'image/x-icon' });
  }
  return toBlob(canvas, type, quality);
}

/**
 * opts: { root (container element ids prefixed), sampleUrl, readOptions(): object, process(item, options) → { blob, name, w, h },
 *         onReady?() }
 */
export function batch(opts) {
  const items = []; // { file, img, out, error, node }
  let runId = 0;
  let working = false;
  const q = (sel) => $(`#${opts.prefix}-${sel}`);
  const release = (item) => { if (item.out?.url) URL.revokeObjectURL(item.out.url); item.out = null; };
  const cancel = el('button', { id: `${opts.prefix}-cancel`, type: 'button', class: 'btn ghost', hidden: true, text: c('cancel'), onclick: () => {
    runId++;
    working = false;
    for (const item of items) if (!item.out && !item.error) { item.error = c('canceled'); renderItem(item); }
    summary();
  } });
  q('clear').before(cancel);

  const sampleName = opts.sample || 'photo.jpg';
  const sample = { url: `${LK.base}/assets/samples/${sampleName}`, name: sampleName, type: sampleName.endsWith('.heic') ? 'image/heic' : 'image/jpeg' };
  const pick = filePicker(q('pick'), { accept: opts.accept || IMAGE_ACCEPT, multiple: true, iconName: 'images', title: t('drop'), hint: t('dropHint'), sample, onFiles: add });
  filePicker(q('more'), { accept: opts.accept || IMAGE_ACCEPT, multiple: true, compact: true, iconName: 'plus', title: t('add'), onFiles: add });

  function summary() {
    cancel.hidden = !working;
    const done = items.filter((x) => x.out);
    const before = done.reduce((a, x) => a + x.file.size, 0), after = done.reduce((a, x) => a + x.out.blob.size, 0);
    const pct = before ? Math.round((1 - after / before) * 100) : 0;
    q('summary').replaceChildren(done.length ? el('span', {},
      t('summary', done.length, fmtBytes(before), fmtBytes(after)), ' ',
      opts.showSaving ? el('span', { class: pct >= 0 ? 'saving' : 'growing', text: `${pct >= 0 ? '−' : '+'}${Math.abs(pct)}%` }) : '') : '');
    q('zip').hidden = done.length < 2;
    q('work').hidden = items.length === 0;
    q('pick').hidden = items.length > 0;
  }

  function renderItem(it) {
    const node = it.node || el('div', { class: 'out' });
    it.node = node;
    if (it.error) {
      node.className = 'out failed';
      node.replaceChildren(el('div', { class: 'name', text: it.file.name }), el('div', { text: it.error }));
      return node;
    }
    if (!it.out) {
      node.className = 'out';
      node.replaceChildren(el('div', { class: 'pic' }, el('span', { class: 'spinner' })), el('div', { class: 'name', text: it.file.name }), el('div', { class: 'sizes', text: fmtBytes(it.file.size) }));
      return node;
    }
    const { blob, name, w, h } = it.out;
    const pct = Math.round((1 - blob.size / it.file.size) * 100);
    node.className = 'out';
    node.replaceChildren(
      el('div', { class: 'pic' }, el('img', { src: it.out.url, alt: '' })),
      el('div', { class: 'name', text: name, title: name }),
      el('div', { class: 'sizes' }, `${w}×${h} · ${fmtBytes(it.file.size)} → ${fmtBytes(blob.size)} `, opts.showSaving ? el('span', { class: pct >= 0 ? 'saving' : 'growing', text: `${pct >= 0 ? '−' : '+'}${Math.abs(pct)}%` }) : ''),
      el('div', { class: 'actions' },
        el('button', { class: 'btn sm', onclick: () => download(blob, name) }, icon('download'), c('download')),
        el('button', { class: 'btn ghost sm icon', title: c('remove'), 'aria-label': c('remove'), onclick: () => { release(it); it.img?.close?.(); items.splice(items.indexOf(it), 1); node.remove(); summary(); } }, icon('x'))));
    return node;
  }

  async function processAll(list) {
    const id = ++runId;
    const options = opts.readOptions();
    working = true;
    summary();
    try {
      for (const it of list) {
        if (id !== runId) return;
        if (!items.includes(it)) continue;
        release(it);
        it.error = null;
        try {
          it.img ||= await decodeImage(it.file);
          const out = await opts.process(it, options);
          if (id !== runId) return;
          if (it.out?.url) URL.revokeObjectURL(it.out.url);
          it.out = { ...out, url: URL.createObjectURL(out.blob) };
        } catch (e) {
          if (id !== runId) return;
          it.error = errorText(e);
        }
        renderItem(it);
        summary();
        await nextFrame();
      }
    } finally {
      if (id === runId) { working = false; summary(); }
    }
  }

  async function add(files) {
    q('alert').replaceChildren();
    const fresh = files.map((file) => ({ file, img: null, out: null, error: null, node: null }));
    items.push(...fresh);
    for (const it of fresh) q('grid').append(renderItem(it));
    summary();
    await processAll(items.filter((item) => !item.out));
  }

  let debounce = 0;
  function rerun() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      for (const it of items) { release(it); renderItem(it); }
      processAll(items.slice());
    }, 250);
  }

  q('zip').addEventListener('click', () => downloadZip(items.filter((x) => x.out).map((x) => ({ name: x.out.name, blob: x.out.blob })), opts.zipName || 'images.zip'));
  q('clear').addEventListener('click', () => { runId++; working = false; clearTimeout(debounce); for (const item of items) { release(item); item.img?.close?.(); } items.length = 0; q('grid').replaceChildren(); summary(); });
  return { rerun, items, pick, alert: (m) => q('alert').replaceChildren(alertBox(m)) };
}

/** Scales an image so its longest side is at most `max` (0 = keep), with optional rotation and background. */
export function prepareCanvas(img, max, background) {
  return drawRotated(img, 0, max || Infinity, background);
}

export const outName = (file, ext) => `${baseName(file.name)}.${ext}`;
