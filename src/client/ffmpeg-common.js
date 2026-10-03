// ffmpeg.wasm (single-threaded core), loaded on first use from this site.
import { LK, abortable } from './lib.js';

let ffmpegPromise = null;
let instance = null;
let running = false;
let generation = 0;

export function cancelFFmpeg() {
  generation++;
  instance?.terminate();
  instance = null;
  ffmpegPromise = null;
}

export function getFFmpeg() {
  ffmpegPromise ||= (async () => {
    const token = generation;
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    if (token !== generation) throw new DOMException('Cancelled', 'AbortError');
    const ff = new FFmpeg();
    instance = ff;
    await ff.load({
      classWorkerURL: `${location.origin}${LK.base}/assets/js/ffmpeg-worker.js`,
      coreURL: `${location.origin}${LK.base}/vendor/ffmpeg/ffmpeg-core.js`,
      wasmURL: `${location.origin}${LK.base}/vendor/ffmpeg/ffmpeg-core.wasm`,
    });
    return ff;
  })();
  const pending = ffmpegPromise;
  pending.catch(() => { if (ffmpegPromise === pending) ffmpegPromise = null; });
  return ffmpegPromise;
}

/** Media duration in seconds from the browser's own decoder (null if it can't tell). */
export function mediaDuration(file) {
  return new Promise((resolve) => {
    const v = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');
    v.preload = 'metadata';
    let finished = false;
    const src = URL.createObjectURL(file);
    const done = (d) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      URL.revokeObjectURL(src);
      v.removeAttribute('src');
      v.load();
      resolve(Number.isFinite(d) ? d : null);
    };
    const timer = setTimeout(() => done(null), 8000);
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done(null);
    v.src = src;
  });
}

/**
 * Runs ffmpeg on `file` (mounted read-only, not copied) and returns the output as a Blob.
 * args: ffmpeg arguments with "{in}" for the input path; output goes to `outName`.
 * onProgress(0..1) uses the "time=" log lines against `duration`.
 * extraFiles: [{ name, data: Uint8Array }] written to the working directory first (e.g. overlay images).
 */
export async function run(file, args, outName, mime, { duration, onProgress, onLog, extraFiles = [], signal = new AbortController().signal } = {}) {
  if (running) throw new Error('A media task is already running.');
  signal.throwIfAborted();
  running = true;
  let ff;
  const cancel = () => cancelFFmpeg();
  signal.addEventListener('abort', cancel, { once: true });
  const dir = `/in${Date.now()}`;
  const logs = [];
  const onLogEvent = ({ message }) => {
    logs.push(message);
    if (logs.length > 200) logs.shift();
    onLog?.(message);
    const m = message.match(/time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m && duration && onProgress) onProgress(Math.min(1, (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) / duration));
  };
  try {
    ff = await abortable(getFFmpeg(), signal);
    signal.throwIfAborted();
    await ff.createDir(dir);
    await ff.mount('WORKERFS', { files: [file] }, dir);
    ff.on('log', onLogEvent);
    for (const f of extraFiles) await ff.writeFile(f.name, f.data);
    const full = args.map((a) => (a === '{in}' ? `${dir}/${file.name}` : a));
    const code = await ff.exec(['-y', ...full, outName]);
    signal.throwIfAborted();
    if (code !== 0) {
      const tail = logs.filter((l) => /error|invalid|not|unknown|failed/i.test(l)).slice(-3).join(' · ');
      throw new Error(tail || `ffmpeg exited with code ${code}`);
    }
    const data = await ff.readFile(outName);
    if (!data.length) throw new Error('The media engine produced an empty file.');
    return new Blob([data], { type: mime });
  } catch (err) {
    signal.throwIfAborted();
    throw err;
  } finally {
    signal.removeEventListener('abort', cancel);
    if (ff) {
      ff.off('log', onLogEvent);
      if (ff.loaded) {
        await ff.deleteFile(outName).catch(() => {});
        await ff.unmount(dir).catch(() => {});
        await ff.deleteDir(dir).catch(() => {});
        for (const f of extraFiles) await ff.deleteFile(f.name).catch(() => {});
      }
    }
    running = false;
  }
}

export const fmtTime = (s) => {
  if (s == null || !Number.isFinite(s)) return '--:--';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const ss = sec.toFixed(1).padStart(4, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
};

/** Parses "1:02.5", "62.5" or "00:01:02" into seconds. */
export function parseTime(text) {
  const value = String(text).trim();
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(value)) return null;
  const parts = value.split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n) || n < 0) || parts.slice(1).some((n) => n >= 60)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}
