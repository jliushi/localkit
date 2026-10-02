import { $, t, c, el, LK, filePicker, fileCard, progress, alertBox, errorText, download, fmtDuration, fmtBytes, baseName, icon } from './lib.js';
import { prepare, metaLine, thumbnail, MEDIA_ACCEPT, playerFor } from './video-ui.js';
import { decodePcm, loudness, silenceCuts, cutPcm, exportPcm, drawLoudness, check } from './audio-cleanup.js';

let job, pcm, analysis, cuts, abort, generation = 0, previewing = false, resultUrl;
let player;
const pick = filePicker($('#rs-pick'), { accept: MEDIA_ACCEPT, iconName: 'music', title: t('drop'), hint: t('dropHint'),
  sample: { url: `${LK.base}/assets/samples/silence-demo.mp4`, name: 'silence-demo.mp4', type: 'video/mp4' }, onFiles: ([file]) => load(file) });
const showError = (error) => $('#rs-alert').replaceChildren(alertBox(['noAudio', 'unsupported', 'tooLarge', 'noEncoder'].includes(error.message) ? t(error.message) : errorText(error)));

function stopPreview() { previewing = false; player?.pause(); $('#rs-preview').textContent = t('preview'); }
function clearResult() { URL.revokeObjectURL(resultUrl); resultUrl = null; $('#rs-result').replaceChildren(); }

