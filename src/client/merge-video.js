import { $, t, c, el, LK, icon, filePicker, progress, alertBox, errorText, download, fmtDuration, fmtBytes } from './lib.js';
import { hasWebCodecs } from './media.js';
import { VIDEO_ACCEPT, SAMPLE_VIDEO } from './video-ui.js';
import { sortable, move, tbtn } from './pdf-common.js';
import {
  Input, Output, Mp4OutputFormat, BufferTarget, ALL_FORMATS, BlobSource,
  VideoSampleSink, AudioSampleSink, AudioSampleSource, VideoSampleSource, AudioSample, VideoSample,
  Quality, canEncodeVideo, canEncodeAudio,
} from 'mediabunny';

// items: { file, url, media, video, audio, duration, width, height, thumb, error }
const items = [];
const list = $('#mv-list');
let running = false;
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const pick = filePicker($('#mv-pick'), {
  accept: VIDEO_ACCEPT, multiple: true, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: add,
});
filePicker($('#mv-more'), { accept: VIDEO_ACCEPT, multiple: true, compact: true, iconName: 'plus', title: t('add'), onFiles: add });

const ready = () => items.filter((x) => x.duration != null && !x.error);

function render() {
  list.replaceChildren(...items.map((it, i) => el('li', { draggable: 'true' },
    el('span', { class: 'handle', 'aria-hidden': 'true' }, icon('grip')),
    it.thumb || el('span', { class: 'spinner' }),
    el('span', { class: 'name', text: it.file.name, title: it.file.name }),
    el('span', { class: 'meta', text: it.error ? it.error : it.duration == null ? t('reading') : t('clipMeta', fmtDuration(it.duration), it.width, it.height) }),
    el('span', { class: 'pg-tools' },
      tbtn('arrowUp', t('up'), () => { move(items, i, i - 1); render(); }, i === 0 || running),
      tbtn('arrowDown', t('down'), () => { move(items, i, i + 1); render(); }, i === items.length - 1 || running),
      tbtn('x', c('remove'), () => remove(i), running)))));
  const ok = ready();
  $('#mv-total').textContent = ok.length ? t('total', ok.length, fmtDuration(ok.reduce((a, x) => a + x.duration, 0))) : '';
  $('#mv-go').disabled = running || ok.length < 2;
  $('#mv-pick').hidden = items.length > 0;
  $('#mv-work').hidden = items.length === 0;
}

sortable(list, (from, to) => { move(items, from, to); render(); });

function remove(i) {
  URL.revokeObjectURL(items[i].url);
  items.splice(i, 1);
  render();
}

async function add(files) {
  $('#mv-result').replaceChildren();
  $('#mv-alert').replaceChildren();
  if (!hasWebCodecs()) { $('#mv-alert').replaceChildren(alertBox(t('noWebCodecs'))); return; }
  const fresh = files.map((file) => ({ file, url: URL.createObjectURL(file), media: null, video: null, audio: null, duration: null, width: 0, height: 0, thumb: null, error: null }));
  items.push(...fresh);
  render();
  for (const it of fresh) {
    try {
      const media = await openClip(it.file);
      Object.assign(it, media);
      it.thumb = await thumbOf(it);
    } catch (e) {
      it.error = e?.message || String(e);
    }
    render();
  }
  if (ready().length === 1) $('#mv-alert').replaceChildren(alertBox(t('needTwo'), 'info'));
}

/** Opens a clip and reads the info the list needs. Throws when there is no decodable video track. */
async function openClip(file) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const video = await input.getPrimaryVideoTrack();
  if (!video || !(await video.canDecode())) throw new Error(t('noVideo'));
  const audioTrack = await input.getPrimaryAudioTrack();
  const duration = await input.computeDuration([video, audioTrack].filter(Boolean));
  return {
    media: input, video, audio: audioTrack && (await audioTrack.canDecode()) ? audioTrack : null,
    duration, width: video.displayWidth, height: video.displayHeight,
  };
}

