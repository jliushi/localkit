import { $, t, c, el, LK, icon, filePicker, fileCard, progress, stat, alertBox, errorText, download, fmtBytes, baseName } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { Quality, canEncodeAudio } from 'mediabunny';
import { prepare, metaLine, thumbnail, kbps, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { getFFmpeg, run as ffRun } from './ffmpeg-common.js';

const MB = 1024 * 1024;
const RES_STEPS = [2160, 1440, 1080, 720, 540, 480, 360, 240];
let job = null;
let abort = null;

const pick = filePicker($('#cv-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

// ---------------------------------------------------------------- sizing maths

const shortSide = (info) => Math.min(info.width, info.height);
const fps = (info) => info.fps || 30;

/** Bitrate that looks "transparent" for a given short side (H.264). */
function goodVideoBitrate(side, frameRate) {
  const base = side >= 2000 ? 14e6 : side >= 1400 ? 8e6 : side >= 1000 ? 4.5e6 : side >= 700 ? 2.5e6 : side >= 470 ? 1.2e6 : 0.8e6;
  return frameRate > 40 ? base * 1.4 : base;
}

function audioBitrate() {
  return $('#cv-mute').checked || !job.media?.audio && !job.legacy ? 0 : 96000;
}

function recommendedBytes(info) {
  const origVideo = info.videoBitrate || info.bitrate || 4e6;
  const vb = Math.min(goodVideoBitrate(shortSide(info), fps(info)), origVideo * 0.7);
  return ((vb + audioBitrate()) * info.duration) / 8;
}

/** Output dimensions for a chosen short side (even numbers, never upscaled). */
function dims(info, side) {
  const s = Math.min(side, shortSide(info));
  const k = s / shortSide(info);
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  return [even(info.width * k), even(info.height * k)];
}

/** Plan for a target size: { videoBps, width, height, tooSmall, minBytes }. */
function plan(info, targetBytes) {
  const audio = audioBitrate();
  const videoBps = (targetBytes * 8 * 0.95) / info.duration - audio;
  const resSel = $('#cv-res').value;
  let side;
  if (resSel === 'auto') {
    side = RES_STEPS.filter((r) => r <= shortSide(info));
    side = [shortSide(info), ...side].find((r) => {
      const [w, h] = dims(info, r);
      return videoBps / (w * h * fps(info)) >= 0.055;
    }) ?? 240;
  } else side = resSel === 'orig' ? shortSide(info) : Number(resSel);
  const [width, height] = dims(info, side);
  const minVideo = 90000;
  return { videoBps: Math.max(minVideo, videoBps), width, height, tooSmall: videoBps < minVideo, minBytes: ((minVideo + audio) * info.duration) / 8 / 0.95 };
}

function targetBytes() {
  const v = document.querySelector('input[name="cv-target"]:checked')?.value;
  if (v === 'custom') return (Number($('#cv-custom').value) || 0) * MB;
  if (v === 'rec') return recommendedBytes(job.info);
  return Number(v);
}

// ---------------------------------------------------------------- UI

function renderTargets(info) {
  const rec = recommendedBytes(info);
  const presets = [['rec', t('recommended'), t('recSub', fmtBytes(rec))]];
  for (const mb of [100, 50, 25, 10, 8]) if (mb * MB < info.size * 0.9 && Math.abs(mb * MB - rec) / rec > 0.15) presets.push([mb * MB, `${mb} MB`]);
  presets.push(['custom', t('custom')]);
  $('#cv-targets').replaceChildren(...presets.map(([val, label, sub], i) => el('label', { class: 'chip' },
    el('input', { type: 'radio', name: 'cv-target', value: String(val), checked: i === 0 }),
    el('span', {}, label, sub ? el('small', { text: sub }) : null))));
  $('#cv-custom').value = Math.max(1, Math.round(info.size / MB / 2));
}

function renderRes(info) {
  const opts = [['auto', t('resAuto')], ['orig', t('resOriginal', `${info.width}×${info.height}`)]];
  for (const r of RES_STEPS) if (r < shortSide(info)) opts.push([String(r), `${r}p`]);
  $('#cv-res').replaceChildren(...opts.map(([v, label]) => el('option', { value: v, text: label })));
}

function update() {
  if (!job?.info.duration) return;
  const info = job.info;
  $('#cv-custom-wrap').hidden = document.querySelector('input[name="cv-target"]:checked')?.value !== 'custom';
  const target = targetBytes();
  const alertBoxEl = $('#cv-alert');
  alertBoxEl.replaceChildren();
  if (!target) { $('#cv-est').textContent = ''; $('#cv-go').disabled = true; return; }
  const p = plan(info, target);
  $('#cv-est').innerHTML = t('estimate', fmtBytes(target), `${p.width}×${p.height}`, kbps(p.videoBps));
  if (target >= info.size) alertBoxEl.append(alertBox(t('alreadySmall', fmtBytes(target)), 'info'));
  else if (p.tooSmall) alertBoxEl.append(alertBox(t('tooSmall', fmtBytes(p.minBytes)), 'warn'));
  if (job.legacy) alertBoxEl.append(alertBox(t('legacy'), 'info'));
  $('#cv-go').disabled = false;
}

$('#cv-work').addEventListener('change', (e) => { if (e.target.closest('#cv-targets, #cv-res, #cv-mute')) update(); });
$('#cv-custom').addEventListener('input', update);

async function load(file) {
  abort?.abort();
  $('#cv-pick').hidden = true;
  $('#cv-work').hidden = false;
  $('#cv-result').replaceChildren();
  $('#cv-alert').replaceChildren();
  $('#cv-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  const task = progress($('#cv-task'), { title: t('preparing') });
  try {
    job = await prepare(file);
  } catch (e) {
    task.close();
    $('#cv-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  task.close();
  $('#cv-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  if (!job.info.width || !job.info.duration) {
    $('#cv-alert').replaceChildren(alertBox(errorText(new Error('no video track'))));
    $('#cv-go').disabled = true;
    return;
  }
  renderTargets(job.info);
  renderRes(job.info);
  update();
}

async function compress() {
  const file = job.file;
  const info = job.info;
  const target = targetBytes();
  let p = plan(info, Math.min(target, info.size * 0.98));
  abort = new AbortController();
  $('#cv-go').disabled = true;
  $('#cv-result').replaceChildren();
  const task = progress($('#cv-task'), { title: t('compressing'), onCancel: () => abort.abort() });
  try {
    let blob;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('compressing'));
      const vb = Math.round(p.videoBps);
      blob = await ffRun(file, ['-i', '{in}', '-vf', `scale=${p.width}:${p.height}`, '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', String(vb), '-maxrate', String(Math.round(vb * 1.3)), '-bufsize', String(vb * 2),
        ...($('#cv-mute').checked ? ['-an'] : ['-c:a', 'aac', '-b:a', '96k']), '-movflags', '+faststart'], 'out.mp4', 'video/mp4', { duration: info.duration, onProgress: (x) => task.set(x) });
    } else {
      const codec = await pickVideoCodec('mp4', p.width, p.height);
      const aac = await canEncodeAudio('aac');
      const encode = async (videoBps) => (await convert(file, {
        container: 'mp4',
        video: { codec: codec || undefined, width: p.width, height: p.height, fit: 'contain', quality: new Quality({ bitrate: Math.round(videoBps) }), forceTranscode: true },
        audio: $('#cv-mute').checked ? { discard: true } : { codec: aac ? 'aac' : undefined, quality: new Quality({ bitrate: 96000 }) },
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      })).blob;
      blob = await encode(p.videoBps);
      // Hardware encoders can overshoot; if a fixed limit was missed, redo once with a corrected bitrate.
      const fixed = document.querySelector('input[name="cv-target"]:checked').value !== 'rec';
      if (fixed && blob.size > target && target < info.size) {
        task.title(t('compressing'));
        task.set(0);
        p = { ...p, videoBps: p.videoBps * (target / blob.size) * 0.93 };
        blob = await encode(p.videoBps);
      }
    }
    task.close();
    showResult(blob);
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#cv-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#cv-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#cv-go').disabled = false;
  }
}

function showResult(blob) {
  const before = job.file.size;
  const saved = 1 - blob.size / before;
  const name = `${baseName(job.file.name)}-compressed.mp4`;
  const url = URL.createObjectURL(blob);
  $('#cv-result').replaceChildren(el('div', { class: 'result' },
    saved > 0.01
      ? el('div', { class: 'result-head' }, icon('circleCheck'), t('done', `${Math.round(saved * 100)}%`))
      : alertBox(t('notSmaller'), 'warn'),
    el('div', { class: 'compare' }, stat(t('before'), fmtBytes(before)), stat(t('after'), fmtBytes(blob.size), saved > 0), stat(t('saved'), saved > 0 ? `${Math.round(saved * 100)}%` : '—', saved > 0)),
    playerFor(url),
    el('div', { class: 'actions' },
      el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('downloadMp4')),
      el('button', { class: 'btn ghost', onclick: () => $('#cv-targets').scrollIntoView({ behavior: 'smooth', block: 'center' }) }, t('retune')),
      el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('tryOther')))));
  $('#cv-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#cv-go').addEventListener('click', compress);
