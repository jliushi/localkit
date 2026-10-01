import { $, $$, t, el, filePicker, progress, alertBox, errorText, download, fmtBytes, baseName, icon } from './lib.js';
import { openForRender, openForEdit, readBytes, pdfBlob, pdflib, closeDoc, SAMPLE_PDF } from './pdf-common.js';

// Annotation positions are stored in "page points" of the displayed (rotated) page at scale 1.
let bytes = null, name = 'document', doc = null;
let pages = []; // { vp1, wrap, canvas }
let anns = []; // { id, type: text|check|white|image, page, x, y, w, h, text, size, color, src, ratio }
let history = [];
let selected = null;
let pending = null; // { src, ratio, w } waiting to be placed
let zoom = 1, fit = 1;
let nextId = 1;
const FONT = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

filePicker($('#pe-pick'), { accept: '.pdf,application/pdf', iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: ([f]) => load(f) });
const tool = () => $$('input[name="pe-tool"]').find((r) => r.checked).value;
const setTool = (v) => { for (const r of $$('input[name="pe-tool"]')) r.checked = r.value === v; hint(); };
const S = () => fit * zoom; // CSS px per point

function hint() {
  const tl = tool();
  $('#pe-hint').textContent = pending ? t('hintPlace') : { text: t('hintText'), check: t('hintCheck'), white: t('hintWhite'), select: t('hintSelect') }[tl] || t('hintPlace');
  for (const p of pages) p.wrap.classList.toggle('placing', tl !== 'select' || !!pending);
}

const snapshot = () => JSON.stringify(anns);
function remember() { history.push(snapshot()); if (history.length > 100) history.shift(); }
function undo() {
  if (!history.length) return;
  anns = JSON.parse(history.pop());
  selected = null;
  renderAnns();
}

// ---------------------------------------------------------------- pages

async function load(file) {
  $('#pe-pick').hidden = true;
  $('#pe-work').hidden = false;
  $('#pe-alert').replaceChildren();
  $('#pe-result').replaceChildren();
  anns = []; history = []; selected = null; pending = null; zoom = 1;
  closeDoc(doc);
  try {
    bytes = await readBytes(file);
    name = baseName(file.name);
    await openForEdit(bytes); // fails early for encrypted files
    doc = await openForRender(bytes);
  } catch (e) {
    $('#pe-alert').replaceChildren(alertBox(errorText(e)));
    $('#pe-pick').hidden = false;
    $('#pe-work').hidden = true;
    return;
  }
  const task = progress($('#pe-task'), { title: t('loading') });
  pages = [];
  $('#pe-pages').replaceChildren();
  for (let i = 0; i < doc.numPages; i++) {
    const page = await doc.getPage(i + 1);
    const vp1 = page.getViewport({ scale: 1 });
    const wrap = el('div', { class: 'epage', 'data-i': i });
    wrap.addEventListener('pointerdown', (e) => onPagePointer(e, i));
    pages.push({ vp1, wrap, page, canvas: null });
    $('#pe-pages').append(wrap);
    task.set((i + 1) / doc.numPages);
  }
  task.close();
  fit = Math.min(1.5, (Math.min(900, $('#pe-pages').clientWidth - 16)) / Math.max(...pages.map((p) => p.vp1.width)));
  await renderPages();
  hint();
}

let renderToken = 0;
async function renderPages() {
  const token = ++renderToken;
  $('#pe-zoom').textContent = `${Math.round(zoom * 100)}%`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const p of pages) {
    const s = S();
    const vp = p.page.getViewport({ scale: s * dpr });
    const canvas = el('canvas', { width: Math.round(vp.width), height: Math.round(vp.height) });
    canvas.style.width = `${p.vp1.width * s}px`;
    canvas.style.height = `${p.vp1.height * s}px`;
    p.wrap.style.width = canvas.style.width;
    p.wrap.style.height = canvas.style.height;
    await p.page.render({ canvasContext: canvas.getContext('2d'), viewport: vp, canvas }).promise;
    if (token !== renderToken) return;
    if (p.canvas) p.canvas.replaceWith(canvas); else p.wrap.prepend(canvas);
    p.canvas = canvas;
  }
  renderAnns();
}

// ---------------------------------------------------------------- annotations