async function thumbOf(it) {
  try {
    const sink = new VideoSampleSink(it.video);
    const sample = await sink.getSample(Math.min(0.5, it.duration / 2));
    if (!sample) return null;
    const k = 72 / Math.max(sample.displayWidth, sample.displayHeight);
    const cv = document.createElement('canvas');
    cv.width = Math.max(2, Math.round(sample.displayWidth * k));
    cv.height = Math.max(2, Math.round(sample.displayHeight * k));
    sample.draw(cv.getContext('2d'), 0, 0, cv.width, cv.height);
    sample.close();
    return cv;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- merge

const even = (n) => Math.max(2, Math.round(n / 2) * 2);
const OUT_RATE = 48000;

async function pickCodecs(width, height) {
  const video = (await canEncodeVideo('avc', { width, height })) ? 'avc'
    : (await canEncodeVideo('vp9', { width, height })) ? 'vp9'
      : (await canEncodeVideo('av1', { width, height })) ? 'av1' : null;
  if (!video) throw new Error(t('noEncoder'));
  const audio = (await canEncodeAudio('aac', { numberOfChannels: 2, sampleRate: OUT_RATE })) ? 'aac'
    : (await canEncodeAudio('opus')) ? 'opus' : null;
  return { video, audio };
}

async function merge() {
  const clips = ready();
  if (clips.length < 2 || running) return;
  running = true;
  $('#mv-go').disabled = true;
  $('#mv-alert').replaceChildren();
  $('#mv-result').replaceChildren();

  let canceled = false;
  const task = progress($('#mv-task'), { title: t('merging'), onCancel: () => { canceled = true; } });

  try {
    const preset = $('#mv-size').value;
    let width, height;
    if (preset === 'first') { width = even(clips[0].width); height = even(clips[0].height); }
    else { [width, height] = preset.split('x').map(Number); }

    const codec = await pickCodecs(width, height);
    const totalDuration = clips.reduce((a, x) => a + x.duration, 0);
    const state = { canceled: () => canceled, width, height, written: 0, totalDuration, task, ticks: 0 };

    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const videoSource = new VideoSampleSource({ codec: codec.video, quality: new Quality('high'), keyFrameInterval: 2 });
    output.addVideoTrack(videoSource, { rotation: 0 });
    const audioSource = codec.audio ? new AudioSampleSource({ codec: codec.audio, quality: new Quality('high') }) : null;
    if (audioSource) output.addAudioTrack(audioSource);
    await output.start();

    let start = 0;
    for (const clip of clips) {
      checkCancel(state);
      task.text(clip.file.name);
      await appendClip(clip, start, state, { videoSource, audioSource });
      start += clip.duration;
    }

    task.set(1);
    await output.finalize();
    task.close();

    const blob = new Blob([output.target.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    $('#mv-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', clips.length, fmtDuration(totalDuration))),
      el('div', { class: 'note', text: `${width} × ${height} · ${fmtBytes(blob.size)}` }),
      el('video', { src: url, controls: true, playsinline: true, preload: 'metadata' }),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, t('outName')) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: startOver }, c('startOver')))));
    $('#mv-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    if (canceled || e?.message === CANCEL) $('#mv-alert').replaceChildren(alertBox(t('canceledNote'), 'info'));
    else $('#mv-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    running = false;
    render();
  }
}

function startOver() {
  items.forEach((it) => URL.revokeObjectURL(it.url));
  items.length = 0;
  $('#mv-result').replaceChildren();
  render();
  pick.open();
}

const CANCEL = '__merge_canceled__';
function checkCancel(state) { if (state.canceled()) throw new Error(CANCEL); }

async function report(state, seconds) {
  state.written += seconds;
  state.ticks++;
  if (!(state.ticks % 30)) {
    state.task.set(Math.min(0.99, state.written / state.totalDuration));
    await nextFrame();
  }
}

/**
 * Decodes one clip and writes its video + audio into the output starting at `start` seconds.
 * Video: every decoded frame, scaled to fit the output frame (black bars, never stretched),
 * then the last frame is held if the video track is shorter than the clip duration.
 * Audio: the clip's samples are resampled to 48 kHz stereo via OfflineAudioContext, or a silent
 * segment is written when the clip has no (decodable) audio track.
 */
