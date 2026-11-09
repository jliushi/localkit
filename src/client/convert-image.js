import { $, $$ } from './lib.js';
import { batch, encode, EXT, prepareCanvas, outName, canEncode } from './image-batch.js';

/** Shared by Image Converter and HEIC to JPG (which uses the same controls with prefix "hj"). */
export function setup(prefix) {
  const q = (s) => $(`#${prefix}-${s}`);
  const type = () => $$(`input[name="${prefix}-f"]`).find((r) => r.checked).value;

  function refresh() {
    const tp = type();
    q('q-wrap').hidden = !['image/jpeg', 'image/webp', 'image/avif'].includes(tp);
    if (q('bg-wrap')) q('bg-wrap').hidden = tp !== 'image/jpeg';
  }

  canEncode('image/avif').then((ok) => {
    const r = $(`input[name="${prefix}-f"][value="image/avif"]`);
    if (r && !ok) { r.disabled = true; r.nextElementSibling.textContent = r.dataset.no; }
  });

  const engine = batch({
    prefix,
    zipName: 'converted-images.zip',
    sample: prefix === 'hj' ? 'sample.heic' : 'photo.jpg',
    readOptions: () => ({ type: type(), quality: Number(q('q').value) / 100, max: Number(q('max')?.value || 0), bg: q('bg')?.value || '#ffffff' }),
    async process(it, o) {
      if (!Number.isFinite(o.max) || o.max < 0 || !Number.isInteger(o.max)) throw new Error('Enter a non-negative whole number for the image size.');
      const max = o.type === 'image/x-icon' ? Math.min(o.max || 256, 256) : o.max;
      const cv = prepareCanvas(it.img, max, o.type === 'image/jpeg' ? o.bg : undefined);
      const blob = await encode(cv, o.type, o.quality);
      return { blob, name: outName(it.file, EXT[o.type]), w: cv.width, h: cv.height };
    },
  });

  q('q').addEventListener('input', () => { q('qv').textContent = q('q').value; });
  q('q').addEventListener('change', engine.rerun);
  document.addEventListener('change', (e) => {
    if (e.target.name === `${prefix}-f` || e.target === q('max') || e.target === q('bg')) { refresh(); engine.rerun(); }
  });
  refresh();
  return engine;
}

if (document.getElementById('cm-pick')) setup('cm');
