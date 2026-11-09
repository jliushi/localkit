// Media engine: Mediabunny (WebCodecs, hardware accelerated) with ffmpeg.wasm as a fallback
// for containers Mediabunny can't read (AVI, FLV, WMV…).
import {
  Input, Output, Conversion, BlobSource, BufferTarget, ALL_FORMATS, CanvasSink,
  Mp4OutputFormat, WebMOutputFormat, MovOutputFormat, MkvOutputFormat, Mp3OutputFormat, WavOutputFormat, AdtsOutputFormat, OggOutputFormat,
  canEncodeAudio, canEncodeVideo, ConversionCanceledError,
} from 'mediabunny';

export { ConversionCanceledError };

export class UnsupportedMediaError extends Error {}

/**
 * Opens a media file. Returns { input, duration, video, audio, info } or throws UnsupportedMediaError
 * when the container can't be read in the browser (callers can then fall back to ffmpeg.wasm).
 */
export async function openMedia(file) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  let format;
  try {
    format = await input.getFormat();
  } catch {
    throw new UnsupportedMediaError(file.name);
  }
  const [video, audio] = await Promise.all([input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack()]);
  if (!video && !audio) throw new UnsupportedMediaError(file.name);
  const duration = await input.computeDuration();
  const info = { format: format.name, duration, size: file.size, bitrate: duration ? (file.size * 8) / duration : null };
  if (video) {
    info.width = video.displayWidth;
    info.height = video.displayHeight;
    info.videoCodec = video.codec;
    info.canDecodeVideo = await video.canDecode();
    try {
      const stats = await video.computePacketStats(120);
      info.fps = stats.averagePacketRate || null;
      info.videoBitrate = stats.averageBitrate || null;
    } catch { /* stats are optional */ }
  }
  if (audio) {
    info.audioCodec = audio.codec;
    info.channels = audio.numberOfChannels;
    info.sampleRate = audio.sampleRate;
    info.canDecodeAudio = await audio.canDecode();
  }
  return { input, video, audio, duration, info };
}

/** Frames at evenly spaced times as canvases of the given height (for filmstrips / thumbnails). */
export async function frames(media, count, height = 64, from = 0, to = media.duration) {
  if (!media.video || !media.info.canDecodeVideo) return [];
  const sink = new CanvasSink(media.video, { height, fit: 'contain', poolSize: 0 });
  const span = Math.max(0.001, to - from);
  const times = Array.from({ length: count }, (_, i) => from + (span * (i + 0.5)) / count);
  const out = [];
  for await (const w of sink.canvasesAtTimestamps(times)) {
    if (w) out.push(w.canvas);
  }
  return out;
}

let mp3Ready = null;
async function ensureMp3Encoder() {
  if (await canEncodeAudio('mp3')) return;
  mp3Ready ||= import('@mediabunny/mp3-encoder').then((m) => m.registerMp3Encoder());
  await mp3Ready;
}

const FORMATS = {
  mp4: () => new Mp4OutputFormat({ fastStart: 'in-memory' }),
  mov: () => new MovOutputFormat({ fastStart: 'in-memory' }),
  webm: () => new WebMOutputFormat(),
  mkv: () => new MkvOutputFormat(),
  mp3: () => new Mp3OutputFormat(),
  wav: () => new WavOutputFormat(),
  m4a: () => new Mp4OutputFormat({ fastStart: 'in-memory' }),
  aac: () => new AdtsOutputFormat(),
  ogg: () => new OggOutputFormat(),
};
export const MIME = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg' };

/** Best video codec for a container that the browser can actually encode. */
export async function pickVideoCodec(container, width, height) {
  const order = { mp4: ['avc', 'hevc', 'vp9', 'av1'], mov: ['avc', 'hevc'], webm: ['vp9', 'vp8', 'av1'], mkv: ['avc', 'vp9', 'hevc', 'av1', 'vp8'] }[container] || ['avc'];
  for (const codec of order) if (await canEncodeVideo(codec, { width: width || 1280, height: height || 720 })) return codec;
  return null;
}

/**
 * Converts a file with Mediabunny. Returns a Blob.
 * opts: { container, video?: ConversionVideoOptions | { discard: true }, audio?: ConversionAudioOptions, trim?, onProgress(p), signal }
 */
export async function convert(file, { container, video, audio, trim, onProgress, signal }) {
  signal?.throwIfAborted();
  if (container === 'mp3' || audio?.codec === 'mp3') await ensureMp3Encoder();
  signal?.throwIfAborted();
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const output = new Output({ format: FORMATS[container](), target: new BufferTarget() });
  let conversion;
  const abort = () => { conversion?.cancel().catch(() => {}); };
  try {
    conversion = await Conversion.init({ input, output, video, audio, trim, tracks: 'primary' });
    signal?.throwIfAborted();
    if (!conversion.isValid) {
      const reasons = conversion.discardedTracks.map((track) => `${track.track.type}: ${track.reason}`).join(', ');
      throw new Error(reasons || 'This file cannot be converted in this browser.');
    }
    if (onProgress) conversion.onProgress = onProgress;
    signal?.addEventListener('abort', abort, { once: true });
    await conversion.execute();
    signal?.throwIfAborted();
    return {
      blob: new Blob([output.target.buffer], { type: MIME[container] }),
      discarded: conversion.discardedTracks,
    };
  } catch (error) {
    await conversion?.cancel().catch(() => {});
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    input.dispose();
  }
}

/** True when the browser has the WebCodecs APIs the Mediabunny path needs. */
export const hasWebCodecs = () => typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
