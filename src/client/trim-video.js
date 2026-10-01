import { $, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtTime, baseName, extOf } from './lib.js';
import { convert, frames, pickVideoCodec, ConversionCanceledError } from './media.js';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { timeline } from './timeline.js';
import { getFFmpeg, run as ffRun } from './ffmpeg-common.js';

let job = null, tl = null, abort = null, video = null;
const SAME = ['mp4', 'mov', 'webm', 'mkv'];

const pick = filePicker($('#tv-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

async function load(file) {
  abort?.abort();
  tl?.destroy();
  $('#tv-pick').hidden = true;
  $('#tv-work').hidden = false;
  $('#tv-result').replaceChildren();
  $('#tv-alert').replaceChildren();
  $('#tv-tl').replaceChildren();
  $('#tv-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  try {
    job = await prepare(file);
  } catch (e) {
    $('#tv-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#tv-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  video = playerFor(job.url);
  $('#tv-player').replaceChildren(video);
  const duration = job.info.duration || await new Promise((r) => video.addEventListener('loadedmetadata', () => r(video.duration), { once: true }));
  if (!Number.isFinite(duration)) { $('#tv-alert').replaceChildren(alertBox(errorText(new Error('unknown duration')))); return; }
  if (job.legacy) $('#tv-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  tl = timeline({
    media: video, duration, start: 0, end: duration,
    strip: job.media ? (n) => frames(job.media, n, 64) : null,
  });
  $('#tv-tl').replaceChildren(tl.root);
}

async function trim() {
  const { start, end } = tl.get();
  const file = job.file;
  const ext = extOf(file.name);
  const reencode = $('#tv-reencode').checked || job.legacy;
  const container = !reencode && SAME.includes(ext) ? ext : (ext === 'webm' && !job.legacy ? 'webm' : 'mp4');
  const outName = `${baseName(file.name)}-${fmtTime(start, 0).replace(/:/g, '.')}-${fmtTime(end, 0).replace(/:/g, '.')}.${container}`;
  abort = new AbortController();
  $('#tv-go').disabled = true;
  $('#tv-result').replaceChildren();
  video.pause();
  const task = progress($('#tv-task'), { title: t('trimming'), onCancel: () => abort.abort() });
  try {
    let blob;
    const mute = $('#tv-mute').checked;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('trimming'));
      blob = await ffRun(file, ['-ss', start.toFixed(3), '-i', '{in}', '-t', (end - start).toFixed(3), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
        ...(mute ? ['-an'] : ['-c:a', 'aac', '-b:a', '160k']), '-movflags', '+faststart'], 'out.mp4', 'video/mp4', { duration: end - start, onProgress: (x) => task.set(x) });
    } else {
      const codec = reencode ? await pickVideoCodec(container, job.info.width, job.info.height) : undefined;
      ({ blob } = await convert(file, {
        container,
        trim: { start, end },
        video: reencode ? { codec, forceTranscode: true } : {},
        audio: mute ? { discard: true } : {},
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      }));
    }
    task.close();
    const url = URL.createObjectURL(blob);
    $('#tv-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtTime(end - start, 1))),
      el('div', { class: 'note', text: `${t('clipInfo', fmtTime(start), fmtTime(end))} · ${fmtBytes(blob.size)}` }),
      playerFor(url),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, outName) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => $('#tv-tl').scrollIntoView({ behavior: 'smooth', block: 'center' }) }, t('again')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#tv-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#tv-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#tv-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#tv-go').disabled = false;
  }
}

$('#tv-go').addEventListener('click', trim);
