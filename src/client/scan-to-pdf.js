import { $, $$, t, c, el, icon, filePicker, progress, alertBox, errorText, download, fmtBytes, LK, nextFrame } from './lib.js';
import { pdflib, pdfBlob, sortable, move, tbtn } from './pdf-common.js';
import { IMAGE_ACCEPT, decodeImage, drawRotated, toBlob, imageSize } from './image-core.js';

const items = []; // { file, img, quad: [[x,y]×4] in source px (TL, TR, BR, BL), rot, thumb }
const grid = $('#sc-pages');
const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
const MAX_OUT = 2400;

const sample = { url: `${LK.base}/assets/samples/document-photo.jpg`, name: 'document-photo.jpg', type: 'image/jpeg' };
filePicker($('#sc-pick'), { accept: IMAGE_ACCEPT, multiple: true, iconName: 'camera', title: t('drop'), hint: t('dropHint'), sample, onFiles: add });
filePicker($('#sc-more'), { accept: IMAGE_ACCEPT, multiple: true, compact: true, iconName: 'plus', title: t('add'), onFiles: add });
$('#sc-cam').addEventListener('change', (e) => { add([...e.target.files]); e.target.value = ''; });

const filter = () => $$('input[name="sc-f"]').find((r) => r.checked).value;

// ---------------------------------------------------------------- page detection

/** Finds the paper: the largest bright blob, reduced to its four extreme corners. Returns null if unsure. */
function detectQuad(img) {
  const [W, H] = imageSize(img);
  const k = Math.min(1, 360 / Math.max(W, H));
  const w = Math.round(W * k), h = Math.round(H * k);
  const cv = el('canvas', { width: w, height: h });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.filter = 'blur(2px)';
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  const hist = new Uint32Array(256);
  for (let i = 0; i < w * h; i++) { const g = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000 | 0; gray[i] = g; hist[g]++; }
  // Otsu threshold.
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, th = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i]; if (!wB) continue;
    const wF = w * h - wB; if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; th = i; }
  }
  // Largest connected bright component (4-connectivity, iterative flood fill).
  const label = new Int32Array(w * h).fill(-1);
  let bestLabel = -1, bestSize = 0;
  const stack = [];
  for (let start = 0, lab = 0; start < w * h; start++) {
    if (gray[start] <= th || label[start] !== -1) continue;
    let size = 0;
    stack.push(start);
    label[start] = lab;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && label[q] === -1 && gray[q] > th) { label[q] = lab; stack.push(q); }
      }
    }
    if (size > bestSize) { bestSize = size; bestLabel = lab; }
    lab++;
  }
  if (bestSize < w * h * 0.12 || bestSize > w * h * 0.97) return null;
  let tl = [0, 0, Infinity], br = [0, 0, -Infinity], tr = [0, 0, -Infinity], bl = [0, 0, Infinity];
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== bestLabel) continue;
    const x = p % w, y = (p / w) | 0;
    if (x + y < tl[2]) tl = [x, y, x + y];
    if (x + y > br[2]) br = [x, y, x + y];
    if (x - y > tr[2]) tr = [x, y, x - y];
    if (x - y < bl[2]) bl = [x, y, x - y];
  }
  // Pull the corners 1% towards the centre so no background shows along the edges.
  const pts = [tl, tr, br, bl].map(([x, y]) => [x / k, y / k]);
  const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
  return pts.map(([x, y]) => [x + (cx - x) * 0.012, y + (cy - y) * 0.012]);
}

const fullQuad = (img) => { const [W, H] = imageSize(img); return [[0, 0], [W, 0], [W, H], [0, H]]; };

// ---------------------------------------------------------------- perspective warp

