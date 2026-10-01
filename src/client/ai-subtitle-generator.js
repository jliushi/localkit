import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, fmtTime, fmtDuration, parseTime, baseName, toast } from './lib.js';
import { convert, pickVideoCodec, ConversionCanceledError } from './media.js';
import { prepare, metaLine, thumbnail, MEDIA_ACCEPT, SAMPLE_VIDEO } from './video-ui.js';
import { getFFmpeg, run as ffRun } from './ffmpeg-common.js';
import { toSrt, toVtt, toTxt, parseSubs } from './subs.js';
import { translate, guessLanguage, canTarget } from './translate.js';

let job = null;
let segs = []; // { start, end, text }
let media = null; // <video> or <audio> in the editor
let worker = null;

const pick = filePicker($('#as-pick'), {
  accept: MEDIA_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});
const isVideo = () => !!(job?.info.width);

// ---------------------------------------------------------------- audio for Whisper (16 kHz mono)

function wavToFloat32(buf) {
  const dv = new DataView(buf);
  let p = 12;
  while (p + 8 <= dv.byteLength) {
    const id = String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));
    const size = dv.getUint32(p + 4, true);
    if (id === 'data') {
      const n = Math.floor(Math.min(size, dv.byteLength - p - 8) / 2);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = dv.getInt16(p + 8 + i * 2, true) / 32768;
      return out;
    }
    p += 8 + size + (size % 2);
  }
  throw new Error('no audio data');
}

async function audio16k(task) {
  if (!job.legacy) {
    const { blob } = await convert(job.file, {
      container: 'wav', video: { discard: true }, audio: { codec: 'pcm-s16', numberOfChannels: 1, sampleRate: 16000 }, onProgress: (x) => task.set(x),
    });
    return wavToFloat32(await blob.arrayBuffer());
  }
  task.title(c('loadingEngine'));
  await getFFmpeg();
  task.title(t('reading'));
  const blob = await ffRun(job.file, ['-i', '{in}', '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le'], 'audio.raw', 'application/octet-stream', { duration: job.info.duration, onProgress: (x) => task.set(x) });
  return new Float32Array(await blob.arrayBuffer());
}

async function modelHost(model) {
  for (const host of ['https://huggingface.co/', 'https://hf-mirror.com/']) {
    try {
      const res = await fetch(`${host}${model}/resolve/main/config.json`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) return host;
    } catch { /* next */ }
  }
  return 'https://huggingface.co/';
}

async function hasWebGpu() {
  try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch { return false; }
}

function transcribe(audio, opts, task) {
  worker ||= new Worker(`${LK.base}/assets/js/whisper.worker.js`, { type: 'module' });
  return new Promise((resolve, reject) => {
    let live = '';
    const liveEl = $('#as-live');
    worker.onmessage = ({ data }) => {
      if (data.type === 'download') { task.title(`${t('downloading')} · ${fmtBytes(data.loaded)} / ${fmtBytes(data.total)}`); task.set(data.loaded / data.total); }
      else if (data.type === 'fallback') toast(t('fallback'));
      else if (data.type === 'ready') { task.title(t('transcribing')); task.set(0); }
      else if (data.type === 'progress') task.set(data.value);
      else if (data.type === 'partial') {
        live = (live + data.text).slice(-400);
        liveEl.hidden = false;
        liveEl.replaceChildren(el('strong', { text: `${t('live')}: ` }), `…${live}`);
      } else if (data.type === 'result') resolve(data);
      else if (data.type === 'error') reject(new Error(data.message));
    };
    worker.onerror = (e) => reject(new Error(e.message || 'worker error'));
    worker.postMessage({ type: 'run', audio, ...opts }, [audio.buffer]);
  });
}

function cleanSegments(chunks, duration) {
  const out = [];
  for (const ch of chunks) {
    const text = (ch.text || '').trim();
    if (!text || /^[[(（【].*[\])）】]$/.test(text)) continue; // [Music], (applause)…
    let [start, end] = ch.timestamp || [0, null];
    start = Math.max(0, start ?? 0);
    end = end ?? Math.min(duration, start + 5);
    if (end <= start) end = start + Math.min(5, Math.max(1, text.length * 0.15));
    out.push({ start, end, text });
  }
  for (let i = 0; i < out.length - 1; i++) if (out[i].end > out[i + 1].start) out[i].end = Math.max(out[i].start + 0.2, out[i + 1].start - 0.01);
  return out;
}

