import { $, $$, t, c, el, LK, icon, filePicker, progress, alertBox, errorText, download, downloadZip, fmtBytes, fmtDuration, baseName, nextFrame, toast } from './lib.js';
import { IMAGE_ACCEPT, decodeImage, drawRotated, toBlob } from './image-core.js';
import { modelHost, hasWebGpu } from './model-host.js';

const MODEL_IDS = { birefnet: 'onnx-community/BiRefNet_lite-ONNX', modnet: 'Xenova/modnet' };
const MAX_SIDE = 4096; // longest side we keep; larger photos are scaled down before cutting out

const items = []; // { file, src (canvas), cut (canvas|null), error, busy, node, view, device }
let worker = null;
let workerReady = new Set(); // models whose weights the current worker already holds
let pendingReject = null;
let running = false;
let cancelFlag = false;

const sample = { url: `${LK.base}/assets/samples/portrait.jpg`, name: 'portrait.jpg', type: 'image/jpeg' };
const pickOpts = { accept: IMAGE_ACCEPT, multiple: true, iconName: 'images', onFiles: add };
filePicker($('#rb-pick'), { ...pickOpts, title: t('drop'), hint: t('dropHint'), sample });
filePicker($('#rb-more'), { ...pickOpts, compact: true, iconName: 'plus', title: t('add') });

const model = () => $$('input[name="rb-m"]').find((r) => r.checked).value;
const bgValue = () => $$('input[name="rb-bg"]').find((r) => r.checked).value; // 'none' | '#rrggbb' | 'custom'
const bgColor = () => { const v = bgValue(); return v === 'none' ? null : v === 'custom' ? $('#rb-color').value : v; };
const fmt = () => $$('input[name="rb-f"]').find((r) => r.checked).value;

// ---------------------------------------------------------------- compositing

/** Decodes a file into a canvas (EXIF-rotated, longest side <= MAX_SIDE). */
async function toCanvas(file) {
  const img = await decodeImage(file);
  const cv = drawRotated(img, 0, MAX_SIDE);
  img.close?.();
  return cv;
}

/** Original pixels with the matte applied as alpha. */
function applyAlpha(src, alpha) {
  const cut = el('canvas', { width: src.width, height: src.height });
  const ctx = cut.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, cut.width, cut.height);
  const d = img.data;
  for (let i = 0, p = 3; i < alpha.length; i++, p += 4) d[p] = alpha[i];
  ctx.putImageData(img, 0, 0);
  return cut;
}

async function outputBlob(it) {
  const color = bgColor();
  if (!color) return { blob: await toBlob(it.cut, 'image/png'), ext: 'png' };
  const cv = el('canvas', { width: it.cut.width, height: it.cut.height });
  const ctx = cv.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(it.cut, 0, 0);
  return fmt() === 'jpg' ? { blob: await toBlob(cv, 'image/jpeg', 0.95), ext: 'jpg' } : { blob: await toBlob(cv, 'image/png'), ext: 'png' };
}

// ---------------------------------------------------------------- worker

function ask(it, opts, onEvent) {
  return new Promise((resolve, reject) => {
    pendingReject = reject;
    const ctx = it.src.getContext('2d', { willReadFrequently: true });
    const rgba = ctx.getImageData(0, 0, it.src.width, it.src.height).data.buffer;
    worker.onmessage = ({ data }) => {
      if (data.type === 'item') resolve(data);
      else if (data.type === 'error') reject(new Error(data.message));
      else onEvent(data);
    };
    worker.onerror = (e) => reject(new Error(e.message || 'worker error'));
    worker.postMessage({ type: 'run', ...opts, items: [{ rgba, width: it.src.width, height: it.src.height }] }, [rgba]);
  });
}

function stopWorker() {
  pendingReject?.(new Error('canceled'));
  pendingReject = null;
  worker?.terminate();
  worker = null;
  workerReady = new Set();
}

function resetResults() {
  for (const it of items) { it.cut = null; if (it.src.width > 4) it.error = null; render(it); }
}

