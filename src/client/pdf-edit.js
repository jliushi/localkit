import { $, $$, t, el, dropzone, download, baseName, status, beginTask, LK } from './lib.js';
import { openForRender, openForEdit, readBytes, pdfBlob, pdflib, PdfError, closeDoc } from './pdf-common.js';

const st = status($('#pe-status'));
const pagesBox = $('#pe-pages');
const hint = $('#pe-hint');
let bytes = null, name = '', doc = null;
let pages = []; // { idx, viewport, wrap }
const anns = []; // { type, page, x, y, w, h, size, color, src, el, textEl }
let pending = null; // { src, ratio } waiting to be placed
let active = null;

const tool = () => $$('input[name="pe-tool"]').find((r) => r.checked).value;
const setTool = (v) => { $$('input[name="pe-tool"]').forEach((r) => { r.checked = r.value === v; }); };

// ---------------------------------------------------------------- loading

dropzone($('#pe-drop'), {
  accept: '.pdf,application/pdf',
  onFiles: async ([file]) => {
    st.clear();
    pages = []; anns.length = 0; active = null; pending = null;
    pagesBox.replaceChildren();
    try {
      bytes = await readBytes(file);
      name = baseName(file.name);
      await openForEdit(bytes); // fail early on encrypted files
      doc = await openForRender(bytes);
      $('#pe-drop').hidden = true;
      $('#pe-work').hidden = false;
      st.busy(t('loading'));
      const maxW = Math.min(900, pagesBox.clientWidth - 8);
      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: maxW / base.width });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const hi = page.getViewport({ scale: viewport.scale * dpr });
        const canvas = el('canvas', { width: Math.round(hi.width), height: Math.round(hi.height) });
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: hi, canvas }).promise;
        const wrap = el('div', { class: 'epage', 'data-idx': i }, canvas);
        wrap.style.width = `${viewport.width}px`;
        wrap.style.height = `${viewport.height}px`;
        wrap.addEventListener('pointerdown', (e) => onPagePointer(e, i));
        pagesBox.append(wrap);
        pages.push({ idx: i, viewport, wrap });
      }
      st.clear();
      updateHint();
    } catch (e) {
      $('#pe-drop').hidden = false;
      $('#pe-work').hidden = true;
      st.error(e);
    } finally { closeDoc(doc); doc = null; }
  },
});

// ---------------------------------------------------------------- annotations

function activate(a) {
  for (const x of anns) x.el.classList.toggle('active', x === a);
  active = a;
  if (a?.type === 'text') { $('#pe-size').value = a.size; $('#pe-color').value = a.color; }
}

function place(a) {
  a.el.style.left = `${a.x}px`;
  a.el.style.top = `${a.y}px`;
  if (a.type !== 'text') { a.el.style.width = `${a.w}px`; a.el.style.height = `${a.h}px`; }
  else { a.textEl.style.fontSize = `${a.size * pages[a.page].viewport.scale}px`; a.textEl.style.color = a.color; }
}

function addAnn(a) {
  const x = el('button', { class: 'x', type: 'button', title: t('del'), text: '×' });
  a.el = el('div', { class: 'ann' }, x);
  if (a.type === 'text') {
    a.textEl = el('div', { contenteditable: 'true', spellcheck: 'false' });
    a.textEl.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    a.el.prepend(a.textEl);
  } else if (a.type === 'white') {
    a.el.style.background = '#fff';
    a.el.style.outline = '1px solid rgba(0,0,0,.15)';
  } else {
    a.el.prepend(el('img', { src: a.src, alt: '' }));
  }
  if (a.type !== 'text') a.el.append(el('span', { class: 'rs' }));
  x.addEventListener('pointerdown', (e) => e.stopPropagation());
  x.addEventListener('click', () => { a.el.remove(); anns.splice(anns.indexOf(a), 1); if (active === a) active = null; });
  a.el.addEventListener('pointerdown', (e) => onAnnPointer(e, a));
  pages[a.page].wrap.append(a.el);
  anns.push(a);
  place(a);
  activate(a);
  if (a.type === 'text') { a.textEl.focus(); document.execCommand('selectAll'); }
  return a;
}

