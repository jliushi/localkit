// ffmpeg.wasm (single-threaded core), loaded on first use from this site.
import { LK } from './lib.js';

let ffmpegPromise = null;

export function getFFmpeg() {
  ffmpegPromise ||= (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const ff = new FFmpeg();
    await ff.load({
      classWorkerURL: `${location.origin}${LK.base}/assets/js/ffmpeg-worker.js`,
      coreURL: `${location.origin}${LK.base}/vendor/ffmpeg/ffmpeg-core.js`,
      wasmURL: `${location.origin}${LK.base}/vendor/ffmpeg/ffmpeg-core.wasm`,
    });
    return ff;
  })();
  ffmpegPromise.catch(() => { ffmpegPromise = null; });
  return ffmpegPromise;
}

/** Media duration in seconds from the browser's own decoder (null if it can't tell). */
export function mediaDuration(file) {
  return new Promise((resolve) => {
    const v = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');
    v.preload = 'metadata';
    v.src = URL.createObjectURL(file);
    const done = (d) => { URL.revokeObjectURL(v.src); resolve(Number.isFinite(d) ? d : null); };
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done(null);
    setTimeout(() => done(null), 8000);
  });
}

/**
 * Runs ffmpeg on `file` (mounted read-only, not copied) and returns the output as a Blob.
 * args: ffmpeg arguments with "{in}" for the input path; output goes to `outName`.
 * onProgress(0..1) uses the "time=" log lines against `duration`.
 * extraFiles: [{ name, data: Uint8Array }] written to the working directory first (e.g. overlay images).
 */
export async function run(file, args, outName, mime, { duration, onProgress, onLog, extraFiles = [] } = {}) {
  const ff = await getFFmpeg();
  const dir = `/in${Date.now()}`;
  await ff.createDir(dir);
  await ff.mount('WORKERFS', { files: [file] }, dir);
  const logs = [];
  const onLogEvent = ({ message }) => {
    logs.push(message);
    if (logs.length > 200) logs.shift();
    onLog?.(message);
    const m = message.match(/time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m && duration && onProgress) onProgress(Math.min(1, (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) / duration));
  };
  ff.on('log', onLogEvent);
  for (const f of extraFiles) await ff.writeFile(f.name, f.data);
  try {
    const full = args.map((a) => (a === '{in}' ? `${dir}/${file.name}` : a));
    const code = await ff.exec([...full, outName]);
    if (code !== 0) {
      const tail = logs.filter((l) => /error|invalid|not|unknown|failed/i.test(l)).slice(-3).join(' · ');
      throw new Error(tail || `ffmpeg exited with code ${code}`);
    }
    const data = await ff.readFile(outName);
    await ff.deleteFile(outName);
    return new Blob([data.buffer], { type: mime });
  } finally {
    ff.off('log', onLogEvent);
    await ff.unmount(dir).catch(() => {});
    await ff.deleteDir(dir).catch(() => {});
    for (const f of extraFiles) await ff.deleteFile(f.name).catch(() => {});
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
  const parts = String(text).trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}
