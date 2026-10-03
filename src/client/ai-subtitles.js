import { $, t, c, LK, el, dropzone, download, fmtBytes, baseName, status, beginTask, abortable, releaseUrls } from './lib.js';
import { run, fmtTime } from './ffmpeg-common.js';

const st = status($('#as-status'));
const bar = $('#as-progress');
const video = $('#as-video');
let file = null, isVideo = false, segments = [], trackUrl = null;

const setBar = (p) => { bar.hidden = false; bar.firstElementChild.style.width = `${(p * 100).toFixed(1)}%`; };

// ---------------------------------------------------------------- subtitle formats

const pad = (n, w = 2) => String(n).padStart(w, '0');
function stamp(sec, sep) {
  const ms = Math.round(sec * 1000);
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${sep}${pad(ms % 1000, 3)}`;
}
export const toSrt = (segs) => segs.map((s, i) => `${i + 1}\n${stamp(s.start, ',')} --> ${stamp(s.end, ',')}\n${s.text}\n`).join('\n');
export const toVtt = (segs) => `WEBVTT\n\n${segs.map((s) => `${stamp(s.start, '.')} --> ${stamp(s.end, '.')}\n${s.text}\n`).join('\n')}`;
const toTxt = (segs) => segs.map((s) => s.text).join('\n');

// ---------------------------------------------------------------- audio

/** Decodes the file's audio as 16 kHz mono Float32 samples (what Whisper expects). */
async function decodeAudio(f, signal) {
  if (f.size < 400 * 1024 * 1024) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      let buf;
      try { buf = await abortable(ctx.decodeAudioData(await f.arrayBuffer()), signal); }
      finally { await ctx.close(); }
      if (buf.numberOfChannels === 1) return buf.getChannelData(0);
      const out = new Float32Array(buf.length);
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) out[i] += d[i] / buf.numberOfChannels;
      }
      return out;
    } catch { /* fall through to ffmpeg for formats the browser can't decode (MKV, AVI, FLV…) */ }
  }
  signal.throwIfAborted();
  const blob = await run(f, ['-i', '{in}', '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le'], 'audio.raw', 'application/octet-stream', { signal });
  return new Float32Array(await blob.arrayBuffer());
}

/** Hugging Face, or its public mirror when huggingface.co is unreachable (e.g. in mainland China). */
async function modelHost(model, signal) {
  for (const host of ['https://huggingface.co/', 'https://hf-mirror.com/']) {
    try {
      const res = await fetch(`${host}${model}/resolve/main/config.json`, { signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]) });
      if (res.ok) return host;
    } catch { signal.throwIfAborted(); }
  }
  return 'https://huggingface.co/';
}

async function hasWebGpu() {
  try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch { return false; }
}

// ---------------------------------------------------------------- transcription

let worker = null;
function transcribe(audio, opts, signal) {
  worker ||= new Worker(`${LK.base}/assets/js/whisper.worker.js`, { type: 'module' });
  const activeWorker = worker;
  const stop = () => { activeWorker.terminate(); if (worker === activeWorker) worker = null; };
  signal.addEventListener('abort', stop, { once: true });
  return abortable(new Promise((resolve, reject) => {
    let live = '';
    worker.onmessage = ({ data }) => {
      if (data.type === 'download') { st.busy(t('downloading', fmtBytes(data.loaded), fmtBytes(data.total))); setBar(data.loaded / data.total); }
      else if (data.type === 'fallback') st.busy(t('fallback'));
      else if (data.type === 'ready') { st.busy(t('transcribing', '')); setBar(0.01); $('#as-info').dataset.engine = data.device; }
      else if (data.type === 'progress') { st.busy(t('transcribing', `${Math.round(data.value * 100)}%`)); setBar(data.value); }
      else if (data.type === 'partial') {
        live = (live + data.text).slice(-300);
        $('#as-live').hidden = false;
        $('#as-live').textContent = `${t('live')} …${live}`;
      } else if (data.type === 'result') resolve(data);
      else if (data.type === 'error') reject(new Error(data.message));
    };
    worker.onerror = (e) => reject(new Error(e.message || 'worker error'));
    worker.postMessage({ type: 'run', audio, ...opts }, [audio.buffer]);
  }), signal).finally(() => signal.removeEventListener('abort', stop));
}

async function toSimplified(segs) {
  if (!segs.some((s) => /[一-鿿]/.test(s.text))) return segs;
  const OpenCC = await import('opencc-js/t2cn');
  const conv = OpenCC.Converter({ from: 't', to: 'cn' });
  return segs.map((s) => ({ ...s, text: conv(s.text) }));
}

function cleanSegments(chunks, duration) {
  const out = [];
  for (const ch of chunks) {
    const text = (ch.text || '').trim();
    if (!text || /^\[.*\]$|^\(.*\)$/.test(text)) continue; // "[Music]", "(applause)" style noise markers
    let [start, end] = ch.timestamp || [0, null];
    start = Math.max(0, Number(start) || 0);
    if (start >= duration) continue;
    end = end == null ? Math.min(duration, start + 5) : Number(end);
    if (end <= start) end = start + Math.min(5, Math.max(1, text.length * 0.15));
    if (!Number.isFinite(end)) continue;
    out.push({ start, end: Math.min(duration, end), text });
  }
  out.sort((a, b) => a.start - b.start);
  // Never let two subtitles be on screen at once.
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].end > out[i + 1].start) out[i].end = out[i + 1].start;
  }
  return out.filter((s) => s.end > s.start);
}

// ---------------------------------------------------------------- UI

function updateTrack() {
  if (!isVideo) return;
  if (trackUrl) URL.revokeObjectURL(trackUrl);
  trackUrl = URL.createObjectURL(new Blob([toVtt(segments)], { type: 'text/vtt' }));
  video.querySelector('track')?.remove();
  const tr = el('track', { kind: 'subtitles', src: trackUrl, srclang: LK.lang, label: 'AI', default: true });
  video.append(tr);
  tr.track.mode = 'showing';
}

function renderSegments() {
  $('#as-segs').replaceChildren(...segments.map((s, i) => {
    const ta = el('textarea', { rows: 1, 'aria-label': `${fmtTime(s.start)}` }, s.text);
    ta.addEventListener('change', () => { segments[i].text = ta.value.trim(); updateTrack(); });
    return el('div', { class: 'seg-row', 'data-i': i },
      el('span', { class: 'time', text: `${fmtTime(s.start)} → ${fmtTime(s.end)}`, onclick: () => { if (isVideo || video.src) { video.currentTime = s.start + 0.01; video.play(); } } }),
      ta);
  }));
}

video.addEventListener('timeupdate', () => {
  const now = video.currentTime;
  for (const row of document.querySelectorAll('.seg-row')) {
    const s = segments[row.dataset.i];
    row.classList.toggle('active', !!s && now >= s.start && now < s.end);
  }
});

dropzone($('#as-drop'), {
  accept: 'video/*,audio/*,.mkv,.flv,.avi,.wmv,.m4a,.flac,.ogg,.opus,.amr,.mov',
  onFiles: ([f]) => {
    file = f;
    isVideo = f.type.startsWith('video') || /\.(mkv|flv|avi|wmv|mov|mp4|webm|m4v|3gp|ts)$/i.test(f.name);
    st.clear();
    $('#as-out').hidden = true;
    $('#as-live').hidden = true;
    segments = [];
    releaseUrls($('#as-burned'));
    $('#as-burned').replaceChildren();
    if (video.src.startsWith('blob:')) URL.revokeObjectURL(video.src);
    if (trackUrl) { URL.revokeObjectURL(trackUrl); trackUrl = null; }
    video.querySelector('track')?.remove();
    video.src = URL.createObjectURL(f);
    $('#as-preview').hidden = false;
    $('#as-info').textContent = `${f.name} · ${fmtBytes(f.size)}`;
    $('#as-go').disabled = false;
  },
});

$('#as-go').addEventListener('click', async () => {
  if (!file) return;
  const task = beginTask({ cancellable: true });
  const started = Date.now();
  $('#as-go').disabled = true;
  $('#as-out').hidden = true;
  $('#as-live').hidden = true;
  try {
    st.busy(t('decoding'));
    const audio = await decodeAudio(file, task.signal);
    const duration = audio.length / 16000;
    if (duration > 3 * 3600) throw new Error(t('tooLong'));
    const model = $('#as-model').value;
    st.busy(t('checkingHost'));
    const [host, gpu] = await abortable(Promise.all([modelHost(model, task.signal), $('#as-engine').value === 'auto' ? hasWebGpu() : false]), task.signal);
    st.busy(t('loadingModel'));
    const result = await transcribe(audio, {
      base: `${location.origin}${LK.base}`,
      host,
      model,
      device: gpu ? 'webgpu' : 'wasm',
      language: $('#as-lang').value,
      task: $('#as-task').value,
    }, task.signal);
    segments = cleanSegments(result.chunks, duration);
    if ($('#as-simp').checked && $('#as-task').value === 'transcribe') segments = await toSimplified(segments);
    task.signal.throwIfAborted();
    if (!segments.length) throw new Error(t('noSpeech'));
    renderSegments();
    updateTrack();
    $('#as-out').hidden = false;
    $('#as-burn-opts').hidden = !isVideo;
    $('#as-burn').hidden = !isVideo;
    st.ok(t('done', segments.length, fmtTime((Date.now() - started) / 1000)), ' ', el('span', { class: 'muted small', text: t('engineInfo', result.device === 'webgpu' ? 'WebGPU' : 'CPU (WebAssembly)') }));
  } catch (e) {
    st.error(e);
  } finally {
    $('#as-go').disabled = false;
    bar.hidden = true;
    task.finish();
  }
});

const name = (ext) => `${baseName(file.name)}.${ext}`;
$('#as-srt').addEventListener('click', () => download(new Blob([toSrt(segments)], { type: 'application/x-subrip' }), name('srt')));
$('#as-vtt').addEventListener('click', () => download(new Blob([toVtt(segments)], { type: 'text/vtt' }), name('vtt')));
$('#as-txt').addEventListener('click', () => download(new Blob([toTxt(segments)], { type: 'text/plain' }), name('txt')));

// ---------------------------------------------------------------- burn-in

/** Renders one subtitle as a transparent PNG (white text, dark outline), wrapped to the video width. */
async function subtitleImage(text, vw, vh, scale) {
  const fontPx = Math.round(Math.max(14, vh * 0.055 * scale));
  const font = `600 ${fontPx}px system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  const measure = el('canvas').getContext('2d');
  measure.font = font;
  const maxW = vw * 0.9;
  const lines = [];
  for (const para of text.split('\n')) {
    // Wrap by words for spaced languages, by characters for CJK.
    const tokens = /[　-鿿가-힯]/.test(para) ? [...para] : para.split(/(\s+)/);
    let line = '';
    for (const tok of tokens) {
      if (line && measure.measureText(line + tok).width > maxW) { lines.push(line.trim()); line = tok.trimStart(); } else line += tok;
    }
    if (line.trim()) lines.push(line.trim());
  }
  const lh = Math.round(fontPx * 1.3);
  const w = Math.ceil(Math.min(vw, Math.max(...lines.map((l) => measure.measureText(l).width)) + fontPx));
  const h = lh * lines.length + Math.round(fontPx * 0.4);
  const cv = el('canvas', { width: Math.max(2, w + (w % 2)), height: Math.max(2, h + (h % 2)) });
  const ctx = cv.getContext('2d');
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, fontPx / 7);
  ctx.strokeStyle = 'rgba(0,0,0,.9)';
  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => {
    const y = Math.round(fontPx * 0.2) + i * lh;
    ctx.strokeText(l, cv.width / 2, y);
    ctx.fillText(l, cv.width / 2, y);
  });
  return new Uint8Array(await (await new Promise((r) => cv.toBlob(r, 'image/png'))).arrayBuffer());
}

