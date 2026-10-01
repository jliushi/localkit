import { $, $$, t, el, icon, filePicker, fileCard, progress, stat, alertBox, errorText, download, fmtBytes, baseName, nextFrame } from './lib.js';
import { openForRender, renderPage, readBytes, pdfBlob, pdflib, closeDoc, SAMPLE_PDF, PdfError } from './pdf-common.js';
import { toBlob } from './image-core.js';

const LEVELS = { light: { max: 2400, q: 0.82 }, rec: { max: 1600, q: 0.7 }, strong: { max: 1100, q: 0.55 } };
let file = null, bytes = null;

const pick = filePicker($('#cp-pick'), { accept: '.pdf,application/pdf', iconName: 'fileText', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_PDF(), onFiles: ([f]) => load(f) });

async function load(f) {
  file = f;
  $('#cp-pick').hidden = true;
  $('#cp-work').hidden = false;
  $('#cp-result').replaceChildren();
  $('#cp-alert').replaceChildren();
  try {
    bytes = await readBytes(f);
    const doc = await openForRender(bytes);
    $('#cp-file').replaceChildren(fileCard({ file: f, meta: `${t('pagesN', doc.numPages)} · ${fmtBytes(f.size)}`, thumb: await renderPage(doc, 1, 60), onChange: () => pick.open() }));
    closeDoc(doc);
  } catch (e) {
    $('#cp-alert').replaceChildren(alertBox(errorText(e)));
  }
}

// ---------------------------------------------------------------- image stream helpers

let PDFNameClass = null; // set once pdf-lib has loaded (class names don't survive minification)
const nameOf = (v) => (PDFNameClass && v instanceof PDFNameClass ? v.asString().slice(1) : null);

async function inflate(data) {
  const ds = new DecompressionStream('deflate');
  return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer());
}

/** Reverses PNG row predictors (PDF /Predictor ≥ 10). */
function unpredict(data, width, colors, bpc) {
  const bpp = Math.max(1, (colors * bpc) >> 3);
  const row = Math.ceil((width * colors * bpc) / 8);
  const rows = Math.floor(data.length / (row + 1));
  const out = new Uint8Array(rows * row);
  for (let y = 0; y < rows; y++) {
    const type = data[y * (row + 1)];
    const src = y * (row + 1) + 1;
    const dst = y * row;
    for (let x = 0; x < row; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y ? out[dst - row + x] : 0;
      const cc = y && x >= bpp ? out[dst - row + x - bpp] : 0;
      let v = data[src + x];
      if (type === 1) v += a;
      else if (type === 2) v += b;
      else if (type === 3) v += (a + b) >> 1;
      else if (type === 4) { const p = a + b - cc, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - cc); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : cc; }
      out[dst + x] = v & 255;
    }
  }
  return out;
}

/** Decodes an image XObject to a canvas, or returns null if its format isn't handled. */
async function decodeImage(stream, lib) {
  const d = stream.dict;
  const filters = (() => { const f = d.get(lib.PDFName.of('Filter')); if (!f) return []; if (f instanceof lib.PDFArray) return f.asArray().map(nameOf); return [nameOf(f)]; })();
  const w = d.get(lib.PDFName.of('Width'))?.asNumber?.(), h = d.get(lib.PDFName.of('Height'))?.asNumber?.();
  if (!w || !h || d.get(lib.PDFName.of('ImageMask'))) return null;
  let cs = d.lookup(lib.PDFName.of('ColorSpace'));
  let comps = null;
  if (cs instanceof lib.PDFArray && nameOf(cs.get(0)) === 'ICCBased') comps = cs.lookup(1)?.dict?.get(lib.PDFName.of('N'))?.asNumber?.();
  else comps = { DeviceRGB: 3, DeviceGray: 1, DeviceCMYK: 4 }[nameOf(cs)] ?? null;
  if (filters.length === 1 && filters[0] === 'DCTDecode') {
    if (d.get(lib.PDFName.of('Decode')) && comps === 4) return null; // inverted CMYK: leave untouched
    const bmp = await createImageBitmap(new Blob([stream.contents], { type: 'image/jpeg' }));
    return { bmp, w, h };
  }
  if (filters.length === 1 && filters[0] === 'FlateDecode' && (comps === 3 || comps === 1)) {
    const bpc = d.get(lib.PDFName.of('BitsPerComponent'))?.asNumber?.();
    if (bpc !== 8 || d.get(lib.PDFName.of('Decode'))) return null;
    let raw = await inflate(stream.contents);
    const parms = d.lookup(lib.PDFName.of('DecodeParms'));
    const predictor = parms?.get?.(lib.PDFName.of('Predictor'))?.asNumber?.() || 1;
    if (predictor >= 10) raw = unpredict(raw, w, comps, 8);
    else if (predictor !== 1) return null;
    if (raw.length < w * h * comps) return null;
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < w * h; i++, j += comps) {
      rgba[i * 4] = raw[j]; rgba[i * 4 + 1] = raw[j + (comps === 3 ? 1 : 0)]; rgba[i * 4 + 2] = raw[j + (comps === 3 ? 2 : 0)]; rgba[i * 4 + 3] = 255;
    }
    const bmp = await createImageBitmap(new ImageData(rgba, w, h));
    return { bmp, w, h, gray: comps === 1 };
  }
  return null;
}