async function appendClip(clip, start, state, { videoSource, audioSource }) {
  const { width, height } = state;
  const dur = clip.duration;

  // ---- video
  const sink = new VideoSampleSink(clip.video);
  let lastSample = null, lastStamp = -1;
  for await (const sample of sink.samples()) {
    checkCancel(state);
    if (sample.timestamp >= dur - 1e-6) { sample.close(); break; }
    const scaled = await scaleFrame(sample, width, height);
    scaled.setTimestamp(start + sample.timestamp);
    await videoSource.add(scaled);
    scaled.close();
    lastSample?.close();
    lastSample = sample.clone();
    lastStamp = sample.timestamp;
    await report(state, sample.duration);
    sample.close();
  }
  // Hold the last frame to the full clip duration (tracks often end slightly early).
  if (lastSample && lastStamp < dur - 1 / 60) {
    const scaled = await scaleFrame(lastSample, width, height);
    let stamp = lastStamp + 1 / 30;
    while (stamp < dur - 1e-6) {
      checkCancel(state);
      const held = scaled.clone();
      held.setTimestamp(start + stamp);
      held.setDuration(Math.min(1 / 30, dur - stamp));
      await videoSource.add(held);
      held.close();
      await report(state, Math.min(1 / 30, dur - stamp));
      stamp += 1 / 30;
    }
    scaled.close();
  }
  lastSample?.close();

  // ---- audio: whole-clip resample to 48 kHz stereo, silence when there is no audio.
  if (audioSource) {
    const buffer = await audioFor(clip, dur, state);
    const segments = buffer ? splitBuffer(buffer, start) : silence(start, dur);
    for (const s of segments) {
      checkCancel(state);
      await audioSource.add(s);
      s.close();
    }
    await report(state, dur);
  }
}

/** Resamples a clip's audio to a 48 kHz stereo AudioBuffer covering exactly [0, dur). */
async function audioFor(clip, dur, state) {
  if (!clip.audio) return null;
  const samples = [];
  const sink = new AudioSampleSink(clip.audio);
  for await (const s of sink.samples()) {
    checkCancel(state);
    if (s.timestamp >= dur + 1) { s.close(); break; }
    samples.push(s);
  }
  if (!samples.length) return null;
  const frames = Math.max(1, Math.ceil((dur + 0.05) * OUT_RATE));
  const offline = new OfflineAudioContext(2, frames, OUT_RATE);
  for (const s of samples) {
    try {
      const buf = s.toAudioBuffer();
      const src = offline.createBufferSource();
      src.buffer = buf;
      src.connect(offline.destination);
      src.start(Math.min(Math.max(0, s.timestamp), Math.max(0, dur - 1e-4)));
    } catch { /* sample in a format the Web Audio API can't take */ }
    s.close();
  }
  try {
    return await offline.startRendering();
  } catch {
    return null;
  }
}

/** One AudioBuffer → f32-interleaved stereo AudioSamples at the output rate, starting at `start`. */
function splitBuffer(buffer, start) {
  const n = buffer.length;
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  const out = [];
  const CHUNK = OUT_RATE * 10;
  for (let off = 0; off < n; off += CHUNK) {
    const len = Math.min(CHUNK, n - off);
    const data = new Float32Array(len * 2);
    for (let i = 0; i < len; i++) {
      data[i * 2] = left[off + i];
      data[i * 2 + 1] = right[off + i];
    }
    out.push(new AudioSample({ data, format: 'f32', numberOfChannels: 2, sampleRate: OUT_RATE, timestamp: start + off / OUT_RATE }));
  }
  return out;
}

/** Silent stereo samples covering [start, start + dur). */
function silence(start, dur) {
  const frames = Math.floor(dur * OUT_RATE);
  const CHUNK = OUT_RATE * 10;
  const out = [];
  for (let off = 0; off < frames; off += CHUNK) {
    const len = Math.min(CHUNK, frames - off);
    out.push(new AudioSample({ data: new Float32Array(len * 2), format: 'f32', numberOfChannels: 2, sampleRate: OUT_RATE, timestamp: start + off / OUT_RATE }));
  }
  return out;
}

/** Scales a decoded frame to fit the output frame; returns a sample of exactly (width, height). */
async function scaleFrame(sample, width, height) {
  const sw = sample.displayWidth, sh = sample.displayHeight;
  if (sw === width && sh === height) return sample.clone();
  const k = Math.min(width / sw, height / sh);
  const dw = Math.max(2, Math.round(sw * k)), dh = Math.max(2, Math.round(sh * k));
  let scaled = await sample.transform({ width: dw, height: dh, fit: 'contain' });
  if (dw === width && dh === height) return scaled;
  // Compose onto a black canvas to get the exact output size (letterbox/pillarbox bars).
  const cv = new OffscreenCanvas(width, height);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  scaled.drawWithFit(ctx, { fit: 'contain' });
  scaled.close();
  return new VideoSample(cv, { timestamp: sample.timestamp, duration: sample.duration ?? 0 });
}

$('#mv-go').addEventListener('click', merge);
