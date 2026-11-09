// Image decoding/encoding helpers shared by the image and PDF tools.
import { el, extOf } from './lib.js';

export const IMAGE_ACCEPT = 'image/*,.heic,.heif,.avif,.jfif,.webp,.bmp,.svg';

export const isHeic = (f) => /^(heic|heif)$/.test(extOf(f.name)) || /image\/hei[cf]/.test(f.type);

/** Returns a decodable Blob (HEIC is converted to PNG first). */
export async function decodableBlob(file) {
  if (!isHeic(file)) return file;
  const { default: heic2any } = await import('heic2any');
  const out = await heic2any({ blob: file, toType: 'image/png' });
  return Array.isArray(out) ? out[0] : out;
}

/** Decodes any supported image to an ImageBitmap (or <img> for SVG), honouring EXIF orientation. */
export async function decodeImage(file) {
  const blob = await decodableBlob(file);
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    try { await img.decode(); } finally { URL.revokeObjectURL(img.src); }
    return img;
  }
}

const dims = (src) => [src.naturalWidth || src.width, src.naturalHeight || src.height];

/** Draws `src` rotated by `rot` degrees (0/90/180/270), scaled so the longest side ≤ max. */
export function drawRotated(src, rot = 0, max = Infinity, background) {
  const [sw, sh] = dims(src);
  const k = Math.min(1, max / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
  const swap = rot % 180 !== 0;
  const cv = el('canvas', { width: swap ? h : w, height: swap ? w : h });
  const ctx = cv.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, cv.width, cv.height); }
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(cv.width / 2, cv.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(src, -w / 2, -h / 2, w, h);
  return cv;
}

export const toBlob = (canvas, type, quality) => new Promise((resolve, reject) => canvas.toBlob((blob) => (blob?.type === type ? resolve(blob) : reject(new Error('This browser cannot encode the requested image format.'))), type, quality));

export const imageSize = dims;