$('#cp-go').addEventListener('click', async () => {
  const level = LEVELS[$$('input[name="cp-l"]').find((r) => r.checked).value];
  $('#cp-go').disabled = true;
  $('#cp-result').replaceChildren();
  $('#cp-alert').replaceChildren();
  const task = progress($('#cp-task'), { title: t('saving') });
  try {
    const lib = await pdflib();
    PDFNameClass = lib.PDFName;
    const pdf = await lib.PDFDocument.load(bytes, { updateMetadata: false }).catch(() => { throw new PdfError(errorText(new Error('encrypted or damaged PDF'))); });
    const images = pdf.context.enumerateIndirectObjects().filter(([, o]) => o instanceof lib.PDFRawStream && nameOf(o.dict.get(lib.PDFName.of('Subtype'))) === 'Image');
    let done = 0;
    for (let i = 0; i < images.length; i++) {
      const [ref, stream] = images[i];
      task.title(t('compressing', i + 1, images.length));
      task.set(i / images.length);
      const dec = await decodeImage(stream, lib).catch(() => null);
      if (!dec) continue;
      const k = Math.min(1, level.max / Math.max(dec.w, dec.h));
      const W = Math.max(1, Math.round(dec.w * k)), H = Math.max(1, Math.round(dec.h * k));
      const cv = el('canvas', { width: W, height: H });
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(dec.bmp, 0, 0, W, H);
      dec.bmp.close?.();
      const jpg = new Uint8Array(await (await toBlob(cv, 'image/jpeg', level.q)).arrayBuffer());
      if (jpg.length >= stream.contents.length * 0.92) continue;
      const dict = stream.dict.clone(pdf.context);
      dict.set(lib.PDFName.of('Filter'), lib.PDFName.of('DCTDecode'));
      dict.set(lib.PDFName.of('Width'), lib.PDFNumber.of(W));
      dict.set(lib.PDFName.of('Height'), lib.PDFNumber.of(H));
      dict.set(lib.PDFName.of('BitsPerComponent'), lib.PDFNumber.of(8));
      dict.set(lib.PDFName.of('ColorSpace'), lib.PDFName.of('DeviceRGB'));
      dict.set(lib.PDFName.of('Length'), lib.PDFNumber.of(jpg.length));
      dict.delete(lib.PDFName.of('DecodeParms'));
      dict.delete(lib.PDFName.of('Decode'));
      pdf.context.assign(ref, lib.PDFRawStream.of(dict, jpg));
      done++;
      if (i % 3 === 0) await nextFrame();
    }
    task.title(t('saving'));
    task.set(null);
    const out = await pdf.save({ useObjectStreams: true });
    task.close();
    const smaller = out.length < bytes.length * 0.98;
    const blob = pdfBlob(smaller ? out : bytes);
    const name = `${baseName(file.name)}-compressed.pdf`;
    const saved = 1 - blob.size / bytes.length;
    $('#cp-result').replaceChildren(el('div', { class: 'result' },
      smaller ? el('div', { class: 'result-head' }, icon('circleCheck'), t('done', `${Math.round(saved * 100)}%`)) : alertBox(t('notSmaller'), 'info'),
      el('div', { class: 'compare' }, stat(t('before'), fmtBytes(bytes.length)), stat(t('after'), fmtBytes(blob.size), smaller), stat(t('saved'), smaller ? `${Math.round(saved * 100)}%` : '—', smaller)),
      el('p', { class: 'note', text: done ? t('images', done) : t('noImages') }),
      el('div', { class: 'actions' },
        smaller ? el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('download')) : null,
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
  } catch (e) {
    task.close();
    $('#cp-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#cp-go').disabled = false;
  }
});
