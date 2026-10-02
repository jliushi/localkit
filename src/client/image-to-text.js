import { $, t, c, el, LK, icon, filePicker, progress, alertBox, errorText, download, copyText, baseName } from './lib.js';
import { IMAGE_ACCEPT, decodeImage, drawRotated, toBlob } from './image-core.js';

const items = [];
let worker, running = false, generation = 0, task, rejectCanceled;
const sample = { url: `${LK.base}/assets/samples/ocr.png`, name: 'ocr.png', type: 'image/png' };
filePicker($('#ocr-pick'), { accept: IMAGE_ACCEPT, multiple: true, title: t('drop'), hint: t('dropHint'), sample, onFiles: add });
filePicker($('#ocr-more'), { accept: IMAGE_ACCEPT, multiple: true, compact: true, title: t('add'), onFiles: add });

function sync() {
  $('#ocr-pick').hidden = items.length > 0;
  $('#ocr-work').hidden = items.length === 0;
  $('#ocr-go').disabled = running || !items.some(x => !x.done);
  $('#ocr-lang').disabled = running;
  $('#ocr-combined').hidden = items.filter(x => x.done).length < 2;
  $('#ocr-all').value = items.filter(x => x.done).map(x => `${x.file.name}\n${x.text}`).join('\n\n');
}

async function stop() {
  generation++;
  rejectCanceled?.(new Error('canceled'));
  rejectCanceled = null;
  const old = worker;
  worker = null;
  await old?.terminate();
}

function render(it) {
  const canvas = el('canvas', { width: it.canvas.width, height: it.canvas.height, class: 'ocr-preview' });
  const ctx = canvas.getContext('2d');
  ctx.drawImage(it.canvas, 0, 0);
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = Math.max(2, canvas.width / 500);
  for (const b of it.boxes || []) ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
  canvas.dataset.boxes = String(it.boxes?.length || 0);
  const area = el('textarea', { class: 'ocr-text', 'aria-label': t('textLabel', it.file.name), placeholder: t('pending'), spellcheck: 'false', disabled: !it.done });
  area.value = it.text || '';
  area.addEventListener('input', () => { it.text = area.value; sync(); });
  const actions = el('div', { class: 'actions' });
  if (it.done) actions.append(
    el('button', { class: 'btn sm', onclick: () => download(new Blob([it.text], { type: 'text/plain;charset=utf-8' }), `${baseName(it.file.name)}.txt`) }, icon('download'), t('txt')),
    el('button', { class: 'btn ghost sm', onclick: e => copyText(it.text, e.currentTarget) }, icon('copy'), t('copy')),
  );
  actions.append(el('button', { class: 'btn ghost sm ocr-remove', disabled: running, onclick: () => { items.splice(items.indexOf(it), 1); it.node.remove(); sync(); } }, icon('x'), c('remove')));
  it.node.replaceChildren(el('h3', { class: 'name', text: it.file.name }),
    el('div', { class: 'ocr-columns' }, el('div', { class: 'ocr-image' }, canvas), area),
    it.error ? alertBox(it.error) : el('small', { class: 'hint', text: it.done ? (it.text.trim() ? t('recognized', it.boxes.length) : t('empty')) : t('pending') }), actions);
}

async function add(files) {
  $('#ocr-alert').replaceChildren();
  for (const file of files) {
    try {
      const image = await decodeImage(file);
      const canvas = drawRotated(image, 0, 4096);
      image.close?.();
      const it = { file, canvas, text: '', done: false, boxes: [], node: el('section', { class: 'ocr-item' }) };
      items.push(it);
      $('#ocr-list').append(it.node);
      render(it);
    } catch (e) { $('#ocr-alert').append(alertBox(`${file.name}: ${errorText(e)}`)); }
  }
  sync();
}

async function run() {
  if (running) return;
  running = true;
  const id = generation;
  $('#ocr-alert').replaceChildren();
  task = progress($('#ocr-task'), { title: t('loading'), onCancel: () => stop() });
  sync();
  for (const it of items) render(it);
  const canceled = new Promise((_, reject) => { rejectCanceled = reject; });
  canceled.catch(() => {}); // A cancel can arrive while PNG encoding is still pending.
  try {
    const lang = $('#ocr-lang').value;
    worker ||= new Worker(`${LK.base}/assets/js/ocr.worker.js`, { type: 'module' });
    for (const it of items.filter(x => !x.done)) {
      if (id !== generation) break;
      task.text(it.file.name);
      try {
        const image = await toBlob(it.canvas, 'image/png');
        if (id !== generation) break;
        const result = new Promise((resolve, reject) => {
          worker.onmessage = ({ data }) => {
            if (data.type === 'result') resolve(data);
            else if (data.type === 'error') reject(new Error(data.message));
            else if (data.type === 'progress') {
              task.title(data.status === 'recognizing text' ? t('recognizing') : t('loading'));
              task.set(data.progress || null);
            }
          };
          worker.onerror = e => reject(new Error(e.message));
          worker.postMessage({ language: lang, image, base: `${location.origin}${LK.base}` });
        });
        const data = await Promise.race([result, canceled]);
        if (id !== generation) break;
        it.text = data.text.trim();
        it.boxes = data.boxes;
        it.done = true;
        it.error = null;
        render(it);
        sync();
      } catch (e) {
        if (id !== generation) throw e;
        it.error = errorText(e);
        render(it);
        throw e;
      }
    }
  } catch (e) {
    $('#ocr-alert').replaceChildren(alertBox(id !== generation ? c('canceled') : errorText(e), id !== generation ? 'info' : 'error'));
    if (id === generation) await stop();
  } finally {
    task?.close();
    running = false;
    rejectCanceled = null;
    for (const it of items) render(it);
    sync();
  }
}

$('#ocr-go').addEventListener('click', run);
$('#ocr-lang').addEventListener('change', () => {
  for (const it of items) { it.done = false; it.boxes = []; render(it); }
  sync();
});
$('#ocr-clear').addEventListener('click', async () => {
  await stop();
  items.length = 0;
  $('#ocr-list').replaceChildren();
  sync();
});
$('#ocr-copy-all').addEventListener('click', e => copyText($('#ocr-all').value, e.currentTarget));
$('#ocr-download-all').addEventListener('click', () => download(new Blob([$('#ocr-all').value], { type: 'text/plain;charset=utf-8' }), 'extracted-text.txt'));
window.addEventListener('pagehide', () => worker?.terminate());