async function toSimplified(list) {
  if (!list.some((s) => /[一-鿿]/.test(s.text))) return list;
  const OpenCC = await import('opencc-js/t2cn');
  const conv = OpenCC.Converter({ from: 't', to: 'cn' });
  return list.map((s) => ({ ...s, text: conv(s.text) }));
}

// ---------------------------------------------------------------- flow

async function load(file) {
  worker?.terminate();
  worker = null;
  $('#as-pick').hidden = true;
  $('#as-work').hidden = false;
  $('#as-setup').hidden = false;
  $('#as-editor').hidden = true;
  $('#as-live').hidden = true;
  $('#as-alert').replaceChildren();
  $('#as-burned').replaceChildren();
  $('#as-file').replaceChildren(fileCard({ file, meta: t('reading') }));
  try {
    job = await prepare(file);
  } catch (e) {
    $('#as-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#as-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
}

async function generate() {
  const started = performance.now();
  $('#as-go').disabled = true;
  $('#as-alert').replaceChildren();
  $('#as-live').hidden = true;
  let canceled = false;
  const task = progress($('#as-task'), {
    title: t('reading'),
    onCancel: () => { canceled = true; worker?.terminate(); worker = null; task.close(); $('#as-alert').replaceChildren(alertBox(c('canceled'), 'info')); $('#as-go').disabled = false; },
  });
  try {
    const audio = await audio16k(task);
    if (canceled) return;
    const duration = audio.length / 16000;
    const model = $$('input[name="as-model"]').find((r) => r.checked).value;
    task.title(t('connecting'));
    task.set(null);
    const [host, gpu] = await Promise.all([modelHost(model), $('#as-engine').value === 'auto' ? hasWebGpu() : false]);
    if (canceled) return;
    task.title(t('loadingModel'));
    const result = await transcribe(audio, {
      base: `${location.origin}${LK.base}`, host, model, device: gpu ? 'webgpu' : 'wasm',
      language: $('#as-lang').value, task: $('#as-translate').checked ? 'translate' : 'transcribe',
    }, task);
    let list = cleanSegments(result.chunks, duration);
    if ($('#as-script').value === 'simp' && !$('#as-translate').checked) list = await toSimplified(list);
    task.close();
    $('#as-live').hidden = true;
    if (!list.length) { $('#as-alert').replaceChildren(alertBox(t('noSpeech'), 'warn')); return; }
    segs = list;
    openEditor();
    $('#as-alert').replaceChildren(alertBox(t('doneGen', list.length, fmtDuration((performance.now() - started) / 1000), result.device === 'webgpu' ? 'WebGPU' : 'CPU'), 'info'));
  } catch (e) {
    if (canceled) return;
    task.close();
    $('#as-alert').replaceChildren(alertBox(errorText(e)));
  } finally {
    if (!canceled) $('#as-go').disabled = false;
  }
}

// ---------------------------------------------------------------- editor

function openEditor() {
  $('#as-setup').hidden = true;
  $('#as-editor').hidden = false;
  $('#as-burnbox').hidden = !isVideo();
  media = isVideo()
    ? el('video', { src: job.url, controls: true, playsinline: true, preload: 'metadata' })
    : el('audio', { src: job.url, controls: true, preload: 'metadata' });
  const cue = el('div', { class: 'cue' }, el('span'));
  $('#as-player').replaceChildren(media, isVideo() ? cue : '');
  media.addEventListener('timeupdate', sync);
  media.addEventListener('seeked', sync);
  renderList();
  $('#as-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

let activeIdx = -1;
function sync() {
  const now = media.currentTime;
  const idx = segs.findIndex((s) => now >= s.start && now < s.end);
  const cue = $('#as-player .cue');
  if (cue) {
    cue.hidden = idx < 0;
    cue.firstChild.textContent = idx >= 0 ? segs[idx].text : '';
    const top = $$('input[name="as-pos"]').find((r) => r.checked)?.value === 'top';
    cue.style.top = top ? '6%' : 'auto';
    cue.style.bottom = top ? 'auto' : '17%';
  }
  if (idx === activeIdx) return;
  activeIdx = idx;
  for (const row of $$('.sub-row')) row.classList.toggle('on', Number(row.dataset.i) === idx);
  const row = $(`.sub-row[data-i="${idx}"]`);
  if (row && !row.contains(document.activeElement)) row.scrollIntoView({ block: 'nearest' });
}

function renderList() {
  $('#as-count').textContent = `(${segs.length})`;
  $('#as-list').replaceChildren(...segs.map((s, i) => {
    const time = (key) => {
      const inp = el('input', { type: 'text', value: fmtTime(s[key]), 'aria-label': key, spellcheck: 'false' });
      inp.addEventListener('change', () => {
        const v = parseTime(inp.value);
        if (v != null) { s[key] = v; if (s.end <= s.start) s.end = s.start + 0.5; }
        inp.value = fmtTime(s[key]);
        sync();
      });
      inp.addEventListener('focus', () => { media.currentTime = s.start + 0.01; });
      return inp;
    };
    const ta = el('textarea', { rows: Math.max(1, s.text.split('\n').length), spellcheck: 'true' }, s.text);
    // Grow with the text where CSS field-sizing isn't supported.
    const fit = () => { if (!CSS.supports('field-sizing', 'content')) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; } };
    requestAnimationFrame(fit);
    ta.addEventListener('input', () => { s.text = ta.value; fit(); sync(); });
    ta.addEventListener('focus', () => { if (media.paused) media.currentTime = s.start + 0.01; });
    const op = (name, label, fn) => el('button', { type: 'button', title: label, 'aria-label': label, onclick: fn }, icon(name));
    return el('div', { class: 'sub-row', 'data-i': i },
      el('div', { class: 'sub-times' }, time('start'), time('end')),
      ta,
      el('div', { class: 'sub-ops' },
        op('split', t('split'), () => {
          const cut = ta.selectionStart || Math.floor(s.text.length / 2);
          const a = s.text.slice(0, cut).trim(), b = s.text.slice(cut).trim();
          if (!a || !b) return;
          const mid = s.start + (s.end - s.start) * (a.length / (a.length + b.length));
          segs.splice(i, 1, { start: s.start, end: mid, text: a }, { start: mid, end: s.end, text: b });
          renderList();
        }),
        i < segs.length - 1 ? op('merge', t('merge'), () => {
          const n = segs[i + 1];
          segs.splice(i, 2, { start: s.start, end: n.end, text: `${s.text} ${n.text}`.trim() });
          renderList();
        }) : null,
        op('trash', t('del'), () => { segs.splice(i, 1); renderList(); })));
  }));
  activeIdx = -2;
  sync();
}

$('#as-add').addEventListener('click', () => {
  const at = media?.currentTime ?? 0;
  const idx = segs.findIndex((s) => s.start > at);
  const seg = { start: at, end: at + 2, text: t('newText') };
  if (idx < 0) segs.push(seg); else segs.splice(idx, 0, seg);
  renderList();
  $(`.sub-row[data-i="${idx < 0 ? segs.length - 1 : idx}"] textarea`)?.focus();
});
$('#as-shift-go').addEventListener('click', () => {
  const d = Number($('#as-shift').value) || 0;
  for (const s of segs) { s.start = Math.max(0, s.start + d); s.end = Math.max(s.start + 0.1, s.end + d); }
  renderList();
});

const outName = (ext) => `${baseName(job.file.name)}.${ext}`;
$('#as-srt').addEventListener('click', () => download(new Blob([toSrt(segs)], { type: 'application/x-subrip' }), outName('srt')));
$('#as-vtt').addEventListener('click', () => download(new Blob([toVtt(segs)], { type: 'text/vtt' }), outName('vtt')));
$('#as-txt').addEventListener('click', () => download(new Blob([segs.map((s) => s.text).join('\n')], { type: 'text/plain' }), outName('txt')));
$('#as-another').addEventListener('click', () => pick.open());

$('#as-import').addEventListener('click', () => $('#as-srtfile').click());
$('#as-srtfile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const list = parseSubs(await f.text());
  if (!list.length) { $('#as-alert').replaceChildren(alertBox(t('badSrt'))); return; }
  segs = list;
  openEditor();
  $('#as-alert').replaceChildren(alertBox(t('imported', list.length), 'info'));
});

// ---------------------------------------------------------------- burn-in

const FONT = '600 {px}px system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

/** Renders a subtitle into a canvas sized to the text (white text, outline or dark box). */
function cueBitmap(text, vw, vh, scale, style) {
  const px = Math.round(Math.max(14, Math.min(vw, vh * 1.78) * 0.032 * scale));
  const font = FONT.replace('{px}', px);
  const m = el('canvas').getContext('2d');
  m.font = font;
  const maxW = vw * 0.88;
  const lines = [];
  for (const para of text.split('\n')) {
    const cjk = /[　-鿿가-힯]/.test(para);
    const tokens = cjk ? [...para] : para.split(/(\s+)/);
    let line = '';
    for (const tok of tokens) {
      if (line && m.measureText(line + tok).width > maxW) { lines.push(line.trim()); line = tok.trimStart(); } else line += tok;
    }
    if (line.trim()) lines.push(line.trim());
  }
  const lh = Math.round(px * 1.32);
  const padX = style === 'box' ? Math.round(px * 0.45) : Math.round(px * 0.2);
  const widths = lines.map((l) => m.measureText(l).width);
  const w = Math.ceil(Math.max(...widths) + padX * 2 + 4);
  const h = lh * lines.length + Math.round(px * 0.3);
  const cv = el('canvas', { width: w, height: h });
  const ctx = cv.getContext('2d');
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    const y = Math.round(px * 0.15) + i * lh + lh / 2;
    if (style === 'box') {
      ctx.fillStyle = 'rgba(0,0,0,.72)';
      const bw = widths[i] + padX * 2;
      ctx.beginPath();
      ctx.roundRect((w - bw) / 2, y - lh / 2, bw, lh, px * 0.18);
      ctx.fill();
    } else {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, px / 6.5);
      ctx.strokeStyle = 'rgba(0,0,0,.92)';
      ctx.strokeText(l, w / 2, y);
    }
    ctx.fillStyle = '#fff';
    ctx.fillText(l, w / 2, y);
  });
  return cv;
}

