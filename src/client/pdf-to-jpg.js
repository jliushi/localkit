import { $, $$, t, el, icon, filePicker, fileCard, progress, alertBox, errorText, download, downloadZip, fmtBytes, baseName, nextFrame } from './lib.js';
import { openForRender, renderPage, readBytes, closeDoc, SAMPLE_PDF } from './pdf-common.js';

let doc = null, name = '', count = 0, observer = null;
const selected = new Set();

const pick = filePicker($('#pj-pick'), { accept: '.pdf,application/pdf', iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: ([f]) => load(f) });

function update() {
  for (const p of $$('.pg', $('#pj-pages'))) p.classList.toggle('sel', selected.has(Number(p.dataset.n)));
  $('#pj-sel').textContent = t('selected', selected.size, count);
}

async function load(file) {
  $('#pj-pick').hidden = true;
  $('#pj-work').hidden = false;
  $('#pj-alert').replaceChildren();
  $('#pj-result').replaceChildren();
  observer?.disconnect();
  closeDoc(doc);
  try {
    doc = await openForRender(await readBytes(file));
  } catch (e) {
    $('#pj-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  name = baseName(file.name);
  count = doc.numPages;
  selected.clear();
  for (let n = 1; n <= count; n++) selected.add(n);
  $('#pj-file').replaceChildren(fileCard({ file, meta: `${t('pagesN', count)} · ${fmtBytes(file.size)}`, thumb: await renderPage(doc, 1, 60), onChange: () => pick.open() }));
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      observer.unobserve(e.target);
      renderPage(doc, Number(e.target.dataset.n), 150).then((cv) => e.target.querySelector('.pv').replaceChildren(cv)).catch(() => {});
    }
  }, { rootMargin: '400px' });
  $('#pj-pages').replaceChildren(...Array.from({ length: count }, (_, i) => {
    const p = el('div', { class: 'pg selectable', 'data-n': i + 1, tabindex: 0, role: 'checkbox' }, el('div', { class: 'pv' }, el('span', { class: 'spinner' })), el('div', { class: 'num', text: t('page', i + 1) }));
    observer.observe(p);
    return p;
  }));
  update();
}

$('#pj-pages').addEventListener('click', (e) => {
  const p = e.target.closest('.pg');
  if (!p) return;
  const n = Number(p.dataset.n);
  if (selected.has(n)) selected.delete(n); else selected.add(n);
  update();
});
$('#pj-all').addEventListener('click', () => { for (let n = 1; n <= count; n++) selected.add(n); update(); });
$('#pj-none').addEventListener('click', () => { selected.clear(); update(); });

$('#pj-go').addEventListener('click', async () => {
  const list = [...selected].sort((a, b) => a - b);
  if (!list.length) { $('#pj-alert').replaceChildren(alertBox(t('noneSel'))); return; }
  const type = $$('input[name="pj-fmt"]').find((r) => r.checked).value;
  const ext = type === 'image/png' ? 'png' : 'jpg';
  const scale = Number($$('input[name="pj-dpi"]').find((r) => r.checked).value) / 72;
  $('#pj-alert').replaceChildren();
  $('#pj-go').disabled = true;
  const task = progress($('#pj-task'), { title: t('converting', 1, list.length) });
  const outs = [];
  try {
    for (let i = 0; i < list.length; i++) {
      task.title(t('converting', i + 1, list.length));
      const page = await doc.getPage(list[i]);
      const vp = page.getViewport({ scale });
      const cv = el('canvas', { width: Math.round(vp.width), height: Math.round(vp.height) });
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: cv }).promise;
      page.cleanup();
      const blob = await new Promise((r) => cv.toBlob(r, type, 0.92));
      outs.push({ name: `${name}-page${list[i]}.${ext}`, blob, w: cv.width, h: cv.height });
      task.set((i + 1) / list.length);
      await nextFrame();
    }
    task.close();
    const save = () => (outs.length === 1 ? download(outs[0].blob, outs[0].name) : downloadZip(outs, `${name}-images.zip`));
    await save();
    $('#pj-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), `${t('done', outs.length)} · ${outs[0].w} × ${outs[0].h} px`),
      el('div', { class: 'out-grid' }, outs.slice(0, 12).map((o) => el('div', { class: 'out' },
        el('div', { class: 'pic' }, el('img', { src: URL.createObjectURL(o.blob), alt: '' })),
        el('div', { class: 'name', text: o.name }), el('div', { class: 'sizes', text: fmtBytes(o.blob.size) }),
        el('button', { class: 'btn ghost sm', onclick: () => download(o.blob, o.name) }, icon('download'))))),
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: save }, icon('download'), t('download')), el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
  } catch (e) {
    task.close();
    $('#pj-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#pj-go').disabled = false;
  }
});
