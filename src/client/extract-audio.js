import { $, t, c, el, dropzone, download, fmtBytes, baseName, status, beginTask, releaseUrls } from './lib.js';
import { getFFmpeg, run, mediaDuration } from './ffmpeg-common.js';

const st = status($('#ea-status'));
const bar = $('#ea-progress');
let file = null, duration = null;
const MIME = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav' };

$('#ea-fmt').addEventListener('change', () => { $('#ea-q-wrap').hidden = $('#ea-fmt').value !== 'mp3'; });

dropzone($('#ea-drop'), {
  accept: 'video/*,audio/*,.mkv,.flv,.wmv,.avi,.3gp,.ts,.m4v,.mov,.flac,.ogg,.opus,.amr',
  onFiles: async ([f]) => {
    file = f;
    st.clear();
    releaseUrls($('#ea-result'));
    $('#ea-result').replaceChildren();
    duration = await mediaDuration(f);
    $('#ea-info').textContent = t('info', f.name, fmtBytes(f.size));
    $('#ea-go').disabled = false;
    getFFmpeg().catch(() => {});
  },
});

$('#ea-go').addEventListener('click', async () => {
  if (!file) return;
  const task = beginTask({ cancellable: true });
  const fmt = $('#ea-fmt').value;
  const outName = `${baseName(file.name)}.${fmt}`;
  const opts = {
    signal: task.signal,
    duration,
    onProgress: (p) => { bar.firstElementChild.style.width = `${(p * 100).toFixed(1)}%`; st.busy(t('working', `${Math.round(p * 100)}%`)); },
  };
  $('#ea-go').disabled = true;
  bar.hidden = false;
  try {
    st.busy(t('loading'));
    st.busy(t('working', ''));
    let blob;
    if (fmt === 'mp3') blob = await run(file, ['-i', '{in}', '-vn', '-map', '0:a:0', '-c:a', 'libmp3lame', '-q:a', $('#ea-q').value], 'out.mp3', MIME.mp3, opts);
    else if (fmt === 'wav') blob = await run(file, ['-i', '{in}', '-vn', '-map', '0:a:0', '-c:a', 'pcm_s16le'], 'out.wav', MIME.wav, opts);
    else {
      try {
        // Copy the original AAC track when there is one: lossless and instant.
        blob = await run(file, ['-i', '{in}', '-vn', '-map', '0:a:0', '-c:a', 'copy'], 'out.m4a', MIME.m4a, opts);
      } catch {
        task.signal.throwIfAborted();
        blob = await run(file, ['-i', '{in}', '-vn', '-map', '0:a:0', '-c:a', 'aac', '-b:a', '192k'], 'out.m4a', MIME.m4a, opts);
      }
    }
    releaseUrls($('#ea-result'));
    $('#ea-result').replaceChildren(
      el('audio', { src: URL.createObjectURL(blob), controls: true }),
      el('div', { class: 'row' }, el('button', { class: 'btn', text: `⬇ ${c('download')} ${outName}`, onclick: () => download(blob, outName) })));
    st.ok(t('done', outName, fmtBytes(blob.size)));
  } catch (e) {
    st.error(/matches no streams|does not contain any stream|Output file .* does not contain/i.test(e.message) ? new Error(t('noAudio')) : e);
  } finally {
    $('#ea-go').disabled = false;
    bar.hidden = true;
    task.finish();
  }
});
