import { $, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtTime, baseName, extOf } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { getFFmpeg, probeMedia, run as ffRun } from './ffmpeg-common.js';

const SAME = ['mp4', 'mov', 'webm', 'mkv'];
const MIN = 16; // smallest crop edge in pixels
let job = null, video = null, abort = null, raf = 0, resultURL = null, busy = false;
let W = 0, H = 0;
let rect = { x: 0, y: 0, w: 0, h: 0 }; // crop area in source pixels

const pick = filePicker($('#cr-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

const frame = el('div', { class: 'bv-frame cr-frame' });
const layer = el('div', { class: 'cr-layer' });
const cropBox = el('div', { class: 'cr-box', role: 'group', 'aria-label': t('box') },
  ...['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((h) => el('span', { class: `cr-h ${h}`, 'data-h': h })));
const shades = ['t', 'b', 'l', 'r'].map((k) => el('div', { class: 'cr-shade' }));
layer.append(...shades, cropBox);
const playBtn = el('button', { type: 'button', class: 'btn soft sm', 'aria-label': t('play') }, icon('play'));
const seek = el('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'seek', style: { flex: '1' } });
const timeLabel = el('span', { class: 'small muted nowrap' });

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const even = (n) => Math.round(n / 2) * 2;
const evenDown = (n) => Math.floor(n / 2) * 2;
const maxW = () => evenDown(W), maxH = () => evenDown(H);

/** Selected aspect ratio as a number (w/h), or null for a free shape. */
function ratio() {
  const v = document.querySelector('input[name="cr-ratio"]:checked')?.value;
  if (!v || v === 'free') return null;
  const [a, b] = v.split(':').map(Number);
  return a / b;
}
const ratioLabel = () => { const v = document.querySelector('input[name="cr-ratio"]:checked')?.value; return !v || v === 'free' ? t('ratioFree') : v; };

/** Rounds to even numbers and forces the rectangle inside the frame, keeping the ratio when one is locked. */
function normalise(r) {
  const ar = ratio();
  let w = clamp(even(r.w), 2, maxW());
  let h = clamp(even(r.h), 2, maxH());
  if (ar) {
    h = even(w / ar);
    if (h > maxH()) { h = maxH(); w = even(h * ar); }
    if (w > maxW()) { w = maxW(); h = even(w / ar); }
  }
  const x = clamp(even(r.x), 0, evenDown(W - w));
  const y = clamp(even(r.y), 0, evenDown(H - h));
  return { x, y, w, h };
}

/** Largest rectangle with the locked ratio that fits the frame, centred on the current box. */
function fitRatio() {
  const ar = ratio();
  if (!ar) return;
  let w = W, h = W / ar;
  if (h > H) { h = H; w = H * ar; }
  rect = normalise({ x: rect.x + rect.w / 2 - w / 2, y: rect.y + rect.h / 2 - h / 2, w, h });
}

function render() {
  if (!job) return;
  Object.assign(cropBox.style, { left: `${(rect.x / W) * 100}%`, top: `${(rect.y / H) * 100}%`, width: `${(rect.w / W) * 100}%`, height: `${(rect.h / H) * 100}%` });
  const p = (v, total) => `${(v / total) * 100}%`;
  const [top, bottom, left, right] = shades;
  Object.assign(top.style, { left: 0, top: 0, width: '100%', height: p(rect.y, H) });
  Object.assign(bottom.style, { left: 0, top: p(rect.y + rect.h, H), width: '100%', height: p(H - rect.y - rect.h, H) });
  Object.assign(left.style, { left: 0, top: p(rect.y, H), width: p(rect.x, W), height: p(rect.h, H) });
  Object.assign(right.style, { left: p(rect.x + rect.w, W), top: p(rect.y, H), width: p(W - rect.x - rect.w, W), height: p(rect.h, H) });
  const set = (id, v) => { const i = $(id); if (document.activeElement !== i) i.value = String(v); };
  set('#cr-x', rect.x); set('#cr-y', rect.y); set('#cr-w', rect.w); set('#cr-h', rect.h);
  $('#cr-x').max = String(evenDown(W - rect.w)); $('#cr-y').max = String(evenDown(H - rect.h));
  $('#cr-w').max = String(maxW()); $('#cr-h').max = String(maxH());
  $('#cr-out').textContent = t('output', rect.w, rect.h, ratioLabel());
}

function layout() {
  if (!job?.info.width) return;
  const maxFrameH = Math.min(window.innerHeight * 0.55, 520);
  const avail = $('#cr-stage').clientWidth || 300;
  const w = Math.min(avail, (maxFrameH * W) / H);
  frame.style.width = `${w}px`;
  frame.style.height = `${(w * H) / W}px`;
}

// ---------------------------------------------------------------- dragging (pointer events: mouse, touch, pen)

layer.addEventListener('pointerdown', (e) => {
  if (busy) return;
  const handle = e.target.closest('.cr-h')?.dataset.h;
  if (!handle && !e.target.closest('.cr-box')) return;
  e.preventDefault();
  layer.setPointerCapture(e.pointerId);
  video.pause();
  const bounds = layer.getBoundingClientRect();
  const toPx = (ev) => [((ev.clientX - bounds.left) / bounds.width) * W, ((ev.clientY - bounds.top) / bounds.height) * H];
  const [sx, sy] = toPx(e);
  const start = { ...rect };
  const move = (ev) => {
    const [px, py] = toPx(ev);
    rect = handle ? resize(handle, clamp(px, 0, W), clamp(py, 0, H), start) : normalise({ ...start, x: start.x + px - sx, y: start.y + py - sy });
    render();
  };
  const up = () => {
    layer.removeEventListener('pointermove', move);
    layer.removeEventListener('pointerup', up);
    layer.removeEventListener('pointercancel', up);
  };
  layer.addEventListener('pointermove', move);
  layer.addEventListener('pointerup', up);
  layer.addEventListener('pointercancel', up);
});

/** New rectangle after dragging handle `h` to (px, py); the opposite side (or corner) stays put. */
function resize(h, px, py, s) {
  const west = h.includes('w'), east = h.includes('e'), north = h.includes('n'), south = h.includes('s');
  const x1 = s.x + s.w, y1 = s.y + s.h;
  const ar = ratio();
  if (!ar) {
    let nx = s.x, ny = s.y, nx1 = x1, ny1 = y1;
    if (west) nx = clamp(px, 0, x1 - MIN);
    if (east) nx1 = clamp(px, s.x + MIN, W);
    if (north) ny = clamp(py, 0, y1 - MIN);
    if (south) ny1 = clamp(py, s.y + MIN, H);
    return normalise({ x: nx, y: ny, w: nx1 - nx, h: ny1 - ny });
  }
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  let w, hh, x, y;
  if ((west || east) && (north || south)) { // corner: anchor the opposite corner
    const ax = west ? x1 : s.x, ay = north ? y1 : s.y;
    w = Math.max(east ? px - ax : ax - px, (south ? py - ay : ay - py) * ar, MIN);
    w = Math.min(w, east ? W - ax : ax, (south ? H - ay : ay) * ar);
    hh = w / ar;
    x = east ? ax : ax - w;
    y = south ? ay : ay - hh;
  } else if (west || east) { // side edge: grow around the vertical centre
    w = Math.max(east ? px - s.x : x1 - px, MIN);
    w = Math.min(w, east ? W - s.x : x1, 2 * Math.min(cy, H - cy) * ar);
    hh = w / ar;
    x = east ? s.x : x1 - w;
    y = cy - hh / 2;
  } else { // top/bottom edge: grow around the horizontal centre
    hh = Math.max(south ? py - s.y : y1 - py, MIN);
    hh = Math.min(hh, south ? H - s.y : y1, (2 * Math.min(cx, W - cx)) / ar);
    w = hh * ar;
    y = south ? s.y : y1 - hh;
    x = cx - w / 2;
  }
  return normalise({ x, y, w, h: hh });
}

// ---------------------------------------------------------------- numeric inputs and presets

for (const id of ['x', 'y', 'w', 'h']) {
  $(`#cr-${id}`).addEventListener('input', (e) => {
    const v = Number(e.target.value);
    if (!Number.isFinite(v) || e.target.value === '') return;
    const next = { ...rect, [id]: v };
    const ar = ratio();
    if (ar && id === 'w') next.h = v / ar;
    if (ar && id === 'h') next.w = v * ar;
    if (id === 'w' || id === 'h') {
      // keep the box inside the frame by shifting it rather than refusing the value
      next.x = Math.min(next.x, W - next.w); next.y = Math.min(next.y, H - next.h);
    }
    rect = normalise(next);
    render();
  });
  $(`#cr-${id}`).addEventListener('change', () => { $(`#cr-${id}`).blur(); render(); });
}

$('#cr-shapes').addEventListener('change', () => { fitRatio(); render(); });
$('#cr-reset').addEventListener('click', () => {
  $('input[name="cr-ratio"][value="free"]').checked = true;
  rect = { x: 0, y: 0, w: maxW(), h: maxH() };
  render();
});

playBtn.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
seek.addEventListener('input', () => { video.currentTime = (Number(seek.value) / 1000) * (video.duration || 0); });
window.addEventListener('resize', layout);
function tick() {
  if (video) {
    seek.value = String(Math.round((video.currentTime / (video.duration || 1)) * 1000));
    timeLabel.textContent = `${fmtTime(video.currentTime, 1)} / ${fmtTime(video.duration || 0, 1)}`;
  }
  raf = requestAnimationFrame(tick);
}

// ---------------------------------------------------------------- loading and export

async function load(file) {
  if (busy) return;
  abort?.abort();
  video?.pause();
  if (job) { URL.revokeObjectURL(job.url); job.media?.input.dispose(); }
  job = null;
  cancelAnimationFrame(raf);
  $('#cr-pick').hidden = true;
  $('#cr-work').hidden = false;
  $('#cr-result').replaceChildren();
  $('#cr-alert').replaceChildren();
  $('#cr-stage').replaceChildren();
  $('#cr-go').disabled = true;
  $('#cr-file').replaceChildren(fileCard({ file, meta: t('preparing'), onChange: () => pick.open() }));
  try {
    job = await prepare(file);
    if (job.legacy) {
      abort = new AbortController();
      const task = progress($('#cr-task'), { title: c('loadingEngine'), onCancel: () => abort.abort() });
      try { Object.assign(job.info, await probeMedia(file, { signal: abort.signal })); }
      finally { task.close(); }
    }
  } catch (e) {
    $('#cr-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#cr-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  if (!job.info.width) {
    $('#cr-alert').replaceChildren(alertBox(errorText(new Error('no video track'))));
    $('#cr-go').disabled = true;
    return;
  }
  $('#cr-go').disabled = false;
  if (job.legacy) $('#cr-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  ({ width: W, height: H } = job.info);
  $('input[name="cr-ratio"][value="free"]').checked = true;
  rect = { x: 0, y: 0, w: maxW(), h: maxH() };
  video = playerFor(job.url);
  video.controls = false;
  video.addEventListener('play', () => playBtn.replaceChildren(icon('pause')));
  video.addEventListener('pause', () => playBtn.replaceChildren(icon('play')));
  frame.replaceChildren(video, layer);
  $('#cr-stage').replaceChildren(frame, el('div', { class: 'actions bv-controls' }, playBtn, seek, timeLabel));
  layout();
  render();
  raf = requestAnimationFrame(tick);
}

async function save() {
  if (busy || !job) return;
  $('#cr-alert').replaceChildren();
  if (rect.w >= maxW() && rect.h >= maxH()) {
    $('#cr-alert').replaceChildren(alertBox(t('nothing'), 'info'));
    return;
  }
  const file = job.file;
  const ext = extOf(file.name);
  const container = SAME.includes(ext) && !job.legacy ? ext : 'mp4';
  const outName = `${baseName(file.name)}-cropped.${container}`;
  const area = { ...rect };
  abort = new AbortController();
  busy = true;
  const controls = [...$('#cr-work').querySelectorAll('input,select,button')];
  controls.forEach((control) => { control.disabled = true; });
  $('#cr-go').disabled = true;
  $('#cr-result').replaceChildren();
  video.pause();
  const task = progress($('#cr-task'), { title: t('cropping'), onCancel: () => abort.abort() });
  try {
    let blob;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('cropping'));
      blob = await ffRun(file, ['-i', '{in}', '-vf', `crop=${area.w}:${area.h}:${area.x}:${area.y}`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'],
        'out.mp4', 'video/mp4', { duration: job.info.duration, signal: abort.signal, onProgress: (x) => task.set(x) });
    } else {
      const codec = await pickVideoCodec(container, area.w, area.h);
      ({ blob } = await convert(file, {
        container,
        video: { crop: { left: area.x, top: area.y, width: area.w, height: area.h }, codec: codec || undefined, forceTranscode: true },
        audio: {},
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      }));
    }
    task.close();
    abort.signal.throwIfAborted();
    if (resultURL) URL.revokeObjectURL(resultURL);
    const url = resultURL = URL.createObjectURL(blob);
    $('#cr-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', area.w, area.h, fmtBytes(blob.size))),
      playerFor(url),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, outName) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#cr-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#cr-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#cr-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    busy = false;
    controls.forEach((control) => { control.disabled = false; });
    $('#cr-go').disabled = false;
  }
}

$('#cr-go').addEventListener('click', save);
