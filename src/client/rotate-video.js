import { $, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtTime, baseName, extOf } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { getFFmpeg, probeMedia, run as ffRun } from './ffmpeg-common.js';

const SAME = ['mp4', 'mov', 'webm', 'mkv'];
let job = null, video = null, abort = null, raf = 0, resultURL = null, busy = false;
// The edit is "rotate clockwise by `rot`, then mirror left-right (fh), then mirror top-bottom (fv)".
const st = { rot: 0, fh: false, fv: false };

const pick = filePicker($('#rv-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

const box = el('div', { class: 'rv-box' });
const playBtn = el('button', { type: 'button', class: 'btn soft sm', 'aria-label': t('play') }, icon('play'));
const seek = el('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'seek', style: { flex: '1' } });
const timeLabel = el('span', { class: 'small muted nowrap' });

const odd = () => st.rot === 90 || st.rot === 270;
const shown = () => (odd() ? [job.info.height, job.info.width] : [job.info.width, job.info.height]);
const identity = () => st.rot === 0 && !st.fh && !st.fv;

/** Mediabunny applies rotation first, then one horizontal flip. A vertical flip equals rotate 180° + horizontal flip. */
const mbTransform = () => ({ rotate: (st.rot + (st.fv ? 180 : 0)) % 360, flip: st.fh !== st.fv });

function layout() {
  if (!job?.info.width) return;
  const { width: W, height: H } = job.info;
  const [dw, dh] = shown();
  const avail = $('#rv-stage').clientWidth || 300;
  const k = Math.min(avail / dw, Math.min(window.innerHeight * 0.5, 480) / dh);
  box.style.width = `${dw * k}px`;
  box.style.height = `${dh * k}px`;
  Object.assign(video.style, {
    width: `${W * k}px`, height: `${H * k}px`, left: `${(dw * k - W * k) / 2}px`, top: `${(dh * k - H * k) / 2}px`,
    transform: `scaleY(${st.fv ? -1 : 1}) scaleX(${st.fh ? -1 : 1}) rotate(${st.rot}deg)`,
  });
}

function update() {
  if (!job?.info.width) return;
  layout();
  const [w, h] = shown();
  const flips = (st.fh ? t('flippedH') : '') + (st.fv ? t('flippedV') : '');
  $('#rv-fh').setAttribute('aria-pressed', String(st.fh));
  $('#rv-fv').setAttribute('aria-pressed', String(st.fv));
  $('#rv-state').textContent = identity() ? t('stateNone', w, h) : t('state', st.rot, flips, w, h);
}

const turn = (d) => { st.rot = (st.rot + d + 360) % 360; update(); };
$('#rv-left').addEventListener('click', () => turn(-90));
$('#rv-right').addEventListener('click', () => turn(90));
// Flips are applied after the rotation, so on a sideways clip "horizontal" keeps meaning left-right on screen.
$('#rv-fh').addEventListener('click', () => { st.fh = !st.fh; update(); });
$('#rv-fv').addEventListener('click', () => { st.fv = !st.fv; update(); });
$('#rv-reset').addEventListener('click', () => { Object.assign(st, { rot: 0, fh: false, fv: false }); update(); });
window.addEventListener('resize', layout);

playBtn.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
seek.addEventListener('input', () => { video.currentTime = (Number(seek.value) / 1000) * (video.duration || 0); });
function tick() {
  if (video) {
    seek.value = String(Math.round((video.currentTime / (video.duration || 1)) * 1000));
    timeLabel.textContent = `${fmtTime(video.currentTime, 1)} / ${fmtTime(video.duration || 0, 1)}`;
  }
  raf = requestAnimationFrame(tick);
}

async function load(file) {
  if (busy) return;
  abort?.abort();
  video?.pause();
  if (job) { URL.revokeObjectURL(job.url); job.media?.input.dispose(); }
  job = null;
  cancelAnimationFrame(raf);
  Object.assign(st, { rot: 0, fh: false, fv: false });
  $('#rv-pick').hidden = true;
  $('#rv-work').hidden = false;
  $('#rv-result').replaceChildren();
  $('#rv-alert').replaceChildren();
  $('#rv-stage').replaceChildren();
  $('#rv-go').disabled = true;
  $('#rv-file').replaceChildren(fileCard({ file, meta: t('preparing'), onChange: () => pick.open() }));
  try {
    job = await prepare(file);
    if (job.legacy) {
      abort = new AbortController();
      const task = progress($('#rv-task'), { title: c('loadingEngine'), onCancel: () => abort.abort() });
      try { Object.assign(job.info, await probeMedia(file, { signal: abort.signal })); }
      finally { task.close(); }
    }
  } catch (e) {
    $('#rv-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#rv-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  if (!job.info.width) {
    $('#rv-alert').replaceChildren(alertBox(errorText(new Error('no video track'))));
    $('#rv-go').disabled = true;
    return;
  }
  $('#rv-go').disabled = false;
  if (job.legacy) $('#rv-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  video = playerFor(job.url);
  video.controls = false;
  video.classList.add('rv-video');
  video.addEventListener('play', () => playBtn.replaceChildren(icon('pause')));
  video.addEventListener('pause', () => playBtn.replaceChildren(icon('play')));
  video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  box.replaceChildren(video);
  $('#rv-stage').replaceChildren(box, el('div', { class: 'actions bv-controls' }, playBtn, seek, timeLabel));
  update();
  raf = requestAnimationFrame(tick);
}

/** ffmpeg filter chain for the legacy (non WebCodecs) path. */
function ffFilter() {
  const f = [];
  if (st.rot === 90) f.push('transpose=1');
  else if (st.rot === 180) f.push('hflip', 'vflip');
  else if (st.rot === 270) f.push('transpose=2');
  if (st.fh) f.push('hflip');
  if (st.fv) f.push('vflip');
  return f.join(',') || 'null';
}

async function save() {
  if (busy || !job) return;
  if (identity() && !$('#rv-reencode').checked) {
    $('#rv-alert').replaceChildren(alertBox(t('nothing'), 'info'));
    return;
  }
  $('#rv-alert').replaceChildren();
  const file = job.file;
  const ext = extOf(file.name);
  const reencode = $('#rv-reencode').checked || job.legacy;
  const container = SAME.includes(ext) && !job.legacy ? ext : 'mp4';
  const [dw, dh] = shown();
  const outName = `${baseName(file.name)}-rotated.${container}`;
  abort = new AbortController();
  busy = true;
  const controls = [...$('#rv-work').querySelectorAll('input,select,button')];
  controls.forEach((control) => { control.disabled = true; });
  $('#rv-go').disabled = true;
  $('#rv-result').replaceChildren();
  video.pause();
  const task = progress($('#rv-task'), { title: t('saving'), onCancel: () => abort.abort() });
  try {
    let blob;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('saving'));
      blob = await ffRun(file, ['-i', '{in}', '-vf', ffFilter(), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'],
        'out.mp4', 'video/mp4', { duration: job.info.duration, signal: abort.signal, onProgress: (x) => task.set(x) });
    } else {
      const codec = reencode ? await pickVideoCodec(container, dw, dh) : undefined;
      ({ blob } = await convert(file, {
        container,
        video: { ...mbTransform(), allowTransformationMetadata: !reencode, ...(reencode ? { codec, forceTranscode: true } : {}) },
        audio: {},
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      }));
    }
    task.close();
    abort.signal.throwIfAborted();
    if (resultURL) URL.revokeObjectURL(resultURL);
    const url = resultURL = URL.createObjectURL(blob);
    $('#rv-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtBytes(blob.size))),
      el('div', { class: 'note', text: `${t('size', dw, dh)} · ${reencode ? t('modeEnc') : t('modeFast')}` }),
      playerFor(url),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, outName) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#rv-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#rv-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#rv-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    busy = false;
    controls.forEach((control) => { control.disabled = false; });
    $('#rv-go').disabled = false;
  }
}

$('#rv-go').addEventListener('click', save);
