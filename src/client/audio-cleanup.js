// PCM decoding and timestamp-safe output shared by silence removal and voice cleanup.
import { AudioSampleSink, AudioSample, AudioSampleSource, VideoSampleSink, VideoSampleSource,
  EncodedPacketSink, EncodedVideoPacketSource, Output, BufferTarget, Mp4OutputFormat,
  WebMOutputFormat, WavOutputFormat, Mp3OutputFormat, Quality, canEncodeAudio } from 'mediabunny';
import { pickVideoCodec } from './media.js';

export const RATE = 48000;
export const check = (signal) => signal?.throwIfAborted();
export const breathe = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Keep timestamps, including leading gaps; Web Audio does band-limited resampling. */
export async function decodePcm(media, { signal, onProgress = () => {} } = {}) {
  check(signal);
  if (!media.audio || !await media.audio.canDecode()) throw new Error('noAudio');
  const channels = Math.min(2, media.audio.numberOfChannels);
  const length = Math.max(1, Math.round(media.duration * RATE));
  if (length * channels * 4 > 512 * 1024 * 1024) throw new Error('tooLarge');
  const context = new OfflineAudioContext(channels, length, RATE);
  let count = 0;
  for await (const sample of new AudioSampleSink(media.audio).samples()) {
    try {
      check(signal);
      const source = context.createBufferSource();
      source.buffer = sample.toAudioBuffer();
      source.connect(context.destination);
      if (sample.timestamp < media.duration && sample.timestamp + sample.duration > 0) {
        source.start(Math.max(0, sample.timestamp), Math.max(0, -sample.timestamp));
      }
      if (++count % 40 === 0) { onProgress(Math.min(.95, sample.timestamp / media.duration)); await breathe(); }
    } finally { sample.close(); }
  }
  check(signal);
  const buffer = await context.startRendering();
  check(signal);
  onProgress(1);
  return Array.from({ length: channels }, (_, ch) => buffer.getChannelData(ch));
}

export function loudness(pcm) {
  const size = 960; // 20 ms; channel energies are combined without phase cancellation.
  const db = new Float32Array(Math.ceil(pcm[0].length / size));
  for (let window = 0; window < db.length; window++) {
    const start = window * size, end = Math.min(pcm[0].length, start + size);
    let sum = 0;
    for (const channel of pcm) for (let i = start; i < end; i++) sum += channel[i] * channel[i];
    db[window] = Math.max(-100, 10 * Math.log10(Math.max(1e-10, sum / ((end - start) * pcm.length))));
  }
  const sorted = Float32Array.from(db).sort();
  const floor = sorted[Math.floor(sorted.length * .2)];
  const peak = sorted[Math.floor(sorted.length * .9)];
  return { db, step: size / RATE, auto: Math.round(Math.max(-60, Math.min(-24, floor + 10, peak - 12))) };
}

export function silenceCuts({ db, step }, duration, threshold, minimum, padding) {
  const removed = [];
  let start = -1;
  for (let i = 0; i <= db.length; i++) {
    const quiet = i < db.length && db[i] < threshold;
    if (quiet && start < 0) start = i * step;
    if (!quiet && start >= 0) {
      const end = Math.min(duration, i * step);
      const a = start === 0 ? 0 : start + padding;
      const b = end === duration ? duration : end - padding;
      if (end - start >= minimum && b > a) removed.push([a, b]);
      start = -1;
    }
  }
  const kept = [];
  let cursor = 0;
  for (const [a, b] of removed) { if (a > cursor) kept.push([cursor, a]); cursor = b; }
  if (cursor < duration) kept.push([cursor, duration]);
  return { removed, kept, removedDuration: removed.reduce((sum, [a, b]) => sum + b - a, 0) };
}

/** Concatenate exact PCM sample ranges; the same boundaries drive video timestamps. */
export function cutPcm(pcm, kept) {
  const ranges = kept.map(([a, b]) => [Math.round(a * RATE), Math.min(pcm[0].length, Math.round(b * RATE))]);
  const size = ranges.reduce((n, [a, b]) => n + b - a, 0);
  return pcm.map((channel) => {
    const out = new Float32Array(size);
    let cursor = 0;
    for (const [a, b] of ranges) { out.set(channel.subarray(a, b), cursor); cursor += b - a; }
    return out;
  });
}

