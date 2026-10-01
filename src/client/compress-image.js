import { $, $$ } from './lib.js';
import { batch, encode, EXT, prepareCanvas, outName } from './image-batch.js';
import { isHeic } from './image-core.js';

const QUALITY = { rec: 0.78, strong: 0.6 };

function readOptions() {
  return {
    level: $$('input[name="ci-l"]').find((r) => r.checked).value,
    kb: Math.max(5, Number($('#ci-kb').value) || 200),
    format: $$('input[name="ci-f"]').find((r) => r.checked).value,
    max: Number($('#ci-max').value),
  };
}

function outputType(file, format) {
  if (format !== 'same') return format;
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) return 'image/png';
  if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) return 'image/webp';
  if (isHeic(file)) return 'image/jpeg';
  return 'image/jpeg';
}

/** Finds the highest quality (then, if needed, the largest size) whose result fits `limit` bytes. */
async function fitToSize(img, type, limit, max) {
  let side = max || Math.max(img.width || img.naturalWidth, img.height || img.naturalHeight);
  for (let attempt = 0; attempt < 8; attempt++) {
    const cv = prepareCanvas(img, side, type === 'image/jpeg' ? '#fff' : undefined);
    if (type === 'image/png') {
      const b = await encode(cv, type, 1, { quantizePng: true });
      if (b.size <= limit) return { blob: b, cv };
    } else {
      let lo = 0.3, hi = 0.92, best = null;
      for (let i = 0; i < 6; i++) {
        const mid = (lo + hi) / 2;
        const b = await encode(cv, type, mid);
        if (b.size <= limit) { best = b; lo = mid; } else hi = mid;
      }
      if (!best) { const b = await encode(cv, type, 0.3); if (b.size <= limit) best = b; }
      if (best) return { blob: best, cv };
    }
    side = Math.round(Math.max(cv.width, cv.height) * 0.8);
  }
  const cv = prepareCanvas(img, side, '#fff');
  return { blob: await encode(cv, 'image/jpeg', 0.3), cv };
}

const engine = batch({
  prefix: 'ci',
  showSaving: true,
  zipName: 'compressed-images.zip',
  readOptions,
  async process(it, o) {
    const type = outputType(it.file, o.format);
    let blob, cv;
    if (o.level === 'target') {
      ({ blob, cv } = await fitToSize(it.img, type, o.kb * 1024, o.max));
    } else {
      cv = prepareCanvas(it.img, o.max, type === 'image/jpeg' ? '#fff' : undefined);
      blob = await encode(cv, type, QUALITY[o.level], { quantizePng: true });
      // Never hand back a bigger file than the original in the same format.
      if (blob.size >= it.file.size && !o.max && outputType(it.file, 'same') === type && !isHeic(it.file)) blob = it.file;
    }
    return { blob, name: outName(it.file, EXT[blob.type] || EXT[type]), w: cv.width, h: cv.height };
  },
});

$('#ci-work').addEventListener('change', (e) => {
  if (e.target.name === 'ci-l') $('#ci-kb-wrap').hidden = e.target.value !== 'target';
  engine.rerun();
});
$('#ci-kb').addEventListener('input', () => engine.rerun());
