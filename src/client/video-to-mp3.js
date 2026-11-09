import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtDuration, baseName } from './lib.js';
import { convert, ConversionCanceledError } from './media.js';
import { Quality } from 'mediabunny';
import { prepare, metaLine, thumbnail, MEDIA_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { timeline } from './timeline.js';
import { getFFmpeg, run as ffRun } from './ffmpeg-common.js';

let job = null, tl = null, abort = null, runId = 0, debounce = 0;
let resultURL = null;

const pick = filePicker($('#va-pick'), {
  accept: MEDIA_ACCEPT, iconName: 'music', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

const fmt = () => $$('input[name="va-fmt"]').find((r) => r.checked).value;
const bitrate = () => Number($$('input[name="va-q"]').find((r) => r.checked).value);

async function load(file) {
  runId++;
  clearTimeout(debounce);
  abort?.abort();
  if (job) { URL.revokeObjectURL(job.url); job.media?.input.dispose(); }
  job = null;
  tl?.destroy();
  tl = null;
  $('#va-pick').hidden = true;
  $('#va-work').hidden = false;
  $('#va-result').replaceChildren();
  if (resultURL) URL.revokeObjectURL(resultURL);
  resultURL = null;
  $('#va-alert').replaceChildren();
  $('#va-part').checked = false;
  $('#va-range').hidden = true;
  $('#va-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  try {
    job = await prepare(file);
  } catch (e) {
    $('#va-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#va-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  if (job.media && !job.media.audio) { $('#va-alert').replaceChildren(alertBox(t('noAudio'))); return; }
  if (job.legacy) $('#va-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  await run();
}

function showRange() {
  const on = $('#va-part').checked;
  $('#va-range').hidden = !on;
  if (on && !tl) {
    const media = job.info.width ? playerFor(job.url) : el('audio', { src: job.url, controls: true, preload: 'metadata' });
    $('#va-player').replaceChildren(media);
    tl = timeline({ media, duration: job.info.duration, start: 0, end: job.info.duration, onChange: () => { clearTimeout(debounce); debounce = setTimeout(run, 700); } });
    $('#va-tl').replaceChildren(tl.root);
  }
  run();
}

async function run() {
  if (!job) return;
  const id = ++runId;
  abort?.abort();
  abort = new AbortController();
  const signal = abort.signal;
  const container = fmt();
  $('#va-q-wrap').hidden = container !== 'mp3';
  const range = $('#va-part').checked && tl ? tl.get() : null;
  const name = `${baseName(job.file.name)}.${container}`;
  $('#va-result').replaceChildren();
  const task = progress($('#va-task'), { title: t('converting'), onCancel: () => abort.abort() });
  try {
    let blob;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      if (id !== runId) return;
      task.title(t('converting'));
      const codec = { mp3: ['-c:a', 'libmp3lame', '-b:a', String(bitrate())], m4a: ['-c:a', 'aac', '-b:a', '192k'], wav: ['-c:a', 'pcm_s16le'] }[container];
      const cut = range ? ['-ss', range.start.toFixed(3), '-t', (range.end - range.start).toFixed(3)] : [];
      blob = await ffRun(job.file, [...cut, '-i', '{in}', '-vn', '-map', '0:a:0', ...codec], `out.${container}`, { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav' }[container],
        { duration: range ? range.end - range.start : job.info.duration, onProgress: (x) => task.set(x), signal });
    } else {
      const audio = container === 'mp3' ? { codec: 'mp3', quality: new Quality({ bitrate: bitrate() }) }
        : container === 'wav' ? { codec: 'pcm-s16' }
          : { codec: 'aac' }; // copies the original AAC track untouched when the source has one
      ({ blob } = await convert(job.file, {
        container, video: { discard: true }, audio, trim: range ? { start: range.start, end: range.end } : undefined,
        onProgress: (x) => task.set(x), signal,
      }));
    }
    if (id !== runId) return;
    signal.throwIfAborted();
    task.close();
    if (resultURL) URL.revokeObjectURL(resultURL);
    resultURL = URL.createObjectURL(blob);
    const len = range ? range.end - range.start : job.info.duration;
    $('#va-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('ready', container.toUpperCase(), fmtDuration(len), fmtBytes(blob.size))),
      el('audio', { src: resultURL, controls: true }),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('download', container.toUpperCase())),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
  } catch (e) {
    if (id !== runId) return;
    task.close();
    if (e instanceof ConversionCanceledError || signal.aborted) $('#va-alert').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#va-alert').replaceChildren(alertBox(/no streams|does not contain|discarded|audio: /i.test(e.message) ? t('noAudio') : errorText(e)));
  }
}

$('#va-work').addEventListener('change', (e) => {
  if (e.target.name === 'va-fmt' || e.target.name === 'va-q') run();
  if (e.target.id === 'va-part') showRange();
});