export async function exportPcm(media, pcm, { format = 'wav', kept, signal, onProgress = () => {} } = {}) {
  check(signal);
  const isVideo = format === 'video';
  const copy = isVideo && !kept;
  const webm = copy && media.video.codec === 'vp8';
  const extension = isVideo ? (webm ? 'webm' : 'mp4') : format;
  const mime = { wav: 'audio/wav', mp3: 'audio/mpeg', mp4: 'video/mp4', webm: 'video/webm' }[extension];
  if (format === 'mp3' && !await canEncodeAudio('mp3')) (await import('@mediabunny/mp3-encoder')).registerMp3Encoder();
  let audioCodec = isVideo ? (webm ? 'opus' : 'aac') : format === 'mp3' ? 'mp3' : 'pcm-s16';
  if (audioCodec === 'aac' && !await canEncodeAudio('aac', { sampleRate: RATE, numberOfChannels: pcm.length })) audioCodec = 'opus';
  const output = new Output({ target: new BufferTarget(), format: extension === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' })
    : extension === 'webm' ? new WebMOutputFormat() : extension === 'mp3' ? new Mp3OutputFormat() : new WavOutputFormat() });
  const audio = new AudioSampleSource({ codec: audioCodec, quality: new Quality({ bitrate: 192000 }) });
  output.addAudioTrack(audio);
  let video;
  if (isVideo) {
    if (copy) video = new EncodedVideoPacketSource(media.video.codec);
    else {
      const codec = await pickVideoCodec('mp4', media.video.displayWidth, media.video.displayHeight);
      if (!codec) throw new Error('noEncoder');
      video = new VideoSampleSource({ codec, quality: new Quality('high'), keyFrameInterval: 2 });
    }
    output.addVideoTrack(video, { rotation: copy ? media.video.rotation : 0 });
  }
  const abort = () => { output.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    check(signal);
    await output.start();
    if (copy) {
      const decoderConfig = await media.video.getDecoderConfig();
      for await (const packet of new EncodedPacketSink(media.video).packets()) {
        check(signal);
        await video.add(packet, { decoderConfig });
        onProgress(.45 * Math.max(0, packet.timestamp) / media.duration);
      }
    } else if (isVideo) {
      let offset = 0;
      const total = kept.reduce((n, [a, b]) => n + b - a, 0);
      for (const [start, end] of kept) {
        for await (const frame of new VideoSampleSink(media.video).samples(start, end)) {
          try {
            check(signal);
            const a = Math.max(start, frame.timestamp), b = Math.min(end, frame.timestamp + frame.duration);
            if (b <= a) continue;
            frame.setTimestamp(offset + a - start);
            frame.setDuration(b - a);
            await video.add(frame);
            onProgress(.65 * (offset + b - start) / total);
          } finally { frame.close(); }
        }
        offset += end - start;
      }
    }
    video?.close();
    const base = isVideo ? (copy ? .45 : .65) : 0;
    for (let offset = 0; offset < pcm[0].length; offset += RATE) {
      check(signal);
      const len = Math.min(RATE, pcm[0].length - offset);
      const interleaved = new Float32Array(len * pcm.length);
      for (let ch = 0; ch < pcm.length; ch++) for (let i = 0; i < len; i++) interleaved[i * pcm.length + ch] = pcm[ch][offset + i];
      const sample = new AudioSample({ data: interleaved, format: 'f32', numberOfChannels: pcm.length, sampleRate: RATE, timestamp: offset / RATE });
      try { await audio.add(sample); } finally { sample.close(); }
      onProgress(base + (1 - base) * (offset + len) / pcm[0].length);
      await breathe();
    }
    audio.close();
    check(signal);
    await output.finalize();
    return { blob: new Blob([output.target.buffer], { type: mime }), extension };
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  } finally { signal?.removeEventListener('abort', abort); }
}

export function drawLoudness(canvas, analysis, duration, removed = []) {
  const ctx = canvas.getContext('2d');
  const width = 1200, height = 160;
  canvas.width = width; canvas.height = height;
  ctx.fillStyle = '#f7f5fb'; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#eac5cf';
  for (const [a, b] of removed) ctx.fillRect(a / duration * width, 0, (b - a) / duration * width, height);
  ctx.fillStyle = '#7c3aed';
  for (let x = 0; x < width; x += 3) {
    const from = Math.floor(x / width * analysis.db.length), to = Math.max(from + 1, Math.ceil((x + 3) / width * analysis.db.length));
    let db = -100;
    for (let i = from; i < to; i++) db = Math.max(db, analysis.db[i] ?? -100);
    const h = Math.max(2, (db + 75) / 75 * (height - 16));
    ctx.fillRect(x, (height - h) / 2, 2, h);
  }
}
