// Merge PDF v2: a page-level composer. `pages` is the document being built; `sources` are the added files.
import { $, $$, t, c, el, icon, filePicker, progress, alertBox, errorText, download, fmtBytes, baseName, extOf, sleep } from './lib.js';
import { openForRender, openForEdit, renderPage, readBytes, pdfBlob, pdflib, closeDoc, parseRanges, PdfError, SAMPLE_PDF, tbtn } from './pdf-common.js';
import { IMAGE_ACCEPT, decodeImage, drawRotated, toBlob, imageSize } from './image-core.js';

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
const ACCEPT = `.pdf,application/pdf,${IMAGE_ACCEPT}`;

const sources = []; // { id, file, name, kind: 'pdf'|'image', bytes, edit, view, img, count, thumb, error, use: [n…], rangeText }
let pages = []; // { src|null (blank), n, rot, sel, canvas }
let history = [];
let view = 'files';
let lastClicked = -1;
let uid = 0;
let loading = 0;
let chain = Promise.resolve();
let running = false;

const list = $('#pm-list');
const grid = $('#pm-pages');

const pick = filePicker($('#pm-pick'), { accept: ACCEPT, multiple: true, iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: (f) => add(f) });
filePicker($('#pm-more'), { accept: ACCEPT, multiple: true, compact: true, iconName: 'plus', title: t('add'), onFiles: (f) => add(f) });
filePicker($('#pm-insfile'), { accept: ACCEPT, multiple: true, compact: true, iconName: 'filePlus', title: t('insFile'), onFiles: (f) => add(f, insertAt()) });

// ---------------------------------------------------------------- helpers

const isPdf = (f) => extOf(f.name) === 'pdf' || f.type === 'application/pdf';
const valid = () => sources.filter((s) => !s.error && s.count);
const hue = (src) => (src ? (sources.indexOf(src) * 67 + 8) % 360 : null);

function snap() {
  history.push(pages.map((p) => ({ ...p })));
  if (history.length > 40) history.shift();
}

/** "1-3, 5" plus the words all / odd / even / reverse (and 全部 / 奇数 / 偶数 / 倒序). Returns page numbers in order. */
function parseUse(text, count) {
  const words = new Set();
  const rest = [];
  for (const part of text.split(/[,，;；\s]+/).filter(Boolean)) {
    const w = part.toLowerCase();
    if (/^(all|全部)$/.test(w)) words.add('all');
    else if (/^(odd|奇数|奇)$/.test(w)) words.add('odd');
    else if (/^(even|偶数|偶)$/.test(w)) words.add('even');
    else if (/^(rev|reverse|倒序|反向)$/.test(w)) words.add('rev');
    else rest.push(part);
  }
  let nums = rest.length ? parseRanges(rest.join(','), count).flat() : Array.from({ length: count }, (_, i) => i + 1);
  if (words.has('odd') && !words.has('even')) nums = nums.filter((n) => n % 2 === 1);
  if (words.has('even') && !words.has('odd')) nums = nums.filter((n) => n % 2 === 0);
  if (words.has('rev')) nums.reverse();
  return nums;
}

const makePage = (src, n) => ({ src, n, rot: 0, sel: false, canvas: src.kind === 'image' ? drawRotated(src.img, 0, 300) : null });

/** Moves `moved` objects of `arr` before/after `target` (or to the end). Returns the new array. */
function reorder(arr, moved, target, after) {
  const rest = arr.filter((x) => !moved.includes(x));
  let at = target ? rest.indexOf(target) + (after ? 1 : 0) : rest.length;
  if (at < 0) at = rest.length;
  rest.splice(at, 0, ...arr.filter((x) => moved.includes(x)));
  return rest;
}

/** Stable-sorts pages so each file's pages follow the file order; blank pages stay after the page before them. */
function regroup() {
  let key = -1;
  const keyed = pages.map((p) => { if (p.src) key = sources.indexOf(p.src); return [key, p]; });
  keyed.sort((a, b) => a[0] - b[0]);
  pages = keyed.map((k) => k[1]);
}