/** Homography mapping the unit square (0,0)(1,0)(1,1)(0,1) onto quad (TL, TR, BR, BL). */
function squareToQuad(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + hh * x3, x0, y1 - y0 + g * y1, y3 - y0 + hh * y3, y0, g, hh];
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Straightens the quad region of `img` into a rectangle (bilinear sampling). */
function warp(img, quad, maxSide) {
  const [tl, tr, br, bl] = quad;
  let ow = Math.max(dist(tl, tr), dist(bl, br)), oh = Math.max(dist(tl, bl), dist(tr, br));
  const k = Math.min(1, maxSide / Math.max(ow, oh));
  ow = Math.max(2, Math.round(ow * k)); oh = Math.max(2, Math.round(oh * k));
  // Sample from a source copy no larger than needed.
  const [W, H] = imageSize(img);
  const sk = Math.min(1, (Math.max(ow, oh) * 1.4) / Math.max(dist(tl, tr), dist(tl, bl), 1));
  const sw = Math.max(2, Math.round(W * sk)), sh = Math.max(2, Math.round(H * sk));
  const src = el('canvas', { width: sw, height: sh });
  const sctx = src.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(img, 0, 0, sw, sh);
  const S = sctx.getImageData(0, 0, sw, sh).data;
  const [a, b, c0, d, e, f, g, h] = squareToQuad(quad.map(([x, y]) => [x * sk, y * sk]));
  const out = el('canvas', { width: ow, height: oh });
  const octx = out.getContext('2d');
  const O = octx.createImageData(ow, oh);
  const D = O.data;
  for (let y = 0; y < oh; y++) {
    const v = (y + 0.5) / oh;
    for (let x = 0; x < ow; x++) {
      const u = (x + 0.5) / ow;
      const z = g * u + h * v + 1;
      let sx = (a * u + b * v + c0) / z, sy = (d * u + e * v + f) / z;
      sx = Math.min(sw - 1.001, Math.max(0, sx - 0.5)); sy = Math.min(sh - 1.001, Math.max(0, sy - 0.5));
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const o = (y * ow + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        D[o + ch] = (S[i00 + ch] * (1 - fx) + S[i10 + ch] * fx) * (1 - fy) + (S[i01 + ch] * (1 - fx) + S[i11 + ch] * fx) * fy;
      }
      D[o + 3] = 255;
    }
  }
  octx.putImageData(O, 0, 0);
  return out;
}

// ---------------------------------------------------------------- scanner filters