function renderAnns() {
  for (const p of pages) for (const n of $$('.ann', p.wrap)) n.remove();
  const s = S();
  for (const a of anns) {
    const node = el('div', { class: `ann${a === selected || a.id === selected?.id ? ' on' : ''}`, 'data-id': a.id, tabindex: 0 });
    node.style.left = `${a.x * s}px`;
    node.style.top = `${a.y * s}px`;
    if (a.type === 'text' || a.type === 'check') {
      const ed = el('div', { contenteditable: a.type === 'text' ? 'true' : 'false', spellcheck: 'false', text: a.type === 'check' ? '✓' : a.text });
      ed.style.cssText = `font: ${a.type === 'check' ? 700 : 400} ${a.size * s}px ${FONT}; color: ${a.color}`;
      ed.addEventListener('focus', () => remember(), { once: true });
      ed.addEventListener('input', () => { a.text = ed.innerText.replace(/\n$/, ''); });
      node.append(ed);
    } else if (a.type === 'white') {
      node.style.width = `${a.w * s}px`;
      node.style.height = `${a.h * s}px`;
      node.style.background = '#fff';
      node.style.boxShadow = '0 0 0 1px rgba(0,0,0,.12)';
    } else {
      node.style.width = `${a.w * s}px`;
      node.style.height = `${a.h * s}px`;
      node.append(el('img', { src: a.src, alt: '' }));
    }
    if (a.type === 'white' || a.type === 'image') node.append(el('span', { class: 'rs' }));
    node.append(el('button', { type: 'button', class: 'x', title: t('del'), 'aria-label': t('del'), text: '×', onpointerdown: (e) => e.stopPropagation(), onclick: () => { remember(); anns = anns.filter((x) => x.id !== a.id); selected = null; renderAnns(); } }));
    node.addEventListener('pointerdown', (e) => onAnnPointer(e, a, node));
    pages[a.page].wrap.append(node);
  }
}

function select(a) {
  selected = a;
  for (const n of $$('.ann')) n.classList.toggle('on', Number(n.dataset.id) === a?.id);
  if (a && (a.type === 'text' || a.type === 'check')) { $('#pe-size').value = a.size; $('#pe-color').value = a.color; }
}

function add(a) {
  remember();
  a.id = nextId++;
  anns.push(a);
  renderAnns();
  select(a);
  const node = $(`.ann[data-id="${a.id}"]`);
  if (a.type === 'text') {
    const ed = node.querySelector('[contenteditable]');
    ed.focus();
    getSelection().selectAllChildren(ed);
  }
  return a;
}

function onPagePointer(e, i) {
  if (e.target.closest('.ann')) return;
  if (document.activeElement?.isContentEditable) document.activeElement.blur();
  const r = pages[i].wrap.getBoundingClientRect();
  const s = S();
  const x = (e.clientX - r.left) / s, y = (e.clientY - r.top) / s;
  const size = Number($('#pe-size').value) || 14;
  const color = $('#pe-color').value;
  const tl = tool();
  if (pending) {
    e.preventDefault();
    const w = pending.w;
    const h = w / pending.ratio;
    add({ type: 'image', page: i, x: x - w / 2, y: y - h / 2, w, h, src: pending.src, ratio: pending.ratio });
    pending = null;
    setTool('select');
  } else if (tl === 'text') {
    e.preventDefault();
    add({ type: 'text', page: i, x, y: y - size * 0.65, text: t('typeHere'), size, color });
  } else if (tl === 'check') {
    e.preventDefault();
    add({ type: 'check', page: i, x: x - size * 0.4, y: y - size * 0.7, size: Math.max(size, 16), color });
  } else if (tl === 'white') {
    e.preventDefault();
    add({ type: 'white', page: i, x: x - 60, y: y - 12, w: 120, h: 24 });
  } else {
    select(null);
    if (document.activeElement?.isContentEditable) document.activeElement.blur();
  }
}

function onAnnPointer(e, a, node) {
  const editing = a.type === 'text' && e.target.isContentEditable && document.activeElement === e.target;
  if (editing) return;
  e.preventDefault();
  e.stopPropagation();
  select(a);
  const resizing = e.target.classList.contains('rs');
  const s = S();
  const start = { x: e.clientX, y: e.clientY, ax: a.x, ay: a.y, w: a.w, h: a.h };
  let moved = false;
  node.setPointerCapture(e.pointerId);
  const move = (ev) => {
    const dx = (ev.clientX - start.x) / s, dy = (ev.clientY - start.y) / s;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 2 / s) { moved = true; remember(); }
    if (!moved) return;
    if (resizing) {
      a.w = Math.max(8, start.w + dx);
      a.h = a.type === 'image' ? a.w / a.ratio : Math.max(4, start.h + dy);
      node.style.width = `${a.w * s}px`;
      node.style.height = `${a.h * s}px`;
    } else {
      a.x = start.ax + dx;
      a.y = start.ay + dy;
      node.style.left = `${a.x * s}px`;
      node.style.top = `${a.y * s}px`;
    }
  };
  const up = () => {
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerup', up);
    if (!moved && a.type === 'text') {
      const ed = node.querySelector('[contenteditable]');
      ed.focus();
      const sel = getSelection();
      sel.selectAllChildren(ed);
      sel.collapseToEnd();
    }
  };
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
}