function insertAt() {
  let last = -1;
  pages.forEach((p, i) => { if (p.sel) last = i; });
  return last < 0 ? pages.length : last + 1;
}

// ---------------------------------------------------------------- loading files

function add(files, at = null) {
  $('#pm-result').replaceChildren();
  for (const file of files) {
    const src = { id: ++uid, file, name: file.name, kind: isPdf(file) ? 'pdf' : 'image', bytes: null, edit: null, view: null, img: null, count: null, thumb: null, error: null, use: [], rangeText: '' };
    sources.push(src);
    loading++;
    chain = chain.then(async () => {
      try {
        if (src.kind === 'pdf') {
          src.bytes = await readBytes(file);
          src.edit = await openForEdit(src.bytes);
          src.count = src.edit.getPageCount();
          if (!src.count) throw new PdfError(c('error', '0 pages'));
          src.view = await openForRender(src.bytes);
          src.thumb = await renderPage(src.view, 1, 52);
        } else {
          src.img = await decodeImage(file);
          src.count = 1;
          src.thumb = drawRotated(src.img, 0, 104);
        }
        src.use = Array.from({ length: src.count }, (_, i) => i + 1);
        const fresh = src.use.map((n) => makePage(src, n));
        if (at == null || at > pages.length) pages.push(...fresh);
        else { snap(); pages.splice(at, 0, ...fresh); at += fresh.length; }
      } catch (e) {
        src.error = e instanceof PdfError ? e.message : src.kind === 'image' ? c('error', e?.message || String(e)) : errorText(e);
        src.count = 0;
      }
      loading--;
      render();
    });
  }
  render();
}

// ---------------------------------------------------------------- rendering

const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    io.unobserve(e.target);
    thumbFor(e.target);
  }
}, { rootMargin: '400px' }) : null;

let thumbQueue = Promise.resolve();
function thumbFor(node) {
  const p = node._p;
  if (!p || p.canvas || p.loading || !p.src?.view) return;
  p.loading = true;
  thumbQueue = thumbQueue.then(async () => {
    try {
      p.canvas = await renderPage(p.src.view, p.n, 150);
    } catch { /* source was closed meanwhile */ }
    p.loading = false;
    if (p.canvas && node.isConnected) {
      const pv = node.querySelector('.pv');
      pv.replaceChildren(p.canvas);
      styleRot(p);
    }
  });
}

function styleRot(p) {
  if (p.canvas) p.canvas.style.transform = p.rot ? `rotate(${p.rot}deg) scale(${p.rot % 180 ? 0.72 : 1})` : '';
}

function card(p, i) {
  styleRot(p);
  const name = p.src ? p.src.name : t('blank');
  const node = el('div', { class: `pg selectable${p.sel ? ' sel' : ''}${p.src ? '' : ' blank'}`, draggable: 'true', 'data-i': i },
    el('div', { class: 'pv' }, p.canvas || (p.src ? el('span', { class: 'spinner' }) : el('span', { class: 'pm-blank', text: t('blank') }))),
    el('div', { class: 'num' }, el('b', { text: String(i + 1) }), p.src && p.src.kind === 'pdf' ? ` · p.${p.n}` : ''),
    el('div', { class: 'pm-src', text: name, title: name }),
    el('div', { class: 'pg-tools' },
      tbtn('arrowLeft', t('left'), (e) => { e.stopPropagation(); snap(); pages = reorder(pages, [p], pages[i - 1], false); render(); }, i === 0),
      tbtn('rotateCw', t('rotR'), (e) => { e.stopPropagation(); snap(); p.rot = (p.rot + 90) % 360; render(); }),
      tbtn('squareDashed', t('blankAfter'), (e) => { e.stopPropagation(); snap(); pages.splice(i + 1, 0, { src: null, n: 0, rot: 0, sel: false, canvas: null }); render(); }),
      tbtn('trash', t('del'), (e) => { e.stopPropagation(); snap(); pages.splice(i, 1); render(); }),
      tbtn('arrowRight', t('right'), (e) => { e.stopPropagation(); snap(); pages = reorder(pages, [p], pages[i + 1], true); render(); }, i === pages.length - 1)));
  node.style.setProperty('--c', p.src ? `hsl(${hue(p.src)} 62% 52%)` : 'var(--border-strong)');
  node._p = p;
  if (!p.canvas && p.src) io ? io.observe(node) : thumbFor(node);
  return node;
}