function onPagePointer(e, idx) {
  if (e.target.closest('.ann')) return;
  const rect = pages[idx].wrap.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const tl = tool();
  if (tl === 'text') {
    e.preventDefault();
    const size = Number($('#pe-size').value) || 14;
    const a = addAnn({ type: 'text', page: idx, x, y: y - size * pages[idx].viewport.scale * 0.6, size, color: $('#pe-color').value });
    a.textEl.textContent = t('typeHere');
    a.textEl.focus();
    document.execCommand('selectAll');
  } else if (tl === 'whiteout') {
    e.preventDefault();
    addAnn({ type: 'white', page: idx, x: x - 60, y: y - 14, w: 120, h: 28 });
  } else if ((tl === 'signature' || tl === 'image') && pending) {
    e.preventDefault();
    const w = Math.min(tl === 'signature' ? 180 : 240, rect.width * 0.6);
    const h = w / pending.ratio;
    addAnn({ type: 'image', page: idx, x: x - w / 2, y: y - h / 2, w, h, src: pending.src });
    pending = null;
    setTool('select');
    updateHint();
  } else {
    activate(null);
  }
}

function onAnnPointer(e, a) {
  activate(a);
  const editing = a.type === 'text' && document.activeElement === a.textEl && e.target.closest('[contenteditable]');
  if (editing) return;
  e.preventDefault();
  const resizing = e.target.classList.contains('rs');
  const start = { x: e.clientX, y: e.clientY, ax: a.x, ay: a.y, w: a.w, h: a.h };
  let moved = false;
  const onMove = (ev) => {
    const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (resizing) {
      a.w = Math.max(16, start.w + dx);
      a.h = a.type === 'image' ? a.w * (start.h / start.w) : Math.max(8, start.h + dy);
    } else {
      a.x = start.ax + dx;
      a.y = start.ay + dy;
    }
    place(a);
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (!moved && a.type === 'text') {
      a.textEl.focus();
      const sel = getSelection();
      sel.selectAllChildren(a.textEl);
      sel.collapseToEnd();
    }
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

for (const inp of [$('#pe-size'), $('#pe-color')]) {
  inp.addEventListener('input', () => {
    if (active?.type !== 'text') return;
    active.size = Number($('#pe-size').value) || active.size;
    active.color = $('#pe-color').value;
    place(active);
  });
}

function updateHint() {
  hint.textContent = pending ? t('placeHint') : '';
}

// ---------------------------------------------------------------- signature & image sources

const pad = $('#pe-pad');
const pctx = pad.getContext('2d');
let drawing = false, drawn = false;
function padPoint(e) {
  const r = pad.getBoundingClientRect();
  return [(e.clientX - r.left) * (pad.width / r.width), (e.clientY - r.top) * (pad.height / r.height)];
}
pad.addEventListener('pointerdown', (e) => {
  drawing = true; drawn = true;
  pad.setPointerCapture(e.pointerId);
  pctx.lineWidth = 5; pctx.lineCap = 'round'; pctx.lineJoin = 'round'; pctx.strokeStyle = '#111';
  pctx.beginPath();
  pctx.moveTo(...padPoint(e));
});
pad.addEventListener('pointermove', (e) => { if (!drawing) return; pctx.lineTo(...padPoint(e)); pctx.stroke(); });
pad.addEventListener('pointerup', () => { drawing = false; });
$('#pe-sig-clear').addEventListener('click', () => { pctx.clearRect(0, 0, pad.width, pad.height); drawn = false; });
$('#pe-sig-cancel').addEventListener('click', () => { $('#pe-sig').close(); setTool('select'); });

/** Crops transparent margins so the placed signature is tight. */
function trimCanvas(cv) {
  const { data, width, height } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const pad2 = 8;
  x0 = Math.max(0, x0 - pad2); y0 = Math.max(0, y0 - pad2); x1 = Math.min(width - 1, x1 + pad2); y1 = Math.min(height - 1, y1 + pad2);
  const out = el('canvas', { width: x1 - x0 + 1, height: y1 - y0 + 1 });
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

$('#pe-sig-use').addEventListener('click', () => {
  const cv = drawn && trimCanvas(pad);
  if (!cv) return;
  pending = { src: cv.toDataURL('image/png'), ratio: cv.width / cv.height };
  $('#pe-sig').close();
  updateHint();
});

async function imageFileToPending(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const cv = el('canvas', { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) });
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  pending = { src: cv.toDataURL('image/png'), ratio: cv.width / cv.height };
  updateHint();
}
$('#pe-imgfile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if ($('#pe-sig').open) $('#pe-sig').close();
  try { await imageFileToPending(f); } catch (err) { st.error(err); }
});
$('#pe-sig-upload').addEventListener('click', () => $('#pe-imgfile').click());

for (const r of $$('input[name="pe-tool"]')) {
  r.addEventListener('change', () => {
    pending = null;
    updateHint();
    if (r.value === 'signature' && r.checked) $('#pe-sig').showModal();
    if (r.value === 'image' && r.checked) $('#pe-imgfile').click();
  });
}

// ---------------------------------------------------------------- saving

/** Draws a text annotation into a PNG (so every language renders without embedding fonts). */
function rasterizeText(a, scale) {
  const f = 4 / scale; // 4 px per PDF point
  const box = a.textEl.getBoundingClientRect();
  const lines = a.textEl.innerText.replace(/\n$/, '').split('\n');
  const fontPx = a.size * scale * f;
  const cv = el('canvas', { width: Math.max(1, Math.ceil(box.width * f)), height: Math.max(1, Math.ceil(box.height * f)) });
  const ctx = cv.getContext('2d');
  const cs = getComputedStyle(a.textEl);
  ctx.font = `${fontPx}px ${cs.fontFamily}`;
  ctx.fillStyle = a.color;
  ctx.textBaseline = 'top';
  const lh = (parseFloat(cs.lineHeight) || a.size * scale * 1.2) * f;
  lines.forEach((line, i) => ctx.fillText(line, 0, i * lh + (lh - fontPx) / 2));
  return { cv, w: box.width, h: box.height };
}

const dataUrlBytes = async (src) => new Uint8Array(await (await fetch(src)).arrayBuffer());

$('#pe-save').addEventListener('click', async () => {
  if (!anns.length) { st.error(new PdfError(t('empty'))); return; }
  st.busy(t('saving'));
  const task = beginTask();
  try {
    const { rgb, degrees } = await pdflib();
    const pdf = await openForEdit(bytes);
    for (const a of anns) {
      const pg = pages[a.page];
      const vp = pg.viewport;
      const page = pdf.getPage(a.page);
      let w = a.w, h = a.h, png = null;
      if (a.type === 'text') {
        if (!a.textEl.innerText.trim()) continue;
        const r = rasterizeText(a, vp.scale);
        w = r.w; h = r.h;
        png = await pdf.embedPng(await new Promise((res) => r.cv.toBlob(async (b) => res(new Uint8Array(await b.arrayBuffer())), 'image/png')));
      } else if (a.type === 'image') {
        png = await pdf.embedPng(await dataUrlBytes(a.src));
      }
      // Display box → PDF user space (handles page rotation and crop box offsets).
      const [x1, y1] = vp.convertToPdfPoint(a.x, a.y);
      const [x2, y2] = vp.convertToPdfPoint(a.x + w, a.y + h);
      const minX = Math.min(x1, x2), minY = Math.min(y1, y2);
      const W = Math.abs(x2 - x1), H = Math.abs(y2 - y1);
      if (a.type === 'white') {
        page.drawRectangle({ x: minX, y: minY, width: W, height: H, color: rgb(1, 1, 1) });
        continue;
      }
      const rot = vp.rotation % 360;
      const iw = w / vp.scale, ih = h / vp.scale; // image size in points, display orientation
      const pos = { 0: [minX, minY], 90: [minX + W, minY], 180: [minX + W, minY + H], 270: [minX, minY + H] }[rot];
      page.drawImage(png, { x: pos[0], y: pos[1], width: iw, height: ih, rotate: degrees(rot) });
    }
    download(pdfBlob(await pdf.save()), `${name}_edited.pdf`);
    st.ok(t('done'));
  } catch (e) {
    st.error(e);
  } finally { task.finish(); }
});

document.addEventListener('keydown', (e) => {
  if ($('#tool').getAttribute('aria-busy') === 'true' || e.target.closest('input, textarea, [contenteditable]')) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && active) {
    e.preventDefault();
    active.el.querySelector('.x').click();
  }
});

$('#pe-reset').addEventListener('click', () => {
  if (anns.length && !confirm(LK.lang === 'zh' ? '未保存的编辑将丢失，继续选择其他 PDF？' : 'Unsaved edits will be discarded. Open another PDF?')) return;
  pages = []; anns.length = 0; active = null; pending = null; bytes = null;
  pagesBox.replaceChildren();
  $('#pe-work').hidden = true;
  $('#pe-drop').hidden = false;
  st.clear();
  $('#pe-drop').focus();
});
