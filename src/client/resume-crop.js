// Photo cropper dialog: drag to move, slider/wheel to zoom, shapes square / 2:3 / circle.
import { el } from './lib.js';
import { T } from './resume-i18n.js';

const ASPECT = { square: 1, circle: 1, portrait: 1.5 };

const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; });

/** Downscales an arbitrary image (data URL) so the stored original is at most `max` px. */
export async function shrink(src, max = 900) {
  const img = await loadImage(src);
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.88);
}

/** Opens the cropper; resolves { src, orig, shape } or null when cancelled. */
export async function cropDialog(orig, shape = 'square') {
  const img = await loadImage(orig);
  return new Promise((resolve) => {
    let zoom = 1, cx = img.naturalWidth / 2, cy = img.naturalHeight / 2;
    const FW = 220;
    const canvas = el('canvas', { class: 'crop-cv' });
    const frame = el('div', { class: 'crop-frame' }, canvas);
    const range = el('input', { type: 'range', min: 1, max: 4, step: 0.01, value: 1, 'aria-label': T('crop.zoom') });
    const shapes = {};
    const bar = el('div', { class: 'seg' }, ['square', 'portrait', 'circle'].map((s) => shapes[s] = el('button', { type: 'button', class: s === shape ? 'on' : '', text: T(`crop.${s}`), onclick: () => { shape = s; layout(); } })));
    const dlg = el('dialog', { class: 'rv-dlg' },
      el('h3', { text: T('crop.title') }), bar, frame,
      el('label', { class: 'field' }, el('span', { text: T('crop.zoom') }), range),
      el('p', { class: 'hint', text: T('crop.hint') }),
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'btn ghost', text: T('cancel'), onclick: () => close(null) }),
        el('button', { type: 'button', class: 'btn', text: T('crop.use'), onclick: () => close(result()) })));
    const dims = () => { const fh = FW * ASPECT[shape]; return [FW, fh]; };
    const base = () => { const [fw, fh] = dims(); return Math.max(fw / img.naturalWidth, fh / img.naturalHeight); };
    function draw(cv, fw, fh, k) {
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      const s = base() * zoom * k;
      ctx.drawImage(img, cv.width / 2 - cx * s, cv.height / 2 - cy * s, img.naturalWidth * s, img.naturalHeight * s);
    }
    const clamp = () => {
      const [fw, fh] = dims(); const s = base() * zoom;
      const hw = fw / 2 / s, hh = fh / 2 / s;
      cx = Math.min(img.naturalWidth - hw, Math.max(hw, cx)); cy = Math.min(img.naturalHeight - hh, Math.max(hh, cy));
    };
    function layout() {
      const [fw, fh] = dims();
      for (const [k, b] of Object.entries(shapes)) b.classList.toggle('on', k === shape);
      frame.style.width = `${fw}px`; frame.style.height = `${fh}px`;
      frame.style.borderRadius = shape === 'circle' ? '50%' : '6px';
      canvas.width = fw * 2; canvas.height = fh * 2; canvas.style.width = `${fw}px`; canvas.style.height = `${fh}px`;
      clamp(); draw(canvas, fw, fh, 2);
    }
    function result() {
      const out = document.createElement('canvas');
      out.width = 480; out.height = Math.round(480 * ASPECT[shape]);
      const [fw] = dims();
      draw(out, fw, 0, 480 / fw);
      return { src: out.toDataURL('image/jpeg', 0.9), orig, shape };
    }
    let drag = null;
    frame.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, cx, cy }; frame.setPointerCapture(e.pointerId); });
    frame.addEventListener('pointermove', (e) => { if (!drag) return; const s = base() * zoom; cx = drag.cx - (e.clientX - drag.x) / s; cy = drag.cy - (e.clientY - drag.y) / s; layout(); });
    frame.addEventListener('pointerup', () => { drag = null; });
    frame.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.min(4, Math.max(1, zoom * (e.deltaY < 0 ? 1.06 : 0.94))); range.value = zoom; layout(); }, { passive: false });
    range.addEventListener('input', () => { zoom = Number(range.value); layout(); });
    const close = (v) => { dlg.close(); dlg.remove(); resolve(v); };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
    document.body.append(dlg);
    dlg.showModal();
    layout();
  });
}