function fileItem(s, i) {
  const used = new Set(pages.filter((p) => p.src === s).map((p) => p.n)).size;
  const meta = s.error ? s.error : s.count == null ? t('reading')
    : `${s.kind === 'image' ? t('imgMeta') : s.count === 1 ? t('page1') : t('pages', s.count)} · ${fmtBytes(s.file.size)}`;
  const rangeBox = s.kind === 'pdf' && s.count
    ? el('label', { class: 'pm-range' }, el('span', { class: 'sr-only', text: t('rangeLabel') }),
      el('input', { type: 'text', value: s.rangeText, placeholder: t('rangePh'), autocomplete: 'off', spellcheck: 'false', 'aria-label': `${t('rangeLabel')} — ${s.name}`,
        onkeydown: (e) => { if (e.key === 'Enter') e.target.blur(); },
        onchange: (e) => applyRange(s, e.target) }),
      el('small', { class: 'muted', text: used === s.count ? '' : t('usedOf', used, s.count) }))
    : null;
  const li = el('li', { class: s.error ? 'err' : '', 'data-id': s.id },
    el('span', { class: 'handle', 'aria-hidden': 'true', onpointerdown: (e) => { e.currentTarget.parentElement.draggable = true; } }, icon('grip')),
    s.thumb || (s.error ? icon('circleAlert') : el('span', { class: 'spinner' })),
    el('span', { class: 'pm-fmain' }, el('span', { class: 'name', text: s.name, title: s.name }), el('span', { class: 'meta', text: meta })),
    rangeBox,
    el('span', { class: 'pg-tools' },
      tbtn('arrowUp', t('up'), () => { moveFile(s, -1); }, i === 0),
      tbtn('arrowDown', t('down'), () => { moveFile(s, 1); }, i === sources.length - 1),
      tbtn('x', c('remove'), () => removeFile(s))));
  li._o = s;
  return li;
}

function renderModeSelects() {
  const ok = valid();
  const sig = ok.map((s) => `${s.id}:${s.name}`).join('|');
  if (renderModeSelects.sig === sig) return;
  renderModeSelects.sig = sig;
  for (const [id, def] of [['#pm-ia', 0], ['#pm-ib', 1]]) {
    const sel = $(id);
    const prev = Number(sel.value);
    sel.replaceChildren(...ok.map((s, i) => el('option', { value: String(s.id), text: `${i + 1}. ${s.name}` })));
    const keep = ok.find((s) => s.id === prev);
    sel.value = String((keep || ok[def] || ok[0] || { id: '' }).id);
  }
  if (ok.length > 1 && $('#pm-ia').value === $('#pm-ib').value) $('#pm-ib').value = String(ok.find((s) => String(s.id) !== $('#pm-ia').value).id);
}

function runsSummary() {
  const runs = [];
  for (const p of pages) {
    const last = runs[runs.length - 1];
    if (last && last.src === p.src && p.src && last.to + 1 === p.n) last.to = p.n;
    else runs.push({ src: p.src, from: p.n, to: p.n });
  }
  const label = (r) => (!r.src ? t('blank') : r.src.kind === 'image' ? r.src.name : `${r.src.name} ${r.from === r.to ? r.from : `${r.from}–${r.to}`}`);
  const shown = runs.slice(0, 14).map(label).join('  →  ');
  return runs.length ? `${t('order')}: ${shown}${runs.length > 14 ? `  → … (+${runs.length - 14})` : ''}` : '';
}