async function load(file) {
  const id = ++generation;
  abort?.abort(); abort = new AbortController();
  const signal = abort.signal;
  stopPreview(); clearResult();
  job?.media?.input.dispose(); URL.revokeObjectURL(job?.url);
  job = pcm = analysis = cuts = null;
  $('#rs-pick').hidden = true; $('#rs-work').hidden = false;
  $('#rs-player').replaceChildren(); $('#rs-alert').replaceChildren(); $('#rs-summary').textContent = '';
  $('#rs-controls').disabled = true; $('#rs-go').disabled = true;
  $('#rs-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  const task = progress($('#rs-task'), { title: t('analyzing'), onCancel: () => abort.abort() });
  try {
    const fresh = await prepare(file);
    if (id !== generation) { fresh.media?.input.dispose(); URL.revokeObjectURL(fresh.url); return; }
    job = fresh;
    if (job.legacy || !job.media) throw new Error('unsupported');
    pcm = await decodePcm(job.media, { signal, onProgress: (p) => task.set(p) });
    check(signal);
    analysis = loudness(pcm);
    $('#rs-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
    player = job.media.video ? playerFor(job.url) : el('audio', { src: job.url, controls: true, preload: 'metadata' });
    $('#rs-player').replaceChildren(player);
    player.addEventListener('timeupdate', skipSilence);
    player.addEventListener('ended', stopPreview);
    player.addEventListener('pause', () => { if (player.ended) stopPreview(); });
    $('#rs-format option[value="video"]').hidden = !job.media.video;
    $('#rs-format').value = job.media.video ? 'video' : 'wav';
    $('#rs-auto').checked = true;
    $('#rs-controls').disabled = false;
    updateCuts();
  } catch (error) {
    if (id === generation) signal.aborted ? $('#rs-alert').replaceChildren(alertBox(c('canceled'), 'info')) : showError(error);
  } finally { task.close(); }
}

function updateCuts() {
  if (!analysis) return;
  stopPreview(); clearResult();
  if ($('#rs-auto').checked) $('#rs-threshold').value = analysis.auto;
  $('#rs-db').textContent = `${$('#rs-threshold').value} dB`;
  cuts = silenceCuts(analysis, job.media.duration, Number($('#rs-threshold').value), Number($('#rs-min').value), Number($('#rs-padding').value));
  drawLoudness($('#rs-wave'), analysis, job.media.duration, cuts.removed);
  $('#rs-summary').textContent = t('summary', fmtDuration(cuts.removedDuration), fmtDuration(job.media.duration), Math.round(cuts.removedDuration / job.media.duration * 100), fmtDuration(job.media.duration - cuts.removedDuration));
  $('#rs-summary').dataset.removed = cuts.removedDuration.toFixed(3);
  $('#rs-alert').replaceChildren(...(!cuts.kept.length ? [alertBox(t('allSilent'), 'info')] : !cuts.removed.length ? [alertBox(t('noCuts'), 'info')] : []));
  $('#rs-go').disabled = !cuts.kept.length;
  $('#rs-preview').disabled = !cuts.kept.length;
}

function skipSilence() {
  if (!previewing || !cuts) return;
  const position = player.currentTime;
  const removed = cuts.removed.find(([a, b]) => position >= a - .015 && position < b);
  if (removed) {
    if (removed[1] >= job.media.duration - .02) stopPreview();
    else player.currentTime = removed[1];
  }
}

$('#rs-preview').onclick = async () => {
  if (previewing) { stopPreview(); return; }
  if (!cuts?.kept.length) return;
  previewing = true; $('#rs-preview').textContent = t('stop');
  player.currentTime = cuts.kept[0][0];
  try { await player.play(); } catch { stopPreview(); }
};
$('#rs-cutlist').onclick = () => {
  if (!cuts) return;
  const lines = [...cuts.kept.map(([a, b]) => [a, b, t('keepLabel')]), ...cuts.removed.map(([a, b]) => [a, b, t('removeLabel')])].sort((a, b) => a[0] - b[0]);
  download(new Blob([`${t('cutlistTitle')}\n${job.file.name}\n\n${lines.map(([a, b, label]) => `${label}\t${a.toFixed(3)}\t${b.toFixed(3)}`).join('\n')}\n`], { type: 'text/plain;charset=utf-8' }), `${baseName(job.file.name)}-cutlist.txt`);
};

$('#rs-go').onclick = async () => {
  if (!cuts?.kept.length || $('#rs-go').disabled) return;
  stopPreview(); clearResult();
  abort?.abort(); abort = new AbortController();
  const signal = abort.signal, id = generation;
  $('#rs-controls').disabled = true; $('#rs-go').disabled = true; $('#rs-another').disabled = true;
  $('#rs-alert').replaceChildren();
  const task = progress($('#rs-task'), { title: t('exporting'), onCancel: () => abort.abort() });
  try {
    const { blob, extension } = await exportPcm(job.media, cutPcm(pcm, cuts.kept), { format: $('#rs-format').value, kept: cuts.kept, signal, onProgress: (p) => task.set(p) });
    check(signal); if (id !== generation) return;
    resultUrl = URL.createObjectURL(blob);
    $('#rs-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done')),
      el('p', { class: 'note', text: `${fmtDuration(job.media.duration - cuts.removedDuration)} · ${fmtBytes(blob.size)} · ${extension.toUpperCase()}` }),
      extension === 'mp4' ? playerFor(resultUrl) : el('audio', { src: resultUrl, controls: true }),
      el('div', { class: 'actions' }, el('button', { class: 'btn lg', onclick: () => download(blob, `${baseName(job.file.name)}-shorter.${extension}`) }, icon('download'), t('download', extension.toUpperCase()))),
      el('p', { class: 'note', text: t('adjust') })));
  } catch (error) { if (id === generation) signal.aborted ? $('#rs-alert').replaceChildren(alertBox(c('canceled'), 'info')) : showError(error); }
  finally { task.close(); if (id === generation) { $('#rs-controls').disabled = false; $('#rs-go').disabled = !cuts.kept.length; $('#rs-another').disabled = false; } }
};
$('#rs-threshold').oninput = () => { $('#rs-auto').checked = false; updateCuts(); };
for (const selector of ['#rs-auto', '#rs-min', '#rs-padding']) $(selector).onchange = updateCuts;
$('#rs-format').onchange = clearResult;
$('#rs-another').onclick = () => pick.open();