async function burn() {
  if (!isVideo()) { $('#as-burned').replaceChildren(alertBox(t('audioOnly'), 'info')); return; }
  const scale = Number($$('input[name="as-size"]').find((r) => r.checked).value);
  const style = $$('input[name="as-style"]').find((r) => r.checked).value;
  const top = $$('input[name="as-pos"]').find((r) => r.checked).value === 'top';
  const W = job.info.width, H = job.info.height;
  const margin = Math.round(H * 0.06);
  const list = segs.filter((s) => s.text.trim()).map((s) => ({ ...s }));
  const bitmaps = new Map();
  const bitmapFor = (i) => {
    if (!bitmaps.has(i)) bitmaps.set(i, cueBitmap(list[i].text, W, H, scale, style));
    return bitmaps.get(i);
  };
  const abort = new AbortController();
  $('#as-burn').disabled = true;
  $('#as-burned').replaceChildren();
  const task = progress($('#as-burn-task'), { title: t('burning'), onCancel: () => abort.abort() });
  try {
    let blob;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('burning'));
      const extraFiles = [];
      for (let i = 0; i < list.length; i++) {
        const b = await new Promise((r) => bitmapFor(i).toBlob(r, 'image/png'));
        extraFiles.push({ name: `sub${i}.png`, data: new Uint8Array(await b.arrayBuffer()) });
      }
      const chain = list.map((s, i) => `${i === 0 ? '[0:v]' : `[v${i}]`}[${i + 1}:v]overlay=x=(W-w)/2:y=${top ? margin : `H-h-${margin}`}:enable='gte(t,${s.start.toFixed(2)})*lt(t,${s.end.toFixed(2)})'${i === list.length - 1 ? '[vout]' : `[v${i + 1}]`}`).join(';');
      blob = await ffRun(job.file, ['-i', '{in}', ...extraFiles.flatMap((f) => ['-i', f.name]), '-filter_complex', chain, '-map', '[vout]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'],
      'burned.mp4', 'video/mp4', { duration: job.info.duration, extraFiles, onProgress: (x) => task.set(x) });
    } else {
      const canvas = el('canvas', { width: W, height: H });
      const ctx = canvas.getContext('2d');
      let cursor = 0;
      const codec = await pickVideoCodec('mp4', W, H);
      ({ blob } = await convert(job.file, {
        container: 'mp4',
        video: {
          codec, forceTranscode: true, processedWidth: W, processedHeight: H,
          process: (sample) => {
            sample.draw(ctx, 0, 0, W, H);
            const time = sample.timestamp;
            while (cursor < list.length && list[cursor].end <= time) cursor++;
            let i = cursor;
            while (i < list.length && list[i].start <= time) {
              if (time < list[i].end) {
                const bm = bitmapFor(i);
                ctx.drawImage(bm, Math.round((W - bm.width) / 2), top ? margin : H - margin - bm.height);
                break;
              }
              i++;
            }
            return canvas;
          },
        },
        audio: {},
        onProgress: (x) => task.set(x),
        signal: abort.signal,
      }));
    }
    task.close();
    const name = `${baseName(job.file.name)}-subtitled.mp4`;
    $('#as-burned').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('burned', fmtBytes(blob.size))),
      el('video', { src: URL.createObjectURL(blob), controls: true, playsinline: true }),
      el('div', { class: 'actions' }, el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('downloadVideo')))));
  } catch (e) {
    task.close();
    if (e instanceof ConversionCanceledError || abort.signal.aborted) $('#as-burned').replaceChildren(alertBox(c('canceled'), 'info'));
    else $('#as-burned').replaceChildren(alertBox(errorText(e)));
  } finally {
    $('#as-burn').disabled = false;
  }
}