function render() {
  const has = sources.length > 0;
  $('#pm-pick').hidden = has;
  $('#pm-work').hidden = !has;
  list.replaceChildren(...sources.map(fileItem));
  renderModeSelects();
  if (view === 'pages') {
    grid.replaceChildren(...(pages.length ? pages.map(card) : [el('p', { class: 'note', text: t('empty') })]));
    const sel = pages.filter((p) => p.sel).length;
    $('#pm-rotsel').disabled = $('#pm-delsel').disabled = !sel;
    $('#pm-undo').disabled = !history.length;
    const at = insertAt();
    $('#pm-insat').textContent = at >= pages.length ? t('insEnd') : t('insAfter', at);
  }
  $('#pm-total').textContent = pages.length ? t('summary', pages.length) : '';
  $('#pm-order').textContent = runsSummary();
  $('#pm-go').disabled = !pages.length || loading > 0 || running;
}

function setView(v) {
  view = v;
  $('#pm-v-files').hidden = v !== 'files';
  $('#pm-v-pages').hidden = v !== 'pages';
  $('#pm-tab-files').setAttribute('aria-selected', String(v === 'files'));
  $('#pm-tab-pages').setAttribute('aria-selected', String(v === 'pages'));
  render();
}
$('#pm-tab-files').addEventListener('click', () => setView('files'));
$('#pm-tab-pages').addEventListener('click', () => setView('pages'));

// ---------------------------------------------------------------- file-level actions

function note(msg, kind = 'error') {
  $('#pm-alert').replaceChildren(msg ? alertBox(msg, kind) : '');
}

function applyRange(s, input) {
  note('');
  let use;
  try {
    use = parseUse(input.value.trim(), s.count);
  } catch (e) {
    input.classList.add('bad');
    note(t('rangeBad', e.message));
    return;
  }
  input.classList.remove('bad');
  s.rangeText = input.value.trim();
  const old = pages.filter((p) => p.src === s);
  const at = old.length ? pages.indexOf(old[0]) : pages.length;
  snap();
  const fresh = use.map((n) => makePage(s, n));
  for (const f of fresh) { const o = old.find((p) => p.n === f.n && !p.reused); if (o) { o.reused = true; f.rot = o.rot; f.canvas = o.canvas; } }
  for (const o of old) delete o.reused;
  pages = pages.filter((p) => p.src !== s);
  pages.splice(Math.min(at, pages.length), 0, ...fresh);
  s.use = use;
  render();
}

function moveFile(s, d) {
  const i = sources.indexOf(s);
  const j = i + d;
  if (j < 0 || j >= sources.length) return;
  [sources[i], sources[j]] = [sources[j], sources[i]];
  snap();
  regroup();
  render();
}

function removeFile(s) {
  sources.splice(sources.indexOf(s), 1);
  pages = pages.filter((p) => p.src !== s);
  history = [];
  closeDoc(s.view);
  note('');
  if (!sources.length) $('#pm-result').replaceChildren();
  render();
}

// Generic drag & drop: `items()` = current objects, `nodeOf(el)` finds the draggable ancestor, `drop(moved, target, after)`.
function dnd(root, sel, objects, onDrop, group) {
  let moved = null;
  const clear = () => $$('.drop-before,.drop-after,.dragging', root).forEach((n) => n.classList.remove('drop-before', 'drop-after', 'dragging'));
  root.addEventListener('dragstart', (e) => {
    const node = e.target.closest?.(sel);
    if (!node || node.parentElement !== root) return;
    const o = node._o || node._p;
    moved = group ? group(o) : [o];
    for (const n of root.children) if (moved.includes(n._o || n._p)) n.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', 'lk-merge');
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  });
  root.addEventListener('dragover', (e) => {
    if (!moved) return;
    e.preventDefault();
    $$('.drop-before,.drop-after', root).forEach((n) => n.classList.remove('drop-before', 'drop-after'));
    const node = e.target.closest?.(sel);
    if (node && node.parentElement === root) {
      const r = node.getBoundingClientRect();
      const after = root.classList.contains('pm-flist') ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
      node.classList.add(after ? 'drop-after' : 'drop-before');
    }
  });
  root.addEventListener('drop', (e) => {
    if (!moved) return;
    e.preventDefault();
    const node = e.target.closest?.(sel);
    let target = null, after = false;
    if (node && node.parentElement === root) {
      target = node._o || node._p;
      const r = node.getBoundingClientRect();
      after = root.classList.contains('pm-flist') ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
      if (moved.includes(target)) { moved = null; clear(); return; }
    }
    const m = moved;
    moved = null;
    clear();
    onDrop(m, target, after);
  });
  root.addEventListener('dragend', () => { moved = null; clear(); for (const n of root.children) if (n.draggable && n.tagName === 'LI') n.draggable = false; });
  void objects;
}

