import { $, $$, t, c, el, LK, icon, filePicker, fileCard, progress, alertBox, errorText, download, fmtBytes, baseName, nextFrame } from './lib.js';
import { frames } from './media.js';
import { CanvasSink } from 'mediabunny';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { prepare, metaLine, thumbnail, VIDEO_ACCEPT, SAMPLE_VIDEO, playerFor } from './video-ui.js';
import { timeline } from './timeline.js';
import { getFFmpeg, run as ffRun } from './ffmpeg-common.js';

const MAX_LEN = 30;
let job = null, tl = null, canceled = false;

const pick = filePicker($('#vg-pick'), {
  accept: VIDEO_ACCEPT, iconName: 'fileVideo', title: t('drop'), hint: t('dropHint'), sample: SAMPLE_VIDEO(LK.base), onFiles: ([f]) => load(f),
});

const val = (name) => Number($$(`input[name="${name}"]`).find((r) => r.checked).value);

function settings() {
  const { start, end } = tl.get();
  const speed = val('vg-speed');
  const fps = val('vg-fps');
  const width = Math.min(val('vg-w'), job.info.width || val('vg-w'));
  const height = Math.round((width / job.info.width) * job.info.height / 2) * 2;
  const count = Math.max(1, Math.round(((end - start) / speed) * fps));
  return { start, end, speed, fps, width, height, count };
}

function update() {
  if (!tl) return;
  const s = settings();
  $('#vg-est').textContent = t('estimate', s.count, s.width);
}

async function load(file) {
  tl?.destroy();
  $('#vg-pick').hidden = true;
  $('#vg-work').hidden = false;
  $('#vg-result').replaceChildren();
  $('#vg-alert').replaceChildren();
  $('#vg-file').replaceChildren(fileCard({ file, meta: t('preparing') }));
  try {
    job = await prepare(file);
  } catch (e) {
    $('#vg-alert').replaceChildren(alertBox(errorText(e)));
    return;
  }
  $('#vg-file').replaceChildren(fileCard({ file, meta: metaLine(job.info), thumb: await thumbnail(job), onChange: () => pick.open() }));
  const video = playerFor(job.url);
  video.muted = true;
  $('#vg-player').replaceChildren(video);
  const duration = job.info.duration || await new Promise((r) => video.addEventListener('loadedmetadata', () => r(video.duration), { once: true }));
  if (job.legacy) $('#vg-alert').replaceChildren(alertBox(t('legacy'), 'info'));
  tl = timeline({
    media: video, duration, start: 0, end: Math.min(duration, 5), maxLength: Math.min(MAX_LEN, duration),
    strip: job.media ? (n) => frames(job.media, n, 64) : null, onChange: update,
  });
  $('#vg-tl').replaceChildren(tl.root);
  update();
}

async function make() {
  const s = settings();
  canceled = false;
  $('#vg-go').disabled = true;
  $('#vg-result').replaceChildren();
  const task = progress($('#vg-task'), { title: t('making'), onCancel: () => { canceled = true; } });
  try {
    let blob, n = 0;
    if (job.legacy) {
      task.title(c('loadingEngine'));
      await getFFmpeg();
      task.title(t('making'));
      blob = await ffRun(job.file, ['-ss', s.start.toFixed(3), '-t', (s.end - s.start).toFixed(3), '-i', '{in}', '-vf',
        `setpts=PTS/${s.speed},fps=${s.fps},scale=${s.width}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
        '-loop', $('#vg-loop').checked ? '0' : '-1'], 'out.gif', 'image/gif', { duration: s.end - s.start, onProgress: (x) => task.set(x) });
      n = s.count;
    } else {
      const sink = new CanvasSink(job.media.video, { width: s.width, height: s.height, fit: 'fill', poolSize: 2 });
      const times = Array.from({ length: s.count }, (_, i) => s.start + (i * s.speed) / s.fps);
      const gif = GIFEncoder();
      const delay = Math.round(1000 / s.fps);
      const work = el('canvas', { width: s.width, height: s.height });
      const ctx = work.getContext('2d', { willReadFrequently: true });
      for await (const frame of sink.canvasesAtTimestamps(times)) {
        if (canceled) throw new DOMException('canceled', 'AbortError');
        if (!frame) continue;
        ctx.drawImage(frame.canvas, 0, 0, s.width, s.height);
        const { data } = ctx.getImageData(0, 0, s.width, s.height);
        const palette = quantize(data, 256, { format: 'rgb565' });
        const index = applyPalette(data, palette, 'rgb565');
        gif.writeFrame(index, s.width, s.height, { palette, delay, repeat: $('#vg-loop').checked ? 0 : -1 });
        n++;
        task.set(n / s.count);
        if (n % 4 === 0) await nextFrame(); // keep the page responsive
      }
      gif.finish();
      blob = new Blob([gif.bytes()], { type: 'image/gif' });
    }
    task.close();
    const name = `${baseName(job.file.name)}.gif`;
    $('#vg-result').replaceChildren(el('div', { class: 'result' },
      el('div', { class: 'result-head' }, icon('circleCheck'), t('done', s.width, s.height, n, fmtBytes(blob.size))),
      el('div', { style: { textAlign: 'center', background: 'var(--bg)', borderRadius: '12px', padding: '12px' } },
        el('img', { src: URL.createObjectURL(blob), alt: '', style: { maxWidth: '100%', borderRadius: '6px' } })),
      el('div', { class: 'actions' },
        el('button', { class: 'btn lg', onclick: () => download(blob, name) }, icon('download'), t('download')),
        el('button', { class: 'btn ghost', onclick: () => pick.open() }, t('another')))));
    $('#vg-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    task.close();
    $('#vg-alert').replaceChildren(canceled ? alertBox(c('canceled'), 'info') : alertBox(errorText(e)));
  } finally {
    $('#vg-go').disabled = false;
  }
}

$('#vg-work').addEventListener('change', (e) => { if (e.target.name?.startsWith('vg-')) update(); });
$('#vg-go').addEventListener('click', make);
