import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtTime, parseTime, baseName } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';

let job = null, video = null, abort = null;
let regions = []; // { x, y, w, h } normalised 0..1, start/end in seconds (null = whole video)
let selected = -1;
let raf = 0;

const pick = filePicker($('#bv-pick'), { accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f) });
const fx = () => $$('input[name="bv-fx"]').find((r) => r.checked).value;
const strength = () => Number($('#bv-str').value);
const active = (r, time) => (r.start == null || time >= r.start) && (r.end == null || time < r.end);

// ---------------------------------------------------------------- effects (shared by preview and export)

let tmp = null;
/** Draws `src` (already the full frame) onto ctx and hides every active region. */
export function applyEffects(ctx, src, W, H, list, time, mode, power) {
  ctx.drawImage(src, 0, 0, W, H);
  for (const r of list) {
    if (!active(r, time)) continue;
    const x = Math.round(r.x * W), y = Math.round(r.y * H), w = Math.max(1, Math.round(r.w * W)), h = Math.max(1, Math.round(r.h * H));
    if (mode === 'box') {
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, w, h);
    } else if (mode === 'mosaic') {
      const block = Math.max(3, Math.round((Math.min(W, H) / 120) * power));
      const sw = Math.max(1, Math.round(w / block)), sh = Math.max(1, Math.round(h / block));
      tmp ||= el('canvas');
      tmp.width = sw; tmp.height = sh;
      const tctx = tmp.getContext('2d');
      tctx.imageSmoothingEnabled = true;
      tctx.drawImage(src, x, y, w, h, 0, 0, sw, sh);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, sw, sh, x, y, w, h);
      ctx.restore();
    } else {
      const px = Math.max(2, (Math.min(W, H) / 90) * power);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.filter = `blur(${px}px)`;
      // Draw a slightly enlarged copy so the blur doesn't pull in transparent edges.
      ctx.drawImage(src, -px * 2, -px * 2, W + px * 4, H + px * 4);
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------- stage: video, live preview, boxes

const frame = el('div', { class: 'bv-frame' });
const preview = el('canvas', { class: 'bv-preview', 'aria-label': t('preview') });
const layer = el('div', { class: 'bv-layer' });
const playBtn = el('button', { type: 'button', class: 'btn soft sm', 'aria-label': 'play' }, icon('play'));
const seek = el('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'seek', style: { flex: '1' } });
const timeLabel = el('span', { class: 'small muted nowrap' });

function layout() {
  if (!job) return;
  const { width: W, height: H } = job.info;
  const maxH = Math.min(window.innerHeight * 0.5, 560);
  const avail = $('#bv-stage').clientWidth;
  const w = Math.min(avail, (maxH * W) / H);
  frame.style.width = `${w}px`;
  frame.style.height = `${(w * H) / W}px`;
  preview.width = Math.round(w * Math.min(2, devicePixelRatio || 1));
  preview.height = Math.round((preview.width * H) / W);
  renderBoxes();
}

function drawPreview() {
  if (!video || video.readyState < 2) return;
  const ctx = preview.getContext('2d');
  applyEffects(ctx, video, preview.width, preview.height, regions, video.currentTime, fx(), strength() * (preview.width / job.info.width));
}

function tick() {
  drawPreview();
  if (video) {
    seek.value = String(Math.round((video.currentTime / (video.duration || 1)) * 1000));
    timeLabel.textContent = `${fmtTime(video.currentTime, 1)} / ${fmtTime(video.duration || 0, 1)}`;
  }
  raf = requestAnimationFrame(tick);
}

function renderBoxes() {
  layer.replaceChildren(...regions.map((r, i) => {
    const box = el('div', { class: `bv-box${i === selected ? ' on' : ''}`, 'data-i': i, style: { left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` } },
      el('span', { class: 'bv-num', text: String(i + 1) }), el('span', { class: 'rs' }));
    box.classList.toggle('dim', !active(r, video?.currentTime || 0));
    return box;
  }));
}

function renderList() {
  if (!regions.length) { $('#bv-list').replaceChildren(el('p', { class: 'note', text: t('noAreas') })); return; }
  $('#bv-list').replaceChildren(...regions.map((r, i) => {
    const whole = el('input', { type: 'checkbox', checked: r.start == null && r.end == null });
    const from = el('input', { type: 'text', value: fmtTime(r.start ?? 0, 1), disabled: whole.checked, style: { width: '6.5em' }, 'aria-label': t('from') });
    const to = el('input', { type: 'text', value: fmtTime(r.end ?? job.info.duration, 1), disabled: whole.checked, style: { width: '6.5em' }, 'aria-label': t('to') });
    const sync = () => { renderBoxes(); };
    whole.addEventListener('change', () => {
      if (whole.checked) { r.start = r.end = null; } else { r.start = 0; r.end = job.info.duration; }
      renderList(); sync();
    });
    from.addEventListener('change', () => { const v = parseTime(from.value); if (v != null) r.start = Math.min(v, (r.end ?? job.info.duration) - 0.1); renderList(); sync(); });
    to.addEventListener('change', () => { const v = parseTime(to.value); if (v != null) r.end = Math.max(v, (r.start ?? 0) + 0.1); renderList(); sync(); });
    return el('li', { class: i === selected ? 'sel' : '' },
      el('strong', { text: t('area', i + 1), style: { minWidth: '4.5em' } }),
      el('label', { class: 'check small' }, whole, t('whole')),
      el('span', { class: 'inline-num small' }, t('from'), from, el('button', { type: 'button', class: 'btn ghost sm', text: t('fromHere'), onclick: () => { r.start = video.currentTime; if (r.end == null) r.end = job.info.duration; renderList(); sync(); } })),
      el('span', { class: 'inline-num small' }, t('to'), to, el('button', { type: 'button', class: 'btn ghost sm', text: t('toHere'), onclick: () => { r.end = Math.max(video.currentTime, (r.start ?? 0) + 0.1); if (r.start == null) r.start = 0; renderList(); sync(); } })),
      el('button', { type: 'button', class: 'btn danger sm', title: t('remove'), onclick: () => { regions.splice(i, 1); selected = -1; renderList(); sync(); } }, icon('x')));
  }));
}

// Drawing, moving and resizing boxes (pointer events, so it works with touch too).
layer.addEventListener('pointerdown', (e) => {
  const rect = layer.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width, ny = (e.clientY - rect.top) / rect.height;
  const boxEl = e.target.closest('.bv-box');
  e.preventDefault();
  layer.setPointerCapture(e.pointerId);
  video.pause();
  let r, mode, start = { nx, ny };
  if (boxEl) {
    selected = Number(boxEl.dataset.i);
    r = regions[selected];
    mode = e.target.classList.contains('rs') ? 'resize' : 'move';
    start = { nx, ny, x: r.x, y: r.y, w: r.w, h: r.h };
  } else {
    r = { x: nx, y: ny, w: 0, h: 0, start: null, end: null };
    regions.push(r);
    selected = regions.length - 1;
    mode = 'draw';
  }
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const move = (ev) => {
    const mx = clamp((ev.clientX - rect.left) / rect.width), my = clamp((ev.clientY - rect.top) / rect.height);
    if (mode === 'draw') { r.x = Math.min(start.nx, mx); r.y = Math.min(start.ny, my); r.w = Math.abs(mx - start.nx); r.h = Math.abs(my - start.ny); }
    else if (mode === 'move') { r.x = clamp(Math.min(start.x + mx - start.nx, 1 - r.w)); r.y = clamp(Math.min(start.y + my - start.ny, 1 - r.h)); }
    else { r.w = Math.max(0.02, Math.min(1 - r.x, start.w + mx - start.nx)); r.h = Math.max(0.02, Math.min(1 - r.y, start.h + my - start.ny)); }
    renderBoxes();
  };
  const up = () => {
    layer.removeEventListener('pointermove', move);
    layer.removeEventListener('pointerup', up);
    if (mode === 'draw' && (r.w < 0.015 || r.h < 0.015)) { regions.splice(selected, 1); selected = -1; }
    renderBoxes();
    renderList();
  };
  layer.addEventListener('pointermove', move);
  layer.addEventListener('pointerup', up);
});

document.addEventListener('keydown', (e) => {
  if (selected < 0 || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { regions.splice(selected, 1); selected = -1; renderBoxes(); renderList(); }
});

playBtn.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
seek.addEventListener('input', () => { video.currentTime = (Number(seek.value) / 1000) * (video.duration || 0); });
window.addEventListener('resize', layout);

async function load(file) {
  abort?.abort();
  cancelAnimationFrame(raf);
  regions = []; selected = -1;
  $('#bv-pick').hidden = true;
  $('#bv-work').hidden = false;
  $('#bv-result').replaceChildren();
  $('#bv-alert').replaceChildren();
  $('#bv-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  try {
    job = await prepare(file);
  } catch (e) {
    $('#bv-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#bv-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  if (job.legacy || !job.info.width) { $('#bv-alert').replaceChildren(alertBox(t('legacy'))); $('#bv-go').disabled = true; return; }
  $('#bv-go').disabled = false;
  video = playerFor(job.url);
  video.controls = false;
  video.muted = true;
  video.addEventListener('play', () => playBtn.replaceChildren(icon('pause')));
  video.addEventListener('pause', () => playBtn.replaceChildren(icon('play')));
  video.addEventListener('timeupdate', renderBoxes);
  frame.replaceChildren(video, preview, layer);
  $('#bv-stage').replaceChildren(frame, el('div', { class: 'actions bv-controls' }, playBtn, seek, timeLabel));
  layout();
  renderList();
  raf = requestAnimationFrame(tick);
}

async function exportVideo() {
  if (!regions.length) { $('#bv-alert').replaceChildren(alertBox(t('noAreas'), 'info')); return; }
  const W = job.info.width, H = job.info.height;
  const list = regions.map((r) => ({ ...r }));
  const mode = fx(), power = strength();
  const src = el('canvas', { width: W, height: H });
  const sctx = src.getContext('2d');
  const out = el('canvas', { width: W, height: H });
  const octx = out.getContext('2d');
  abort = new AbortController();
  video.pause();
  $('#bv-go').disabled = true;
  $('#bv-alert').replaceChildren();
  $('#bv-result').replaceChildren();
  const task = progress($('#bv-task'), { title: t('exporting'), onCancel: () => abort.abort() });
  try {
    const codec = await pickVideoCodec('mp4', W, H);
    const { blob } = await convert(job.file, {
      container: 'mp4',
      video: {
        codec, forceTranscode: true, processedWidth: W, processedHeight: H,
        process: (sample) => {
          sample.draw(sctx, 0, 0, W, H);
          applyEffects(octx, src, W, H, list, sample.timestamp, mode, power);
          return out;
        },
      },
      audio: {},
      onProgress: (x) => task.set(x),
      signal: abort.signal,
    });
    task.close();
    const name = `${baseName(job.file.name)}-blurred.mp4`;
    $('#bv-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtBytes(blob.size))),
      playerFor(URL.createObjectURL(blob)),
      el('div', { class: 'actions' }, el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#bv-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    $('#bv-alert').replaceChildren(e instanceof ConversionCanceledError || abort.signal.aborted ? alertBox(c('canceled'), 'info') : alertBox(errorText(e)));
  } finally {
    $('#bv-go').disabled = false;
  }
}

$('#bv-go').addEventListener('click', exportVideo);