dnd(list, 'li', () => sources, (moved, target, after) => {
  sources.splice(0, sources.length, ...reorder(sources, moved, target, after));
  snap();
  regroup();
  render();
});
dnd(grid, '.pg', () => pages, (moved, target, after) => {
  snap();
  pages = reorder(pages, moved, target, after);
  render();
}, (p) => (p.sel ? pages.filter((x) => x.sel) : [p]));

// ---------------------------------------------------------------- arrange modes

const mode = () => $$('input[name="pm-mode"]').find((r) => r.checked).value;
function syncMode() {
  const m = mode();
  $('#pm-mo-alt').hidden = m !== 'alt';
  $('#pm-mo-inter').hidden = m !== 'inter';
  $('#pm-mode-hint').textContent = { append: t('mAppendHint'), alt: t('altHint'), inter: t('interHint') }[m];
}
$$('input[name="pm-mode"]').forEach((r) => r.addEventListener('change', syncMode));

$('#pm-arrange').addEventListener('click', () => {
  note('');
  const ok = valid();
  if (!ok.length) return;
  const pool = pages.slice();
  const take = (s, n) => { const i = pool.findIndex((p) => p.src === s && p.n === n); return i >= 0 ? pool.splice(i, 1)[0] : makePage(s, n); };
  const lists = new Map(ok.map((s) => [s, s.use.map((n) => take(s, n))]));
  let out = [];
  const m = mode();
  if (m === 'append') out = ok.flatMap((s) => lists.get(s));
  else if (m === 'alt') {
    const k = Math.max(1, Math.min(99, Number($('#pm-every').value) || 1));
    const qs = ok.map((s) => lists.get(s).slice());
    while (qs.some((q) => q.length)) for (const q of qs) out.push(...q.splice(0, k));
  } else {
    const a = ok.find((s) => s.id === Number($('#pm-ia').value));
    const b = ok.find((s) => s.id === Number($('#pm-ib').value));
    if (!a || !b || a === b) { note(t('needInter')); return; }
    const A = lists.get(a).slice();
    const B = lists.get(b).slice();
    if ($('#pm-irev').checked) B.reverse();
    while (A.length || B.length) { if (A.length) out.push(A.shift()); if (B.length) out.push(B.shift()); }
    for (const s of ok) if (s !== a && s !== b) out.push(...lists.get(s));
  }
  snap();
  pages = out;
  lastClicked = -1;
  render();
  note(t('arranged'), 'info');
});

// ---------------------------------------------------------------- page-level actions