for (const inp of [$('#pe-size'), $('#pe-color')]) {
  inp.addEventListener('change', () => {
    if (!selected || !(selected.type === 'text' || selected.type === 'check')) return;
    remember();
    selected.size = Number($('#pe-size').value) || selected.size;
    selected.color = $('#pe-color').value;
    const keep = selected;
    renderAnns();
    select(keep);
  });
}

document.addEventListener('keydown', (e) => {
  if ($('#pe-work').hidden) return;
  const ae = document.activeElement;
  const typing = ae?.isContentEditable || ae?.tagName === 'TEXTAREA' || (ae?.tagName === 'INPUT' && /^(text|number|search|email|tel|url)$/.test(ae.type));
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undo(); return; }
  if (!selected || typing) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remember(); anns = anns.filter((x) => x.id !== selected.id); selected = null; renderAnns(); return; }
  const step = e.shiftKey ? 10 : 1;
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (d) { e.preventDefault(); remember(); selected.x += d[0]; selected.y += d[1]; const keep = selected; renderAnns(); select(keep); }
});

$('#pe-undo').addEventListener('click', undo);
$('#pe-zin').addEventListener('click', () => { zoom = Math.min(3, zoom * 1.25); renderPages(); });
$('#pe-zout').addEventListener('click', () => { zoom = Math.max(0.4, zoom / 1.25); renderPages(); });

// ---------------------------------------------------------------- signature & image sources

const pad = $('#pe-pad');
const pctx = pad.getContext('2d');
let drawing = false, drawn = false, sigTab = 'draw', sigUpload = null;
const padPoint = (e) => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * (pad.width / r.width), (e.clientY - r.top) * (pad.height / r.height)]; };
pad.addEventListener('pointerdown', (e) => {
  drawing = true; drawn = true;
  pad.setPointerCapture(e.pointerId);
  Object.assign(pctx, { lineWidth: 6, lineCap: 'round', lineJoin: 'round', strokeStyle: '#10204a' });
  pctx.beginPath();
  pctx.moveTo(...padPoint(e));
});
pad.addEventListener('pointermove', (e) => { if (!drawing) return; pctx.lineTo(...padPoint(e)); pctx.stroke(); });
pad.addEventListener('pointerup', () => { drawing = false; });

const SIG_FONT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", "Bradley Hand", "STXingkai", "KaiTi", "Kaiti SC", cursive';
function drawTyped() {
  const cv = $('#pe-sigprev');
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const text = $('#pe-sigtext').value.trim();
  if (!text) return;
  let px = 150;
  ctx.font = `${px}px ${SIG_FONT}`;
  while (ctx.measureText(text).width > cv.width - 60 && px > 30) { px -= 6; ctx.font = `${px}px ${SIG_FONT}`; }
  ctx.fillStyle = '#10204a';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, cv.width / 2, cv.height / 2);
}
$('#pe-sigtext').addEventListener('input', drawTyped);

for (const b of $$('#pe-sig [data-tab]')) {
  b.addEventListener('click', () => {
    sigTab = b.dataset.tab;
    for (const x of $$('#pe-sig [data-tab]')) x.setAttribute('aria-selected', String(x === b));
    for (const p of $$('#pe-sig [data-pane]')) p.hidden = p.dataset.pane !== sigTab;
    if (sigTab === 'type') $('#pe-sigtext').focus();
  });
}

/** Crops transparent (or near-white, for uploads) margins and makes white transparent. */
function trimCanvas(cv, whiteToAlpha) {
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = img.data;
  let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const i = (y * cv.width + x) * 4;
    if (whiteToAlpha) {
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      d[i + 3] = lum > 200 ? 0 : Math.min(255, (230 - lum) * 4);
    }
    if (d[i + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  if (whiteToAlpha) ctx.putImageData(img, 0, 0);
  const m = 6;
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(cv.width - 1, x1 + m); y1 = Math.min(cv.height - 1, y1 + m);
  const out = el('canvas', { width: x1 - x0 + 1, height: y1 - y0 + 1 });
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function imageToCanvas(file, max = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = el('canvas', { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv;
}
$('#pe-sigfile').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) sigUpload = await imageToCanvas(f, 1200); });

$('#pe-sig-use').addEventListener('click', () => {
  let cv = null;
  if (sigTab === 'draw' && drawn) cv = trimCanvas(pad, false);
  else if (sigTab === 'type') { drawTyped(); cv = trimCanvas($('#pe-sigprev'), false); }
  else if (sigTab === 'upload' && sigUpload) cv = trimCanvas(sigUpload, true);
  if (!cv) return;
  pending = { src: cv.toDataURL('image/png'), ratio: cv.width / cv.height, w: 150 };
  $('#pe-sig').close();
  hint();
});
$('#pe-sig-clear').addEventListener('click', () => { pctx.clearRect(0, 0, pad.width, pad.height); drawn = false; $('#pe-sigtext').value = ''; drawTyped(); sigUpload = null; $('#pe-sigfile').value = ''; });
$('#pe-sig-cancel').addEventListener('click', () => { $('#pe-sig').close(); setTool('select'); });

$('#pe-img').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) { setTool('select'); return; }
  const cv = await imageToCanvas(f);
  pending = { src: cv.toDataURL('image/png'), ratio: cv.width / cv.height, w: 200 };
  hint();
});

