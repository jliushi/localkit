import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, baseName, extOf } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { Quality } from 'mediabunny';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { getFFmpeg, run as ffRun } from './ffmpeg-common.js';

let job = null, abort = null;

// Codecs each container can hold without re-encoding.
const FITS = {
  mp4: { video: ['avc', 'hevc', 'av1', 'vp9'], audio: ['aac', 'mp3', 'opus', 'flac', 'ac3', 'eac3'] },
  mov: { video: ['avc', 'hevc'], audio: ['aac', 'mp3', 'pcm-s16', 'pcm-s24', 'ac3'] },
  webm: { video: ['vp8', 'vp9', 'av1'], audio: ['opus', 'vorbis'] },
  mkv: { video: ['avc', 'hevc', 'vp8', 'vp9', 'av1'], audio: ['aac', 'mp3', 'opus', 'vorbis', 'flac', 'ac3', 'eac3', 'pcm-s16'] },
};
const CODEC_NAME = { avc: 'H.264', hevc: 'H.265', vp8: 'VP8', vp9: 'VP9', av1: 'AV1' };

const pick = filePicker($('#cx-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

const target = () => $$('input[name="cx-fmt"]').find((r) => r.checked).value;
const resizing = () => Number($('#cx-res').value) > 0 && Number($('#cx-res').value) < Math.min(job.info.width, job.info.height);

function canCopy(container) {
  if (job.legacy || !job.media) return false;
  const f = FITS[container];
  const v = job.info.videoCodec;
  const a = job.info.audioCodec;
  return (!v || f.video.includes(v)) && (!a || f.audio.includes(a)) && !resizing();
}

function update() {
  const container = target();
  const same = extOf(job.file.name) === container || (container === 'mp4' && extOf(job.file.name) === 'm4v');
  if (job.legacy) { $('#cx-mode').replaceChildren(same ? alertBox(t('same', container.toUpperCase()), 'info') : ''); return; }
  $('#cx-mode').replaceChildren(
    same ? alertBox(t('same', container.toUpperCase()), 'info')
      : canCopy(container) ? alertBox(t('instant'), 'info')
        : alertBox(t('reencode', container === 'webm' ? 'VP9' : 'H.264'), 'warn'));
}

let loadSeq = 0;
async function load(file) {
  const seq = ++loadSeq;
  abort?.abort();
  $('#cx-go').disabled = true;
  $('#cx-mode').replaceChildren();
  job = null;
  $('#cx-pick').hidden = true;
  $('#cx-work').hidden = false;
  $('#cx-result').replaceChildren();
  $('#cx-alert').replaceChildren();
  $('#cx-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  try {
    const j = await prepare(file);
    if (seq !== loadSeq) return;
    job = j;
  } catch (e) {
    if (seq !== loadSeq) return;
    $('#cx-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  const thumb = await thumbnail(job);
  if (seq !== loadSeq) return;
  $('#cx-file').replaceChildren(fileCard({ file, meta: `${metaLine(job.info)}${job.info.videoCodec ? ` · ${CODEC_NAME[job.info.videoCodec] || job.info.videoCodec}` : ''}`, thumb, onChange: () => pick.open() }));
  // Preselect a sensible target: MP4 unless the file already is one.
  const ext = extOf(file.name);
  const preselect = ext === 'mp4' || ext === 'm4v' ? 'webm' : 'mp4';
  for (const r of $$('input[name="cx-fmt"]')) r.checked = r.value === preselect;
  if (job.legacy) $('#cx-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  update();
  $('#cx-go').disabled = false;
}

async function go() {
  if (!job) return;
  const container = target();
  const file = job.file;
  const name = `${baseName(file.name)}.${container}`;
  abort = new AbortController();
  $('#cx-go').disabled = true;
  $('#cx-result').replaceChildren();
  const task = progress($('#cx-task'), { title: t('converting'), onCancel: () => abort.abort() });
  try {
    let blob;
    const res = Number($('#cx-res').value);
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('converting'));
      const crf = { high: '20', medium: '25', low: '30' }[$('#cx-q').value];
      const scale = res ? ['-vf', `scale=-2:'min(${res},ih)'`] : [];
      const args = container === 'webm'
        ? ['-i', '{in}', ...scale, '-c:v', 'libvpx', '-b:v', { high: '3M', medium: '1.5M', low: '700k' }[$('#cx-q').value], '-deadline', 'realtime', '-cpu-used', '8', '-c:a', 'libvorbis']
        : ['-i', '{in}', ...scale, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', ...(container === 'mkv' ? [] : ['-movflags', '+faststart'])];
      blob = await ffRun(file, args, `out.${container}`, { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska' }[container],
        { duration: job.info.duration, onProgress: (x) => task.set(x) });
    } else {
      const copy = canCopy(container);
      const [w, h] = [job.info.width, job.info.height];
      const k = resizing() ? res / Math.min(w, h) : 1;
      const even = (n) => Math.round(n / 2) * 2;
      const codec = copy ? undefined : await pickVideoCodec(container, even(w * k), even(h * k));
      ({ blob } = await convert(file, {
        container,
        video: copy ? {} : { codec, quality: new Quality($('#cx-q').value), ...(k < 1 ? { width: even(w * k), height: even(h * k), fit: 'contain' } : {}) },
        audio: {},
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      }));
    }
    task.close();
    $('#cx-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', container.toUpperCase(), fmtBytes(blob.size))),
      container === 'mkv' ? null : playerFor(URL.createObjectURL(blob)),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('download', container.toUpperCase())),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#cx-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#cx-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#cx-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#cx-go').disabled = false;
  }
}

$('#cx-work').addEventListener('change', (e) => { if (e.target.name === 'cx-fmt' || e.target.id === 'cx-res') update(); });
$('#cx-go').addEventListener('click', go);
