// Helpers shared by the video/audio tool pages.
import { el, icon, fmtBytes, fmtDuration } from './lib.js';
import { openMedia, frames, UnsupportedMediaError, hasWebCodecs } from './media.js';

export const VIDEO_ACCEPT = 'video/*,.mp4,.mov,.m4v,.mkv,.webm,.avi,.flv,.wmv,.3gp,.ts,.mts,.m2ts,.ogv,.mpg,.mpeg';
export const MEDIA_ACCEPT = `${VIDEO_ACCEPT},audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.opus,.wma,.amr`;

export const SAMPLE_VIDEO = (base) => ({ url: `${base}/assets/samples/sample.mp4`, name: 'sample.mp4', type: 'video/mp4' });

/** Metadata from the browser's own <video> element (used for files Mediabunny can't parse). */
function elementInfo(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.src = URL.createObjectURL(file);
    const done = (info) => { resolve(info); };
    v.onloadedmetadata = () => done({ duration: v.duration, width: v.videoWidth, height: v.videoHeight, size: file.size, bitrate: (file.size * 8) / v.duration, playable: true, url: v.src });
    v.onerror = () => done({ duration: null, width: 0, height: 0, size: file.size, playable: false, url: v.src });
    setTimeout(() => done({ duration: null, width: 0, height: 0, size: file.size, playable: false, url: v.src }), 10000);
  });
}

/**
 * Opens a video/audio file for a tool. Returns
 * { file, media|null, info, legacy (needs ffmpeg.wasm), url (object URL for <video>) }.
 */
export async function prepare(file) {
  if (hasWebCodecs()) {
    try {
      const media = await openMedia(file);
      const decodable = media.video ? media.info.canDecodeVideo : media.info.canDecodeAudio;
      if (decodable) return { file, media, info: media.info, legacy: false, url: URL.createObjectURL(file) };
    } catch (e) {
      if (!(e instanceof UnsupportedMediaError)) console.warn(e);
    }
  }
  const info = await elementInfo(file);
  return { file, media: null, info, legacy: true, url: info.url };
}

export function metaLine(info) {
  const parts = [];
  if (info.duration) parts.push(fmtDuration(info.duration));
  if (info.width) parts.push(`${info.width}×${info.height}`);
  parts.push(fmtBytes(info.size));
  return parts.join(' · ');
}

export async function thumbnail(job) {
  if (job.media?.video) {
    try {
      const [cv] = await frames(job.media, 1, 120, 0, Math.min(job.info.duration || 1, 2));
      if (cv) return cv;
    } catch { /* fall through */ }
  }
  return job.media?.video || job.info.width ? icon('fileVideo') : icon('music');
}

export const kbps = (bps) => `${Math.round(bps / 1000).toLocaleString()} kbps`;

/** Even dimension ≤ target height keeping aspect ratio. */
export function scaledSize(w, h, maxH) {
  if (!maxH || h <= maxH) return [w, h];
  const k = maxH / h;
  return [Math.round((w * k) / 2) * 2, maxH];
}

export function playerFor(url) {
  return el('video', { src: url, controls: true, playsinline: true, preload: 'metadata' });
}