for (const r of $$('input[name="pe-tool"]')) {
  r.addEventListener('change', () => {
    pending = null;
    if (r.checked && r.value === 'sign') $('#pe-sig').showModal();
    if (r.checked && r.value === 'image') $('#pe-img').click();
    hint();
  });
}

// ---------------------------------------------------------------- save

/** Draws text at 4 px per point, so any script renders without embedding fonts. Returns { canvas, w, h } in points. */
function rasterize(a) {
  const k = 4;
  const lines = (a.type === 'check' ? '✓' : a.text).split('\n');
  const font = `${a.type === 'check' ? 700 : 400} ${a.size * k}px ${FONT}`;
  const m = el('canvas').getContext('2d');
  m.font = font;
  const lh = a.size * 1.2 * k;
  const w = Math.max(1, Math.ceil(Math.max(...lines.map((l) => m.measureText(l).width)) + 4 * k));
  const h = Math.ceil(lh * lines.length + 2 * k);
  const cv = el('canvas', { width: w, height: h });
  const ctx = cv.getContext('2d');
  ctx.font = font;
  ctx.fillStyle = a.color;
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 2 * k, k + lh * i + lh / 2));
  return { canvas: cv, w: w / k, h: h / k };
}

$('#pe-save').addEventListener('click', async () => {
  if (!anns.length) { $('#pe-alert').replaceChildren(alertBox(t('empty'), 'info')); return; }
  document.activeElement?.blur?.();
  $('#pe-alert').replaceChildren();
  $('#pe-save').disabled = true;
  const task = progress($('#pe-task'), { title: t('saving') });
  try {
    const { rgb, degrees } = await pdflib();
    const pdf = await openForEdit(bytes);
    for (const a of anns) {
      const { vp1 } = pages[a.page];
      const page = pdf.getPage(a.page);
      let w = a.w, h = a.h, png = null;
      if (a.type === 'text' || a.type === 'check') {
        if (a.type === 'text' && !a.text.trim()) continue;
        const r = rasterize(a);
        w = r.w; h = r.h;
        png = await pdf.embedPng(new Uint8Array(await (await new Promise((res) => r.canvas.toBlob(res, 'image/png'))).arrayBuffer()));
      } else if (a.type === 'image') {
        png = await pdf.embedPng(new Uint8Array(await (await fetch(a.src)).arrayBuffer()));
      }
      // Displayed page points → PDF user space (handles page rotation and crop-box offsets).
      // Text is laid out from the top of its line box, which sits 1 pt above the editor's text.
      const yTop = a.type === 'text' || a.type === 'check' ? a.y - 0.5 : a.y;
      const [x1, y1] = vp1.convertToPdfPoint(a.x, yTop);
      const [x2, y2] = vp1.convertToPdfPoint(a.x + w, yTop + h);
      const minX = Math.min(x1, x2), minY = Math.min(y1, y2), W = Math.abs(x2 - x1), H = Math.abs(y2 - y1);
      if (a.type === 'white') { page.drawRectangle({ x: minX, y: minY, width: W, height: H, color: rgb(1, 1, 1) }); continue; }
      const rot = vp1.rotation % 360;
      const pos = { 0: [minX, minY], 90: [minX + W, minY], 180: [minX + W, minY + H], 270: [minX, minY + H] }[rot];
      page.drawImage(png, { x: pos[0], y: pos[1], width: w, height: h, rotate: degrees(rot) });
    }
    const out = await pdf.save();
    task.close();
    const blob = pdfBlob(out);
    const outName = `${name}-edited.pdf`;
    download(blob, outName);
    $('#pe-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', fmtBytes(out.length))),
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: () => download(blob, outName) }, icon('download'), t('download')))));
  } catch (e) {
    task.close();
    $('#pe-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#pe-save').disabled = false;
  }
});

