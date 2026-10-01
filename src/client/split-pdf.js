import { $, $$, t, el, icon, filePicker, fileCard, progress, alertBox, errorText, download, downloadZip, fmtBytes, baseName } from './lib.js';
import { openForRender, openForEdit, renderPage, readBytes, pdfBlob, pdflib, parseRanges, closeDoc, SAMPLE_PDF } from './pdf-common.js';

let bytes = null, name = '', count = 0, last = 0, doc = null;
const selected = new Set();
let observer = null;

const pick = filePicker($('#ps-pick'), { accept: '.pdf,application/pdf', iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: ([f]) => load(f) });
const mode = () => $$('input[name="ps-mode"]').find((r) => r.checked).value;

function groups() {
  const m = mode();
  if (m === 'sel') return selected.size ? [[...selected].sort((a, b) => a - b)] : null;
  if (m === 'each') return Array.from({ length: count }, (_, i) => [i + 1]);
  if (m === 'every') {
    const n = Math.max(1, Math.floor(Number($('#ps-every').value) || 1));
    const out = [];
    for (let i = 1; i <= count; i += n) out.push(Array.from({ length: Math.min(n, count - i + 1) }, (_, k) => i + k));
    return out;
  }
  return parseRanges($('#ps-ranges').value, count);
}

function update() {
  const m = mode();
  $('#ps-every-wrap').hidden = m !== 'every';
  $('#ps-ranges-wrap').hidden = m !== 'ranges';
  $('#ps-selbar').hidden = m !== 'sel';
  for (const p of $$('.pg', $('#ps-pages'))) {
    p.classList.toggle('selectable', m === 'sel');
    p.classList.toggle('sel', m === 'sel' && selected.has(Number(p.dataset.n)));
  }
  let info = '';
  try {
    const g = groups();
    info = m === 'sel' ? t('selected', selected.size, count) : g ? t('willMake', g.length) : '';
  } catch { info = ''; }
  $('#ps-info').textContent = info;
}

async function load(file) {
  $('#ps-pick').hidden = true;
  $('#ps-work').hidden = false;
  $('#ps-alert').replaceChildren();
  $('#ps-result').replaceChildren();
  selected.clear();
  observer?.disconnect();
  closeDoc(doc);
  try {
    bytes = await readBytes(file);
    name = baseName(file.name);
    doc = await openForRender(bytes);
    count = doc.numPages;
  } catch (e) {
    $('#ps-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#ps-file').replaceChildren(fileCard({ file, meta: `${t('pagesN', count)} · ${fmtBytes(file.size)}`, thumb: await renderPage(doc, 1, 60), onChange: () => pick.open() }));
  // Thumbnails render lazily as they scroll into view.
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      observer.unobserve(e.target);
      const n = Number(e.target.dataset.n);
      renderPage(doc, n, 150).then((cv) => e.target.querySelector('.pv').replaceChildren(cv)).catch(() => {});
    }
  }, { rootMargin: '400px' });
  $('#ps-pages').replaceChildren(...Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const p = el('div', { class: 'pg', 'data-n': n, tabindex: 0, role: 'checkbox', 'aria-label': t('page', n) }, el('div', { class: 'pv' }, el('span', { class: 'spinner' })), el('div', { class: 'num', text: t('page', n) }));
    observer.observe(p);
    return p;
  }));
  update();
}

function toggle(n, shift) {
  if (mode() !== 'sel') return;
  if (shift && last) {
    const [a, b] = [Math.min(last, n), Math.max(last, n)];
    for (let i = a; i <= b; i++) selected.add(i);
  } else if (selected.has(n)) selected.delete(n); else selected.add(n);
  last = n;
  update();
}

$('#ps-pages').addEventListener('click', (e) => { const p = e.target.closest('.pg'); if (p) toggle(Number(p.dataset.n), e.shiftKey); });
$('#ps-pages').addEventListener('keydown', (e) => { const p = e.target.closest('.pg'); if (p && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggle(Number(p.dataset.n), e.shiftKey); } });
$('#ps-selbar').addEventListener('click', (e) => {
  const k = e.target.closest('[data-sel]')?.dataset.sel;
  if (!k) return;
  selected.clear();
  for (let n = 1; n <= count; n++) if (k === 'all' || (k === 'odd' && n % 2) || (k === 'even' && !(n % 2))) selected.add(n);
  update();
});
$('#ps-work').addEventListener('change', update);
$('#ps-ranges').addEventListener('input', update);
$('#ps-every').addEventListener('input', update);

$('#ps-go').addEventListener('click', async () => {
  let gs;
  try {
    gs = groups();
    if (!gs) throw new Error(t('noneSelected'));
  } catch (e) {
    $('#ps-alert').replaceChildren(alertBox(e.message === t('noneSelected') ? e.message : t('badRange', e.message, count)));
    return;
  }
  $('#ps-alert').replaceChildren();
  $('#ps-go').disabled = true;
  const task = progress($('#ps-task'), { title: t('splitting') });
  try {
    const { PDFDocument } = await pdflib();
    const src = await openForEdit(bytes);
    const outs = [];
    for (let i = 0; i < gs.length; i++) {
      const g = gs[i];
      const out = await PDFDocument.create();
      for (const p of await out.copyPages(src, g.map((n) => n - 1))) out.addPage(p);
      const label = g.length === 1 ? `p${g[0]}` : g.every((n, k) => k === 0 || n === g[k - 1] + 1) ? `p${g[0]}-${g[g.length - 1]}` : 'pages';
      outs.push({ name: `${name}_${label}.pdf`, blob: pdfBlob(await out.save()) });
      task.set((i + 1) / gs.length);
    }
    task.close();
    const save = () => (outs.length === 1 ? download(outs[0].blob, outs[0].name) : downloadZip(outs, `${name}_split.zip`));
    await save();
    $('#ps-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', outs.length)),
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: save }, icon('download'), t('download')), el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
  } catch (e) {
    task.close();
    $('#ps-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#ps-go').disabled = false;
  }
});
