import { $, t, c, el, LK, filePicker, fileCard, progress, alertBox, errorText, download, fmtDuration, fmtBytes, baseName, icon } from './lib.js';
import { prepare, metaLine, thumbnail, MEDIA_ACCEPT, playerFor } from './video-ui.js';
import { decodePcm, exportPcm, check } from './audio-cleanup.js';

let job, pcm, abort, generation = 0, resultUrl;
const pick = filePicker($('#nr-pick'), { accept: MEDIA_ACCEPT, iconName: 'music', title: t('drop'), hint: t('dropHint'),
  sample: { url: `${LK.base}/assets/samples/noisy-voice-demo.mp4`, name: 'noisy-voice-demo.mp4', type: 'video/mp4' }, onFiles: ([file]) => load(file) });
const showError = (error) => $('#nr-alert').replaceChildren(alertBox(['noAudio', 'unsupported', 'tooLarge', 'noEncoder', 'workerFailed'].includes(error.message) ? t(error.message) : errorText(error)));

function clearResult() { $('#nr-result audio, #nr-result video')?.pause(); URL.revokeObjectURL(resultUrl); resultUrl = null; $('#nr-result').replaceChildren(); }

async function load(file) {
  const id = ++generation;
  abort?.abort(); abort = new AbortController();
  const signal = abort.signal;
  clearResult(); $('#nr-player audio, #nr-player video')?.pause();
  job?.media?.input.dispose(); URL.revokeObjectURL(job?.url);
  job = pcm = null;
  $('#nr-pick').hidden = true; $('#nr-work').hidden = false;
  $('#nr-player').replaceChildren(); $('#nr-alert').replaceChildren(); $('#nr-status').textContent = t('preparing');
  $('#nr-controls').disabled = true; $('#nr-go').disabled = true;
  $('#nr-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  const task = progress($('#nr-task'), { title: t('preparing'), onCancel: () => abort.abort() });
  try {
    const fresh = await prepare(file);
    if (id !== generation) { fresh.media?.input.dispose(); URL.revokeObjectURL(fresh.url); return; }
    job = fresh;
    if (job.legacy || !job.media) throw new Error('unsupported');
    pcm = await decodePcm(job.media, { signal, onProgress: (p) => task.set(p) });
    check(signal);
    $('#nr-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
    $('#nr-player').replaceChildren(job.media.video ? playerFor(job.url) : el('audio', { src: job.url, controls: true, preload: 'metadata' }));
    $('#nr-format option[value="video"]').hidden = !job.media.video;
    $('#nr-format').value = job.media.video ? 'video' : 'wav';
    $('#nr-status').textContent = t('ready', fmtDuration(job.media.duration), pcm.length);
    $('#nr-controls').disabled = false; $('#nr-go').disabled = false;
  } catch (error) { if (id === generation) signal.aborted ? $('#nr-alert').replaceChildren(alertBox(c('canceled'), 'info')) : showError(error); }
  finally { task.close(); }
}

function denoise(signal, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`${LK.base}/assets/js/noise-reduction.worker.js`, { type: 'module' });
    const cleanup = () => { worker.terminate(); signal.removeEventListener('abort', cancel); };
    const cancel = () => { cleanup(); reject(signal.reason); };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    worker.onerror = () => { cleanup(); reject(new Error('workerFailed')); };
    worker.onmessage = ({ data }) => {
      if (data.error) { cleanup(); reject(new Error(data.error)); }
      else if (data.pcm) { cleanup(); resolve(data.pcm); }
      else onProgress(data.progress);
    };
    // Keep original PCM for dry/wet mixing and repeat exports; clone only into the worker.
    worker.postMessage({ pcm, strength: Number($('#nr-strength').value) / 100, highpass: $('#nr-highpass').checked });
  });
}

$('#nr-go').onclick = async () => {
  if (!pcm || $('#nr-go').disabled) return;
  clearResult(); $('#nr-player audio, #nr-player video')?.pause();
  abort?.abort(); abort = new AbortController();
  const signal = abort.signal, id = generation;
  $('#nr-controls').disabled = true; $('#nr-go').disabled = true; $('#nr-another').disabled = true;
  $('#nr-alert').replaceChildren();
  const task = progress($('#nr-task'), { title: t('denoising'), onCancel: () => abort.abort() });
  try {
    const cleaned = await denoise(signal, (p) => task.set(p * .7));
    check(signal); task.title(t('exporting'));
    const { blob, extension } = await exportPcm(job.media, cleaned, { format: $('#nr-format').value, signal, onProgress: (p) => task.set(.7 + p * .3) });
    check(signal); if (id !== generation) return;
    resultUrl = URL.createObjectURL(blob);
    const isVideo = extension === 'mp4' || extension === 'webm';
    const player = isVideo ? playerFor(resultUrl) : el('audio', { src: resultUrl, controls: true, preload: 'metadata' });
    let current = 'cleaned';
    const before = el('button', { class: 'btn ghost', 'aria-pressed': 'false', text: t('original') });
    const after = el('button', { class: 'btn', 'aria-pressed': 'true', text: t('cleaned') });
    const select = async (mode) => {
      if (current === mode) return;
      const time = player.currentTime, playing = !player.paused, rate = player.playbackRate;
      player.pause(); current = mode;
      player.src = mode === 'original' ? job.url : resultUrl;
      before.className = `btn${mode === 'original' ? '' : ' ghost'}`; after.className = `btn${mode === 'cleaned' ? '' : ' ghost'}`;
      before.setAttribute('aria-pressed', String(mode === 'original')); after.setAttribute('aria-pressed', String(mode === 'cleaned'));
      player.addEventListener('loadedmetadata', () => { player.currentTime = Math.min(time, player.duration || time); player.playbackRate = rate; if (playing) player.play().catch(() => {}); }, { once: true });
    };
    before.onclick = () => select('original'); after.onclick = () => select('cleaned');
    $('#nr-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done')),
      el('p', { class: 'note', text: `${fmtDuration(job.media.duration)} · ${fmtBytes(blob.size)} · ${extension.toUpperCase()}` }),
      el('div', { class: 'actions', role: 'group', 'aria-label': t('compare') }, before, after),
      player, el('p', { class: 'note', text: t('compare') }),
      el('div', { class: 'actions' }, el('button', { class: 'btn lg', onclick: () => download(blob, `${baseName(job.file.name)}-cleaned.${extension}`) }, icon('download'), t('download', extension.toUpperCase())))));
    $('#nr-status').textContent = t('done');
  } catch (error) { if (id === generation) signal.aborted ? $('#nr-alert').replaceChildren(alertBox(c('canceled'), 'info')) : showError(error); }
  finally { task.close(); if (id === generation) { $('#nr-controls').disabled = false; $('#nr-go').disabled = false; $('#nr-another').disabled = false; } }
};
$('#nr-strength').oninput = () => { $('#nr-percent').textContent = `${$('#nr-strength').value}%`; clearResult(); $('#nr-status').textContent = t('changed'); };
for (const selector of ['#nr-highpass', '#nr-format']) $(selector).onchange = () => { clearResult(); $('#nr-status').textContent = t('changed'); };
$('#nr-another').onclick = () => pick.open();
