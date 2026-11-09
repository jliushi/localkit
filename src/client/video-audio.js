import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtDuration, baseName, extOf } from './lib.js';
import { convert, ConversionCanceledError } from './media.js';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { getFFmpeg, mediaDuration, probeMedia, run as ffRun } from './ffmpeg-common.js';

let job = null, music = null, abort = null, video = null, resultURL = null, busy = false, generation = 0;
const mode = () => $('input[name="va-mode"]:checked').value;
const pick = filePicker($('#va-pick'), { accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([file]) => load(file) });
const musicPick = filePicker($('#va-music-pick'), {
  accept: 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus', iconName: 'music', title: t('musicDrop'), hint: t('musicHint'), compact: true,
  onFiles: ([file]) => {
    music = file;
    $('#va-music-file').replaceChildren(fileCard({ file, meta: fmtBytes(file.size), onChange: () => musicPick.open() }));
    $('#va-alert').replaceChildren();
    update();
  },
});

function update() {
  $('#va-music').hidden = mode() === 'mute';
  $('#va-original-opt').hidden = mode() !== 'mix';
  $('#va-go').disabled = busy || !job || (mode() !== 'mute' && !music);
  if (video) video.muted = mode() !== 'mix';
}
$('#va-modes').addEventListener('change', update);
for (const id of ['volume', 'original']) $(`#va-${id}`).addEventListener('input', (e) => { $(`#va-${id}-val`).textContent = `${e.target.value}%`; });

async function load(file) {
  abort?.abort();
  const current = ++generation;
  video?.pause();
  if (job) { URL.revokeObjectURL(job.url); job.media?.input.dispose(); }
  job = null;
  $('#va-pick').hidden = true;
  $('#va-work').hidden = false;
  $('#va-result').replaceChildren();
  $('#va-player').replaceChildren();
  $('#va-alert').replaceChildren();
  $('#va-file').replaceChildren(fileCard({ file, meta: t('preparing'), onChange: () => pick.open() }));
  update();
  try {
    const next = await prepare(file);
    if (current !== generation) { URL.revokeObjectURL(next.url); next.media?.input.dispose(); return; }
    if (!next.info.width && !next.legacy) throw new Error(t('noVideo'));
    job = next;
    $('#va-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
    video = playerFor(job.url);
    $('#va-player').replaceChildren(video);
    if (job.media && !job.media.audio) $('#va-alert').replaceChildren(alertBox(t('noSound'), 'info'));
    update();
  } catch (e) {
    $('#va-alert').replaceChildren(alertBox(errorText(e)));
  }
}

async function save() {
  if (busy || !job) return;
  if (mode() !== 'mute' && !music) { $('#va-alert').replaceChildren(alertBox(t('needMusic'))); return; }
  const currentJob = job, currentMusic = music, selected = mode();
  const ext = extOf(job.file.name);
  // Keep compatible containers and compressed video packets. Legacy formats use MP4/H.264.
  const container = ['mp4', 'mov', 'webm', 'mkv'].includes(ext) && !job.legacy ? ext : 'mp4';
  const volume = Number($('#va-volume').value) / 100;
  const original = Number($('#va-original').value) / 100;
  const loop = $('#va-loop').value === 'loop';
  const fade = Number($('#va-fade').value);
  const controller = abort = new AbortController();
  busy = true;
  update();
  // Freeze settings during export so the displayed choice matches the saved output.
  const inputs = $$('#va-work input, #va-work select, #va-work .filecard button');
  inputs.forEach((input) => { input.disabled = true; });
  video?.pause();
  $('#va-alert').replaceChildren();
  $('#va-result').replaceChildren();
  const task = progress($('#va-task'), { title: t('saving'), onCancel: () => controller.abort() });
  try {
    let blob, duration = currentJob.info.duration, hasOriginal = !!currentJob.media?.audio;
    if (selected === 'mute' && !currentJob.legacy) {
      ({ blob } = await convert(currentJob.file, { container, video: {}, audio: { discard: true }, signal: controller.signal, onProgress: (p) => task.set(p) }));
    } else {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      controller.signal.throwIfAborted();
      if (currentJob.legacy) {
        const info = await probeMedia(currentJob.file, { signal: controller.signal });
        if (!info.width) throw new Error(t('noVideo'));
        duration = info.duration;
        hasOriginal = info.audio;
      }
      if (!Number.isFinite(duration) || duration <= 0) throw new Error(t('noVideo'));
      task.title(t('saving'));
      const args = ['-i', '{in}'];
      const extraFiles = [];
      if (selected === 'mute') args.push('-map', '0:v:0', '-an');
      else {
        const musicName = `music.${extOf(currentMusic.name).replace(/[^a-z0-9]/gi, '') || 'audio'}`;
        extraFiles.push({ name: musicName, data: new Uint8Array(await currentMusic.arrayBuffer()) });
        controller.signal.throwIfAborted();
        if (loop) args.push('-stream_loop', '-1');
        args.push('-i', musicName);
        const musicDuration = loop || !fade ? duration : await mediaDuration(currentMusic);
        const fadeEnd = Math.min(duration, musicDuration || duration);
        const fadeLength = Math.min(fade, fadeEnd);
        // Padding makes the replacement track cover the whole video when Play once is selected.
        const filters = [`[1:a:0]asetpts=PTS-STARTPTS,volume=${volume},apad,atrim=0:${duration}${fadeLength ? `,afade=t=out:st=${Math.max(0, fadeEnd - fadeLength)}:d=${fadeLength}` : ''}[music]`];
        if (selected === 'mix' && hasOriginal) filters.push(`[0:a:0]asetpts=PTS-STARTPTS,volume=${original},apad,atrim=0:${duration}[original]`, '[original][music]amix=inputs=2:duration=longest:normalize=0[audio]');
        args.push('-filter_complex', filters.join(';'), '-map', '0:v:0', '-map', selected === 'mix' && hasOriginal ? '[audio]' : '[music]', '-c:a', container === 'webm' ? 'libopus' : 'aac', '-b:a', '160k');
      }
      if (currentJob.legacy) args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p');
      else args.push('-c:v', 'copy');
      args.push('-t', String(duration));
      if (container === 'mp4' || container === 'mov') args.push('-movflags', '+faststart');
      const mime = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska' }[container];
      blob = await ffRun(currentJob.file, args, `soundtrack.${container}`, mime, { duration, extraFiles, signal: controller.signal, onProgress: (p) => task.set(p) });
    }
    controller.signal.throwIfAborted();
    if (resultURL) URL.revokeObjectURL(resultURL);
    resultURL = URL.createObjectURL(blob);
    const name = `${baseName(currentJob.file.name)}-${selected === 'mute' ? 'muted' : selected === 'mix' ? 'mixed' : 'music'}.${container}`;
    $('#va-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtDuration(duration), fmtBytes(blob.size))),
      playerFor(resultURL),
      el('div', { class: 'actions' }, el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('download')), el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#va-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    $('#va-alert').replaceChildren(alertBox(controller.signal.aborted || e instanceof ConversionCanceledError ? c('canceled') : errorText(e), controller.signal.aborted ? 'info' : 'error'));
  } finally {
    task.close();
    busy = false;
    inputs.forEach((input) => { input.disabled = false; });
    update();
  }
}
$('#va-go').addEventListener('click', save);