$('#as-burn').addEventListener('click', async () => {
  if (!isVideo || !video.videoWidth) { st.error(new Error(t('audioOnly'))); return; }
  const task = beginTask({ cancellable: true });
  $('#as-burn').disabled = true;
  try {
    st.busy(t('burnLoading'));
    const vw = video.videoWidth, vh = video.videoHeight;
    const scale = Number($('#as-bsize').value);
    const top = $('#as-bpos').value === 'top';
    const margin = Math.round(vh * 0.06);
    const extraFiles = [];
    for (let i = 0; i < segments.length; i++) {
      task.signal.throwIfAborted();
      extraFiles.push({ name: `sub${i}.png`, data: await subtitleImage(segments[i].text, vw, vh, scale) });
    }
    const inputs = extraFiles.flatMap((f) => ['-i', f.name]);
    const chain = segments.map((s, i) => {
      const from = i === 0 ? '[0:v]' : `[v${i}]`;
      const to = i === segments.length - 1 ? '[vout]' : `[v${i + 1}]`;
      const y = top ? margin : `H-h-${margin}`;
      return `${from}[${i + 1}:v]overlay=x=(W-w)/2:y=${y}:enable='gte(t,${s.start.toFixed(2)})*lt(t,${s.end.toFixed(2)})'${to}`;
    }).join(';');
    const blob = await run(file, ['-i', '{in}', ...inputs, '-filter_complex', chain, '-map', '[vout]', '-map', '0:a?',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'],
    'burned.mp4', 'video/mp4', {
      signal: task.signal,
      duration: video.duration,
      extraFiles,
      onProgress: (p) => { setBar(p); st.busy(t('burning', `${Math.round(p * 100)}%`)); },
    });
    const outName = `${baseName(file.name)}_subtitled.mp4`;
    releaseUrls($('#as-burned'));
    $('#as-burned').replaceChildren(el('video', { src: URL.createObjectURL(blob), controls: true, playsinline: true }),
      el('div', { class: 'row' }, el('button', { class: 'btn', text: `⬇ ${c('download')} ${outName}`, onclick: () => download(blob, outName) })));
    st.ok(t('burnDone', fmtBytes(blob.size)));
  } catch (e) {
    st.error(e);
  } finally {
    $('#as-burn').disabled = false;
    bar.hidden = true;
    task.finish();
  }
});