grid.addEventListener('click', (e) => {
  const node = e.target.closest('.pg');
  if (!node || e.target.closest('button')) return;
  const i = Number(node.dataset.i);
  if (e.shiftKey && lastClicked >= 0) {
    for (let k = Math.min(lastClicked, i); k <= Math.max(lastClicked, i); k++) pages[k].sel = true;
  } else pages[i].sel = !pages[i].sel;
  lastClicked = i;
  render();
});
$('#pm-selall').addEventListener('click', () => { pages.forEach((p) => { p.sel = true; }); render(); });
$('#pm-selnone').addEventListener('click', () => { pages.forEach((p) => { p.sel = false; }); render(); });
$('#pm-rotsel').addEventListener('click', () => { snap(); pages.forEach((p) => { if (p.sel) p.rot = (p.rot + 90) % 360; }); render(); });
$('#pm-delsel').addEventListener('click', () => { snap(); pages = pages.filter((p) => !p.sel); render(); });
$('#pm-undo').addEventListener('click', () => { if (history.length) { pages = history.pop(); render(); } });
$('#pm-blank').addEventListener('click', () => {
  snap();
  const at = insertAt();
  pages.splice(at, 0, { src: null, n: 0, rot: 0, sel: false, canvas: null });
  if (at > 0 && pages[at - 1].sel) { pages[at - 1].sel = false; }
  render();
});
$$('input[name="pm-size"]').forEach((r) => r.addEventListener('change', () => { const m = $$('input[name="pm-img"]').find((x) => x.value === r.value); if (m) m.checked = true; }));
$('#pm-num').addEventListener('change', (e) => { $('#pm-numopts').hidden = !e.target.checked; });

// ---------------------------------------------------------------- building the PDF

const radio = (name) => $$(`input[name="${name}"]`).find((r) => r.checked).value;

class Cancelled extends Error {}

async function embedImage(out, s, rot, cache) {
  const key = `${s.id}:${rot}`;
  if (cache.has(key)) return cache.get(key);
  let image = null;
  const ext = extOf(s.file.name);
  if (!rot) {
    const isJpg = ext === 'jpg' || ext === 'jpeg' || s.file.type === 'image/jpeg';
    const isPng = ext === 'png' || s.file.type === 'image/png';
    if (isJpg || isPng) {
      try {
        const bytes = new Uint8Array(await s.file.arrayBuffer());
        image = isJpg ? await out.embedJpg(bytes) : await out.embedPng(bytes);
        const [w0, h0] = imageSize(s.img);
        if (image.width !== w0 || image.height !== h0) image = null; // EXIF-rotated photo: PDF ignores EXIF, re-encode
      } catch { image = null; }
    }
  }
  if (!image) {
    const cv = drawRotated(s.img, rot, 4000, '#fff');
    image = await out.embedJpg(new Uint8Array(await (await toBlob(cv, 'image/jpeg', 0.92)).arrayBuffer()));
  }
  cache.set(key, image);
  return image;
}