// ---------------------------------------------------------------- translation

let trJob = null;
$('#as-trgo').addEventListener('click', async () => {
  const dst = $('#as-trto').value;
  const src = guessLanguage(segs.map((x) => x.text));
  if (src === dst) { $('#as-tr-task').replaceChildren(alertBox(t('trSame'), 'info')); return; }
  if (!canTarget(src, dst)) { $('#as-tr-task').replaceChildren(alertBox(errorText(new Error(`${src} → ${dst}`)))); return; }
  $('#as-trgo').disabled = true;
  const task = progress($('#as-tr-task'), { title: t('trWorking'), onCancel: () => trJob?.cancel() });
  try {
    trJob = translate(segs.map((x) => x.text.replace(/
/g, ' ')), src, dst, (ev) => {
      if (ev.type === 'download') { task.title(t('trLoading', fmtBytes(ev.loaded), fmtBytes(ev.total))); task.set(ev.loaded / ev.total); }
      else if (ev.type === 'ready') task.title(t('trWorking'));
      else if (ev.type === 'progress') task.set(ev.value);
    });
    const out = await trJob.promise;
    const bi = $('#as-trbi').checked;
    segs = segs.map((x, i) => ({ ...x, text: bi ? `${x.text}
${out[i]}` : out[i] }));
    renderList();
    $('#as-tr-task').replaceChildren(alertBox(t('trDone'), 'info'));
  } catch (e) {
    task.close();
    $('#as-tr-task').replaceChildren(e?.name === 'AbortError' ? alertBox(c('canceled'), 'info') : alertBox(errorText(e)));
  } finally {
    $('#as-trgo').disabled = false;
  }
});

$('#as-go').addEventListener('click', generate);
$('#as-burn').addEventListener('click', burn);
$('#as-editor').addEventListener('change', (e) => { if (e.target.name === 'as-pos') sync(); });
