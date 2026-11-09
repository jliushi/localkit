import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtDuration, baseName, extOf } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { AudioSample, canEncodeAudio } from 'mediabunny';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { Stretcher } from './wsola.js';
import { getFFmpeg, probeMedia, run as ffRun } from './ffmpeg-common.js';

const SAME = ['mp4', 'mov', 'webm', 'mkv'];
let job = null, video = null, abort = null, resultURL = null, busy = false;
let speed = 2;

const pick = filePicker($('#vs-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

const fmtSpeed = (s) => `${Number(s.toFixed(2))}×`;
const audioMode = () => $$('input[name="vs-audio"]').find((r) => r.checked).value;
const hasAudio = () => (job.legacy ? job.info.audio !== false : !!job.media?.audio);

function setSpeed(s, from) {
  speed = Math.min(4, Math.max(0.25, Math.round(s * 100) / 100));
  if (from !== 'range') $('#vs-range').value = String(Math.log2(speed));
  for (const r of $$('input[name="vs-speed"]')) r.checked = Number(r.value) === speed;
  $('#vs-val').textContent = fmtSpeed(speed);
  if (video) {
    video.playbackRate = speed;
    video.preservesPitch = true;
  }
  update();
}

function update() {
  if (!job?.info.duration) return;
  $('#vs-est').textContent = t('estimate', fmtDuration(job.info.duration / speed), fmtDuration(job.info.duration));
  if (video) video.muted = audioMode() === 'remove';
}

$('#vs-chips').addEventListener('change', (e) => { if (e.target.name === 'vs-speed') setSpeed(Number(e.target.value)); });
$('#vs-range').addEventListener('input', (e) => {
  const v = 2 ** Number(e.target.value);
  setSpeed(Math.abs(v - 1) < 0.04 ? 1 : v, 'range'); // snap to 1×
});
$$('input[name="vs-audio"]').forEach((r) => r.addEventListener('change', update));

async function load(file) {
  if (busy) return;
  abort?.abort();
  video?.pause();
  if (job) { URL.revokeObjectURL(job.url); job.media?.input.dispose(); }
  job = null;
  $('#vs-pick').hidden = true;
  $('#vs-work').hidden = false;
  $('#vs-result').replaceChildren();
  $('#vs-alert').replaceChildren();
  $('#vs-go').disabled = true;
  $('#vs-file').replaceChildren(fileCard({ file, meta: t('preparing'), onChange: () => pick.open() }));
  try {
    job = await prepare(file);
    if (job.legacy) {
      abort = new AbortController();
      const task = progress($('#vs-task'), { title: c('loadingEngine'), onCancel: () => abort.abort() });
      try { Object.assign(job.info, await probeMedia(file, { signal: abort.signal })); }
      finally { task.close(); }
    }
  } catch (e) {
    $('#vs-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#vs-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  video = playerFor(job.url);
  $('#vs-player').replaceChildren(video);
  const duration = job.info.duration;
  if (!Number.isFinite(duration) || !job.info.width) {
    $('#vs-alert').replaceChildren(alertBox(errorText(new Error('no video track'))));
    $('#vs-go').disabled = true;
    return;
  }
  job.info.duration = duration;
  $('#vs-go').disabled = false;
  if (job.legacy) $('#vs-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  else if (!hasAudio()) $('#vs-alert').replaceChildren(alertBox(t('noAudio'), 'info'));
  $('#vs-audio-opt').hidden = !hasAudio();
  setSpeed(speed);
}

// ---------------------------------------------------------------- export

/** Chain of ffmpeg atempo filters (each factor must be within 0.5–2). */
function atempo(s) {
  const f = [];
  while (s > 2) { f.push(2); s /= 2; }
  while (s < 0.5) { f.push(0.5); s /= 0.5; }
  f.push(s);
  return f.map((x) => `atempo=${x.toFixed(4)}`).join(',');
}

/** Video `process` hook: retimes every frame and thins them out when speeding up so the frame rate stays sane. */
function videoRetimer() {
  const cap = Math.max(30, Math.round(job.info.fps || 30));
  let last = -Infinity;
  return (sample) => {
    const ts = sample.timestamp / speed;
    if (speed > 1 && ts < last + 0.75 / cap) return null;
    last = ts;
    const out = sample.clone();
    out.setTimestamp(ts);
    out.setDuration(Math.max(sample.duration / speed, speed > 1 ? 1 / cap : 0));
    return out;
  };
}

/** Audio `process` hook: time-stretches the audio chunk by chunk (pitch preserved). */
function audioRetimer(endTime) {
  let st = null, first = 0, written = 0;
  const wrap = (planes, sampleRate) => {
    if (!planes.length || !planes[0].length) return [];
    const n = planes[0].length;
    const data = new Float32Array(n * planes.length);
    planes.forEach((p, i) => data.set(p, i * n));
    const out = new AudioSample({ data, format: 'f32-planar', numberOfChannels: planes.length, sampleRate, timestamp: first / speed + written / sampleRate });
    written += n;
    return [out];
  };
  return (sample) => {
    const n = sample.numberOfFrames;
    if (!st) {
      st = new Stretcher({ channels: sample.numberOfChannels, sampleRate: sample.sampleRate, speed });
      first = Math.max(0, sample.timestamp);
    }
    const planes = Array.from({ length: sample.numberOfChannels }, (_, ch) => {
      const a = new Float32Array(n);
      sample.copyTo(a, { planeIndex: ch, format: 'f32-planar' });
      return a;
    });
    let out = st.push(planes);
    if (sample.timestamp + sample.duration >= endTime - 0.0005) { // last chunk: release the tail
      const tail = st.flush();
      out = out.length ? out.map((p, ch) => { const r = new Float32Array(p.length + tail[ch].length); r.set(p); r.set(tail[ch], p.length); return r; }) : tail;
    }
    return wrap(out, sample.sampleRate);
  };
}

async function change() {
  if (busy || !job) return;
  $('#vs-alert').replaceChildren();
  if (speed === 1) {
    $('#vs-alert').replaceChildren(alertBox(t('same'), 'info'));
    return;
  }
  const file = job.file;
  const ext = extOf(file.name);
  const container = SAME.includes(ext) && !job.legacy ? ext : 'mp4';
  const keepAudio = hasAudio() && audioMode() === 'keep';
  const tag = fmtSpeed(speed).replace('×', 'x');
  const outName = `${baseName(file.name)}-${tag}.${container}`;
  abort = new AbortController();
  busy = true;
  const controls = [...$('#vs-work').querySelectorAll('input,select,button')];
  controls.forEach((control) => { control.disabled = true; });
  $('#vs-go').disabled = true;
  $('#vs-result').replaceChildren();
  video.pause();
  const task = progress($('#vs-task'), { title: t('changing'), onCancel: () => abort.abort() });
  try {
    let blob;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('changing'));
      blob = await ffRun(file, ['-i', '{in}', '-vf', `setpts=PTS/${speed}`, ...(keepAudio ? ['-af', atempo(speed), '-c:a', 'aac', '-b:a', '160k'] : ['-an']),
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'], 'out.mp4', 'video/mp4',
      { duration: job.info.duration, signal: abort.signal, onProgress: (x) => task.set(x) });
    } else {
      const codec = await pickVideoCodec(container, job.info.width, job.info.height);
      const aac = container === 'webm' ? false : await canEncodeAudio('aac');
      const audioEnd = keepAudio ? await job.media.audio.computeDuration() : 0;
      ({ blob } = await convert(file, {
        container,
        video: { codec: codec || undefined, forceTranscode: true, process: videoRetimer() },
        audio: keepAudio ? { codec: aac ? 'aac' : undefined, process: audioRetimer(audioEnd), forceTranscode: true } : { discard: true },
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      }));
    }
    task.close();
    abort.signal.throwIfAborted();
    if (resultURL) URL.revokeObjectURL(resultURL);
    const url = resultURL = URL.createObjectURL(blob);
    $('#vs-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtDuration(job.info.duration), fmtDuration(job.info.duration / speed), fmtBytes(blob.size))),
      playerFor(url),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, outName) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => $('#vs-chips').scrollIntoView({ behavior: 'smooth', block: 'center' }) }, t('again')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#vs-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#vs-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#vs-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    busy = false;
    controls.forEach((control) => { control.disabled = false; });
    $('#vs-go').disabled = false;
  }
}

$('#vs-go').addEventListener('click', change);