async function build(cfg, task) {
  const { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFHexString } = await pdflib();
  const out = await PDFDocument.create();
  const total = pages.length;
  const tick = async (i) => {
    if (cfg.cancel) throw new Cancelled();
    if (i % 6 === 0) { task.set(i / total); await sleep(0); }
  };

  // Copy / embed all used pages of each PDF in a single call per source so shared fonts and images stay shared.
  const prepared = new Map(); // page object -> PDFPage | PDFEmbeddedPage
  const bySrc = new Map();
  for (const p of pages) if (p.src?.kind === 'pdf') (bySrc.get(p.src) || bySrc.set(p.src, []).get(p.src)).push(p);
  let si = 0;
  for (const [src, ps] of bySrc) {
    task.text(src.name);
    const batches = [];
    const seen = new Map();
    for (const p of ps) { const k = seen.get(p.n) || 0; seen.set(p.n, k + 1); (batches[k] ||= []).push(p); }
    for (const batch of batches) {
      if (cfg.cancel) throw new Cancelled();
      if (cfg.size === 'keep') {
        const copies = await out.copyPages(src.edit, batch.map((p) => p.n - 1));
        batch.forEach((p, i) => prepared.set(p, copies[i]));
      } else {
        const srcPages = batch.map((p) => src.edit.getPage(p.n - 1));
        const boxes = srcPages.map((sp) => { const b = sp.getCropBox(); return { left: b.x, bottom: b.y, right: b.x + b.width, top: b.y + b.height }; });
        const emb = await out.embedPages(srcPages, boxes);
        batch.forEach((p, i) => prepared.set(p, emb[i]));
      }
    }
    task.set((++si / bySrc.size) * 0.3);
    await sleep(0);
  }

  const imgCache = new Map();
  const info = []; // per output page: { page, W, H, R, ox, oy, w, h, src }
  let lastSize = null;
  for (let i = 0; i < total; i++) {
    await tick(i);
    const p = pages[i];
    let rec;
    if (!p.src) {
      const [W, H] = cfg.size !== 'keep' ? SIZES[cfg.size] : lastSize || SIZES.a4;
      rec = { page: out.addPage([W, H]), W, H, R: 0, ox: 0, oy: 0, w: W, h: H };
    } else if (p.src.kind === 'image') {
      const image = await embedImage(out, p.src, p.rot, imgCache);
      let W, H, m = 0;
      if (cfg.img === 'fit') { W = image.width * 0.75; H = image.height * 0.75; } else {
        [W, H] = SIZES[cfg.img];
        m = 18;
        if (image.width > image.height) [W, H] = [H, W];
      }
      const page = out.addPage([W, H]);
      const k = Math.min((W - 2 * m) / image.width, (H - 2 * m) / image.height);
      const w = image.width * k, h = image.height * k;
      page.drawImage(image, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
      rec = { page, W, H, R: 0, ox: 0, oy: 0, w: W, h: H };
    } else if (cfg.size === 'keep') {
      const page = prepared.get(p);
      const R = (page.getRotation().angle + p.rot) % 360;
      page.setRotation(degrees(R));
      out.addPage(page);
      const b = page.getCropBox();
      rec = { page, W: R % 180 ? b.height : b.width, H: R % 180 ? b.width : b.height, R, ox: b.x, oy: b.y, w: b.width, h: b.height };
    } else {
      const emb = prepared.get(p);
      const sp = p.src.edit.getPage(p.n - 1);
      const R = (sp.getRotation().angle + p.rot) % 360;
      const bw = emb.width, bh = emb.height;
      const vw = R % 180 ? bh : bw, vh = R % 180 ? bw : bh;
      let [W, H] = SIZES[cfg.size];
      if (vw > vh) [W, H] = [H, W];
      const k = Math.min(W / vw, H / vh);
      const ox = (W - vw * k) / 2, oy = (H - vh * k) / 2;
      const origin = { 0: [ox, oy], 90: [ox, oy + bw * k], 180: [ox + bw * k, oy + bh * k], 270: [ox + bh * k, oy] }[R];
      const page = out.addPage([W, H]);
      page.drawPage(emb, { x: origin[0], y: origin[1], xScale: k, yScale: k, rotate: degrees(-R) });
      rec = { page, W, H, R: 0, ox: 0, oy: 0, w: W, h: H };
    }
    rec.src = p.src;
    info.push(rec);
    lastSize = [rec.W, rec.H];
    task.set(0.3 + (0.6 * (i + 1)) / total);
  }

  if (cfg.numbers) {
    const font = await out.embedFont(StandardFonts.Helvetica);
    info.forEach((r, i) => {
      const text = cfg.nfmt === 'of' ? `${i + 1} / ${info.length}` : String(i + 1);
      const size = 10;
      const tw = font.widthOfTextAtSize(text, size);
      const vx = cfg.npos === 'left' ? 28 : cfg.npos === 'right' ? r.W - 28 - tw : (r.W - tw) / 2;
      const vy = 18;
      const [u, v] = { 0: [vx, vy], 90: [r.w - vy, vx], 180: [r.w - vx, r.h - vy], 270: [vy, r.h - vx] }[r.R];
      r.page.drawText(text, { x: r.ox + u, y: r.oy + v, size, font, color: rgb(0.25, 0.25, 0.25), rotate: degrees(r.R) });
    });
  }

  if (cfg.bookmarks) {
    let entries = [];
    let lastSrc = null;
    info.forEach((r, i) => { if (r.src && r.src !== lastSrc) { entries.push({ title: baseName(r.src.name), index: i, src: r.src }); lastSrc = r.src; } });
    const distinct = new Set(entries.map((e) => e.src));
    if (entries.length > distinct.size * 2) { // interleaved files: one entry per file, at its first page
      const first = new Set();
      entries = entries.filter((e) => !first.has(e.src) && first.add(e.src));
    }
    if (entries.length) {
      const ctx = out.context;
      const root = ctx.nextRef();
      const refs = entries.map(() => ctx.nextRef());
      entries.forEach((e, i) => {
        const d = ctx.obj({ Title: PDFHexString.fromText(e.title), Parent: root, Dest: [out.getPage(e.index).ref, PDFName.of('Fit')] });
        if (i > 0) d.set(PDFName.of('Prev'), refs[i - 1]);
        if (i < entries.length - 1) d.set(PDFName.of('Next'), refs[i + 1]);
        ctx.assign(refs[i], d);
      });
      ctx.assign(root, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[refs.length - 1], Count: entries.length }));
      out.catalog.set(PDFName.of('Outlines'), root);
      out.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
    }
  }

  out.setTitle(cfg.name);
  out.setProducer('LocalKit');
  out.setCreator('LocalKit');
  task.text('');
  return out.save();
}

