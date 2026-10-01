import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtTime, baseName } from './lib.js';
import { parseSubs, toSrt, toVtt } from './subs.js';
import { translate, guessLanguage, canTarget } from './translate.js';

let subs = [], name = 'subtitles', translated = null, job = null;

const SAMPLE = `1
00:00:01,000 --> 00:00:03,500
Hello and welcome to LocalKit.

2
00:00:04,000 --> 00:00:07,500
This short video is used to test automatic subtitles.

3
00:00:08,000 --> 00:00:12,000
Everything runs in your browser, so your files stay private.
`;
const sampleBlob = URL.createObjectURL(new Blob([SAMPLE], { type: 'application/x-subrip' }));
const pick = filePicker($('#ts-pick'), {
  accept: '.srt,.vtt,text/vtt,application/x-subrip,text/plain', iconName: 'fileText', title: t('drop'), hint: t('dropHint'),
  sample: { url: sampleBlob, name: 'sample.srt', type: 'application/x-subrip' }, onFiles: async ([f]) => load(await f.text(), f),
});

const langName = (code) => $(`#ts-from option[value="${code}"]`)?.textContent || code;

function load(text, file) {
  const list = parseSubs(text);
  $('#ts-alert').replaceChildren();
  $('#ts-result').replaceChildren();
  if (!list.length) { $('#ts-work').hidden = false; $('#ts-alert').replaceChildren(alertBox(t('badFile'))); return; }
  subs = list;
  translated = null;
  name = file ? baseName(file.name) : 'subtitles';
  const src = guessLanguage(list.map((s) => s.text));
  $('#ts-from').value = src;
  if ($('#ts-to').value === src) $('#ts-to').value = src === 'en' ? (LK.lang === 'zh' ? 'zh' : 'es') : 'en';
  $('#ts-pick').hidden = true;
  $('#ts-paste-box').hidden = true;
  $('#ts-work').hidden = false;
  const fake = file || new File([text], 'pasted.srt');
  $('#ts-file').replaceChildren(fileCard({ file: fake, meta: `${t('count', list.length, langName(src))} · ${fmtBytes(fake.size)}`, onChange: () => pick.open() }));
  update();
}

function update() {
  const a = $('#ts-from').value, b = $('#ts-to').value;
  const msg = a === b ? t('same') : !canTarget(a, b) ? t('noRoute') : '';
  $('#ts-go').disabled = !!msg;
  $('#ts-alert').replaceChildren(msg ? alertBox(msg, 'info') : '');
}
$('#ts-from').addEventListener('change', update);
$('#ts-to').addEventListener('change', update);
$('#ts-paste-go').addEventListener('click', () => load($('#ts-paste').value, null));

function output() {
  const bi = $$('input[name="ts-mode"]').find((r) => r.checked).value === 'bi';
  return subs.map((s, i) => ({ ...s, text: bi ? `${s.text}\n${translated[i]}` : translated[i] }));
}

function renderResult() {
  const rows = subs.map((s, i) => {
    const ta = el('textarea', { rows: 1, spellcheck: 'true' }, translated[i]);
    ta.addEventListener('input', () => { translated[i] = ta.value; });
    return el('div', { class: 'sub-row' },
      el('div', { class: 'sub-times small muted', text: `${fmtTime(s.start, 1)}` }),
      el('div', { class: 'panel', style: { gap: '4px' } }, el('div', { class: 'small muted', text: s.text }), ta),
      el('span'));
  });
  $('#ts-result').replaceChildren(el('div', { class: 'result' },
    el('div', { class: 'result-head' }, icon('circleCheck'), t('done', subs.length)),
    el('div', { class: 'actions' },
      el('button', { class: 'btn lg', onclick: () => download(new Blob([toSrt(output())], { type: 'application/x-subrip' }), `${name}.${$('#ts-to').value}.srt`) }, icon('download'), t('dlSrt')),
      el('button', { class: 'btn soft', onclick: () => download(new Blob([toVtt(output())], { type: 'text/vtt' }), `${name}.${$('#ts-to').value}.vtt`) }, t('dlVtt')),
      el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another'))),
    el('div', { class: 'sub-list' }, rows)));
}

$('#ts-go').addEventListener('click', async () => {
  const a = $('#ts-from').value, b = $('#ts-to').value;
  $('#ts-go').disabled = true;
  $('#ts-result').replaceChildren();
  const task = progress($('#ts-task'), { title: t('translating'), onCancel: () => job?.cancel() });
  try {
    job = translate(subs.map((s) => s.text.replace(/\n/g, ' ')), a, b, (ev) => {
      if (ev.type === 'download') { task.title(t('loadingModel', fmtBytes(ev.loaded), fmtBytes(ev.total))); task.set(ev.loaded / ev.total); }
      else if (ev.type === 'ready') { task.title(t('translating')); }
      else if (ev.type === 'progress') task.set(ev.value);
    });
    translated = await job.promise;
    task.close();
    renderResult();
  } catch (e) {
    task.close();
    $('#ts-alert').replaceChildren(e?.name === 'AbortError' ? alertBox(c('canceled'), 'info') : alertBox(errorText(e)));
  } finally {
    $('#ts-go').disabled = false;
  }
});