function applyFilter(cv, mode) {
  if (mode === 'original') return cv;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = img.data;
  const n = cv.width * cv.height;
  const gray = new Uint8ClampedArray(n);
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) { gray[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000; hist[gray[i]]++; }
  const pct = (p) => { let acc = 0; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= n * p) return i; } return 255; };
  const lo = pct(0.02), hi = Math.max(lo + 1, pct(0.9));
  const stretch = (v) => ((v - lo) * 255) / (hi - lo);
  if (mode === 'enhance') {
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = stretch(d[i + k]) * 1.04;
  } else if (mode === 'gray') {
    for (let i = 0; i < n; i++) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = stretch(gray[i]);
  } else {
    // Adaptive threshold (Bradley–Roth) against the local mean removes uneven lighting and shadows.
    const w = cv.width, h = cv.height;
    const integral = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) { row += gray[y * w + x]; integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row; }
    }
    const r = Math.max(8, Math.round(Math.max(w, h) / 22));
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
        const cnt = (x1 - x0 + 1) * (y1 - y0 + 1);
        const s = integral[(y1 + 1) * (w + 1) + x1 + 1] - integral[y0 * (w + 1) + x1 + 1] - integral[(y1 + 1) * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
        const v = gray[y * w + x] * cnt <= s * 0.86 ? 0 : 255;
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

function processPage(it, maxSide) {
  return applyFilter(drawRotated(warp(it.img, it.quad, maxSide), it.rot), filter());
}

// ---------------------------------------------------------------- page list

function card(it, i) {
  return el('div', { class: 'pg', draggable: 'true' },
    el('div', { class: 'pv' }, it.thumb || el('span', { class: 'spinner' })),
    el('div', { class: 'num', text: t('page', i + 1) }),
    el('div', { class: 'pg-tools' },
      tbtn('arrowLeft', t('left'), () => { move(items, i, i - 1); render(); }, i === 0),
      tbtn('crop', t('crop'), () => openCrop(it)),
      tbtn('rotateCw', t('rotR'), () => { it.rot = (it.rot + 90) % 360; refresh(it); }),
      tbtn('x', c('remove'), () => { it.img?.close?.(); items.splice(i, 1); render(); }),
      tbtn('arrowRight', t('right'), () => { move(items, i, i + 1); render(); }, i === items.length - 1)));
}

function render() {
  grid.replaceChildren(...items.map(card));
  $('#sc-count').textContent = t('pages', items.length);
  $('#sc-pick').hidden = $('#sc-cam-row').hidden = items.length > 0;
  $('#sc-work').hidden = items.length === 0;
  $('#sc-go').disabled = !items.length || items.some((item) => !item.img || !item.quad);
}
sortable(grid, (from, to) => { move(items, from, to); render(); });

async function refresh(it) {
  it.thumb = processPage(it, 420);
  render();
}

async function add(files) {
  $('#sc-result').replaceChildren();
  $('#sc-alert').replaceChildren();
  const fresh = files.map((file) => ({ file, img: null, quad: null, rot: 0, thumb: null }));
  items.push(...fresh);
  render();
  for (const it of fresh) {
    try {
      it.img = await decodeImage(it.file);
      await nextFrame();
      it.quad = detectQuad(it.img) || fullQuad(it.img);
      await refresh(it);
    } catch (e) {
      items.splice(items.indexOf(it), 1);
      render();
      $('#sc-alert').replaceChildren(alertBox(`${it.file.name}: ${errorText(e)}`));
    }
  }
}

$('#sc-work').addEventListener('change', async (e) => {
  if (e.target.name !== 'sc-f') return;
  for (const it of items) { if (it.img) it.thumb = processPage(it, 420); await nextFrame(); render(); }
});

// ---------------------------------------------------------------- crop editor

let editing = null, editQuad = null;
function openCrop(it) {
  editing = it;
  editQuad = it.quad.map((p) => [...p]);
  const preview = drawRotated(it.img, 0, 1100);
  const [W] = imageSize(it.img);
  const k = preview.width / W;
  const wrap = $('#sc-cropwrap');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const poly = document.createElementNS(svgNS, 'polygon');
  poly.setAttribute('fill', 'rgba(20,184,166,.15)');
  poly.setAttribute('stroke', '#14b8a6');
  poly.setAttribute('stroke-width', '3');
  poly.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.append(poly);
  svg.setAttribute('viewBox', `0 0 ${preview.width} ${preview.height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const dots = editQuad.map(() => el('div', { class: 'crop-dot', tabindex: 0 }));
  wrap.replaceChildren(preview, svg, ...dots);
  const draw = () => {
    poly.setAttribute('points', editQuad.map(([x, y]) => `${x * k},${y * k}`).join(' '));
    const r = preview.getBoundingClientRect();
    const sx = r.width / preview.width;
    dots.forEach((dot, i) => { dot.style.left = `${editQuad[i][0] * k * sx}px`; dot.style.top = `${editQuad[i][1] * k * sx}px`; });
  };
  dots.forEach((dot, i) => {
    dot.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dot.setPointerCapture(e.pointerId);
      const moveDot = (ev) => {
        const r = preview.getBoundingClientRect();
        const [W2, H2] = imageSize(it.img);
        editQuad[i] = [Math.max(0, Math.min(W2, ((ev.clientX - r.left) / r.width) * W2)), Math.max(0, Math.min(H2, ((ev.clientY - r.top) / r.height) * H2))];
        draw();
      };
      const up = () => { dot.removeEventListener('pointermove', moveDot); dot.removeEventListener('pointerup', up); };
      dot.addEventListener('pointermove', moveDot);
      dot.addEventListener('pointerup', up);
    });
  });
  $('#sc-crop').showModal();
  requestAnimationFrame(draw);
  openCrop.redraw = draw;
}
$('#sc-auto').addEventListener('click', () => { const q = detectQuad(editing.img); if (q) { editQuad = q; openCrop.redraw(); } });
$('#sc-full').addEventListener('click', () => { editQuad = fullQuad(editing.img); openCrop.redraw(); });
$('#sc-cancel').addEventListener('click', () => $('#sc-crop').close());
$('#sc-apply').addEventListener('click', () => { editing.quad = editQuad; $('#sc-crop').close(); refresh(editing); });

// ---------------------------------------------------------------- PDF

$('#sc-go').addEventListener('click', async () => {
  const list = items.filter((x) => x.img);
  if (!list.length) return;
  const size = $$('input[name="sc-size"]').find((r) => r.checked).value;
  const mode = filter();
  $('#sc-go').disabled = true;
  const task = progress($('#sc-task'), { lock: true, title: t('creating', 1, list.length) });
  try {
    const { PDFDocument } = await pdflib();
    const pdf = await PDFDocument.create();
    for (let i = 0; i < list.length; i++) {
      task.title(t('creating', i + 1, list.length));
      await nextFrame();
      const cv = processPage(list[i], MAX_OUT);
      const bw = mode === 'bw';
      const blob = await toBlob(cv, bw ? 'image/png' : 'image/jpeg', 0.85);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const image = bw ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      let [pw, ph] = size === 'fit' ? [cv.width * 0.36, cv.height * 0.36] : SIZES[size];
      if (size !== 'fit' && cv.width > cv.height) [pw, ph] = [ph, pw];
      const page = pdf.addPage([pw, ph]);
      const k = Math.min(pw / cv.width, ph / cv.height);
      page.drawImage(image, { x: (pw - cv.width * k) / 2, y: (ph - cv.height * k) / 2, width: cv.width * k, height: cv.height * k });
      task.set((i + 1) / list.length);
    }
    const out = await pdf.save();
    task.close();
    const blob = pdfBlob(out);
    download(blob, 'scan.pdf');
    $('#sc-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', list.length, fmtBytes(out.length))),
      el('div', { class: 'actions' }, el('button', { class: 'btn', onclick: () => download(blob, 'scan.pdf') }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => { items.length = 0; render(); } }, t('another')))));
  } catch (e) {
    task.close();
    $('#sc-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#sc-go').disabled = false;
  }
});