// ---------------------------------------------------------------- merge + result

async function previewGrid(bytes, host) {
  const doc = await openForRender(bytes);
  const obs = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      obs.unobserve(e.target);
      const n = Number(e.target.dataset.n);
      thumbQueue = thumbQueue.then(async () => {
        try { e.target.querySelector('.pv').replaceChildren(await renderPage(doc, n, 150)); } catch { /* preview is best effort */ }
      });
    }
  }, { rootMargin: '400px' });
  const nodes = Array.from({ length: doc.numPages }, (_, i) => el('div', { class: 'pg', 'data-n': i + 1 }, el('div', { class: 'pv' }, el('span', { class: 'spinner' })), el('div', { class: 'num', text: String(i + 1) })));
  host.replaceChildren(...nodes);
  nodes.forEach((n) => obs.observe(n));
}

$('#pm-go').addEventListener('click', async () => {
  if (!pages.length) { note(t('needPages')); return; }
  note('');
  $('#pm-result').replaceChildren();
  const cfg = {
    name: ($('#pm-name').value.trim() || t('defName')).replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '_'),
    size: radio('pm-size'), img: radio('pm-img'), bookmarks: $('#pm-bm').checked, numbers: $('#pm-num').checked,
    npos: radio('pm-npos'), nfmt: radio('pm-nfmt'), cancel: false,
  };
  running = true;
  render();
  const task = progress($('#pm-task'), { title: t('merging'), onCancel: () => { cfg.cancel = true; } });
  try {
    const nFiles = new Set(pages.map((p) => p.src).filter(Boolean)).size;
    const bytes = await build(cfg, task);
    task.close();
    const blob = pdfBlob(bytes);
    const fileName = `${cfg.name}.pdf`;
    download(blob, fileName);
    const prev = el('div', { class: 'pages pm-pages pm-prev' });
    const result = el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', nFiles, pages.length, fmtBytes(bytes.length))),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, fileName) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => $('#pm-result').replaceChildren() }, t('editMore')),
        el('button', { class: 'btn ghost', onclick: startOver }, c('startOver'))),
      el('span', { class: 'field-label', text: t('preview') }), prev);
    $('#pm-result').replaceChildren(result);
    previewGrid(bytes, prev).catch(() => {});
  } catch (e) {
    task.close();
    if (!(e instanceof Cancelled)) note(errorText(e));
    else note(t('cancelled'), 'info');
  } finally {
    running = false;
    render();
  }
});

function startOver() {
  for (const s of sources) closeDoc(s.view);
  sources.length = 0;
  pages = [];
  history = [];
  $('#pm-result').replaceChildren();
  note('');
  setView('files');
  render();
  pick.open();
}

syncMode();
render();