async function runQueue() {
  if (running) return;
  running = true;
  cancelFlag = false;
  const started = performance.now();
  $('#rb-alert').replaceChildren();
  let task;
  try {
    task = progress($('#rb-task'), { title: t('connecting'), onCancel: () => { cancelFlag = true; stopWorker(); } });
    const name = model();
    const [host, gpu] = await Promise.all([modelHost(MODEL_IDS[name]), $('#rb-engine').value === 'auto' ? hasWebGpu() : false]);
    let device = gpu ? 'webgpu' : 'wasm';
    const total = items.filter((x) => !x.cut && !x.error).length;
    let n = 0;
    while (!cancelFlag) {
      const it = items.find((x) => !x.cut && !x.error);
      if (!it) break;
      n++;
      it.busy = true;
      render(it);
      task.set(null);
      task.text('');
      worker ||= new Worker(`${LK.base}/assets/js/background.worker.js`, { type: 'module' });
      task.title(workerReady.has(name) ? t('working', n, total) : t('loadingModel'));
      try {
        const res = await ask(it, { base: `${location.origin}${LK.base}`, host, model: name, device }, (d) => {
          if (d.type === 'download') { task.title(`${t('downloading')} · ${fmtBytes(d.loaded)} / ${fmtBytes(d.total)}`); task.set(d.loaded / d.total); }
          else if (d.type === 'fallback') { device = 'wasm'; toast(t('fallback')); }
          else if (d.type === 'ready') { workerReady.add(name); device = d.device; task.title(t('working', n, total)); task.set(null); task.text(t('slowHint')); }
        });
        workerReady.add(name);
        device = res.device;
        it.cut = applyAlpha(it.src, res.alpha);
        it.device = res.device;
      } catch (e) {
        if (cancelFlag) break;
        it.error = errorText(e);
        if (!workerReady.has(name)) { // the model could not be loaded at all: stop instead of failing every image
          for (const o of items) if (!o.cut && !o.error) { o.error = it.error; o.busy = false; render(o); }
          stopWorker();
        }
      }
      it.busy = false;
      render(it);
      summary();
      await nextFrame();
    }
    task.close();
    task = null;
    if (cancelFlag) $('#rb-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else if (items.some((x) => x.cut)) {
      const dev = items.find((x) => x.device)?.device === 'webgpu' ? 'WebGPU' : 'CPU';
      $('#rb-alert').replaceChildren(alertBox(t('done', items.filter((x) => x.cut).length, fmtDuration((performance.now() - started) / 1000), dev), 'info'));
    }
  } catch (e) {
    task?.close();
    $('#rb-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    running = false;
    for (const it of items) if (it.busy) { it.busy = false; render(it); }
    summary();
  }
}

// ---------------------------------------------------------------- UI

function viewBg(view) {
  const color = bgColor();
  view.style.backgroundColor = color || '';
  view.classList.toggle('checker', !color);
}

function render(it) {
  const node = it.node;
  const name = it.file.name;
  node.className = `out rb-card${it.error ? ' failed' : ''}`;
  if (it.error) { node.replaceChildren(el('div', { class: 'name', text: name }), el('div', { text: it.error }), el('div', { class: 'actions' }, removeBtn(it))); return; }
  if (!it.cut) {
    node.replaceChildren(
      el('div', { class: 'rb-wait', style: `aspect-ratio:${it.src.width}/${it.src.height}` }, el('span', { class: 'spinner' }), el('small', { text: it.busy ? t('processing') : t('queued') })),
      el('div', { class: 'name', text: name, title: name }), el('div', { class: 'sizes', text: `${it.src.width}×${it.src.height} · ${fmtBytes(it.file.size)}` }),
      el('div', { class: 'actions' }, removeBtn(it)));
    return;
  }
  const orig = el('canvas', { class: 'rb-orig', width: it.src.width, height: it.src.height });
  orig.getContext('2d').drawImage(it.src, 0, 0);
  const cut = it.cut;
  cut.className = 'rb-cut';
  const line = el('i', { class: 'rb-line' });
  const slider = el('input', { type: 'range', min: 0, max: 100, value: 0, class: 'rb-slider', 'aria-label': t('compare') });
  const view = el('div', { class: 'rb-view', style: `aspect-ratio:${it.src.width}/${it.src.height}` }, cut, orig, line, slider,
    el('span', { class: 'rb-tag l', text: t('before') }), el('span', { class: 'rb-tag r', text: t('after') }));
  const sync = () => {
    const v = Number(slider.value);
    orig.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    line.style.left = `${v}%`;
    line.hidden = v === 0 || v === 100;
  };
  slider.addEventListener('input', sync);
  sync();
  viewBg(view);
  it.view = view;
  const dl = el('button', { class: 'btn sm', onclick: async () => { const o = await outputBlob(it); download(o.blob, `${baseName(it.file.name)}-no-bg.${o.ext}`); } }, icon('download'), c('download'));
  node.replaceChildren(view,
    el('div', { class: 'name', text: `${baseName(name)}-no-bg`, title: name }),
    el('div', { class: 'sizes', text: `${it.src.width}×${it.src.height}` }),
    el('div', { class: 'actions' }, dl,
      el('button', { class: 'btn ghost sm', onclick: () => { slider.value = slider.value === '0' ? '100' : '0'; sync(); } }, icon('eye'), t('compare')),
      removeBtn(it)));
}

function removeBtn(it) {
  return el('button', { class: 'btn ghost sm icon', title: c('remove'), 'aria-label': c('remove'), onclick: () => { items.splice(items.indexOf(it), 1); it.node.remove(); summary(); } }, icon('x'));
}

function summary() {
  const done = items.filter((x) => x.cut).length;
  $('#rb-work').hidden = items.length === 0;
  $('#rb-pick').hidden = items.length > 0;
  $('#rb-zip').hidden = done < 2;
  $('#rb-summary').textContent = done ? t('summary', done, items.length) : '';
  $('#rb-fmt').hidden = !bgColor();
}

async function add(files) {
  $('#rb-alert').replaceChildren();
  for (const file of files) {
    const it = { file, src: null, cut: null, error: null, busy: false, node: el('div', { class: 'out' }), view: null, device: null };
    items.push(it);
    $('#rb-grid').append(it.node);
    try {
      it.src = await toCanvas(file);
    } catch (e) {
      it.src = el('canvas', { width: 4, height: 3 });
      it.error = errorText(e);
    }
    render(it);
  }
  summary();
  runQueue();
}

function recolor() {
  for (const it of items) if (it.view) viewBg(it.view);
  summary();
}

/** Re-runs everything with new settings (a running job is cancelled first). */
async function restart() {
  if (running) {
    cancelFlag = true;
    stopWorker();
    while (running) await new Promise((r) => setTimeout(r, 50));
  }
  resetResults();
  runQueue();
}

$('#rb-work').addEventListener('change', (e) => {
  const n = e.target.name;
  if (n === 'rb-m') restart();
  else if (n === 'rb-bg' || n === 'rb-f') {
    $('#rb-color-wrap').hidden = bgValue() !== 'custom';
    recolor();
  }
});
$('#rb-color').addEventListener('input', recolor);
$('#rb-engine').addEventListener('change', () => { stopWorker(); restart(); });
$('#rb-zip').addEventListener('click', async () => {
  const files = [];
  for (const it of items.filter((x) => x.cut)) { const o = await outputBlob(it); files.push({ name: `${baseName(it.file.name)}-no-bg.${o.ext}`, blob: o.blob }); }
  downloadZip(files, 'background-removed.zip');
});
$('#rb-clear').addEventListener('click', () => {
  cancelFlag = true;
  stopWorker();
  items.length = 0;
  for (const id of ['grid', 'task', 'alert']) $(`#rb-${id}`).replaceChildren();
  summary();
});
