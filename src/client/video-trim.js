import { $, t, c, el, dropzone, download, fmtBytes, baseName, extOf, status, beginTask, releaseUrls } from './lib.js';
import { getFFmpeg, run, fmtTime, parseTime } from './ffmpeg-common.js';

const st = status($('#vt-status'));
const video = $('#vt-video');
const bar = $('#vt-progress');
let file = null;

const times = () => [parseTime($('#vt-start').value), parseTime($('#vt-end').value)];

function update() {
  const [a, b] = times();
  const d = video.duration;
  if (Number.isFinite(d) && a != null && b != null) {
    $('#vt-sel').style.left = `${(Math.min(a, d) / d) * 100}%`;
    $('#vt-sel').style.width = `${Math.max(0, (Math.min(b, d) - a) / d) * 100}%`;
    $('#vt-len').textContent = b > a ? t('length', fmtTime(b - a)) : t('badTimes');
  }
}

dropzone($('#vt-drop'), {
  accept: 'video/*,.mkv,.flv,.wmv,.avi,.3gp,.ts,.m4v,.mov',
  onFiles: ([f]) => {
    file = f;
    st.clear();
    releaseUrls($('#vt-result'));
    $('#vt-result').replaceChildren();
    if (video.src.startsWith('blob:')) URL.revokeObjectURL(video.src);
    $('#vt-start').value = '';
    $('#vt-end').value = '';
    video.src = URL.createObjectURL(f);
    $('#vt-work').hidden = false;
    getFFmpeg().catch(() => {});
  },
});

video.addEventListener('loadedmetadata', () => {
  $('#vt-start').value = fmtTime(0);
  $('#vt-end').value = fmtTime(video.duration);
  update();
});
$('#vt-setstart').addEventListener('click', () => { $('#vt-start').value = fmtTime(video.currentTime); update(); });
$('#vt-setend').addEventListener('click', () => { $('#vt-end').value = fmtTime(video.currentTime); update(); });
for (const i of [$('#vt-start'), $('#vt-end')]) i.addEventListener('input', update);
$('#vt-timeline').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  if (Number.isFinite(video.duration)) video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
});
$('#vt-preview').addEventListener('click', () => {
  const [a, b] = times();
  if (a == null || b == null || b <= a) return;
  video.currentTime = a;
  video.play();
  const stop = () => { if (video.currentTime >= b) { video.pause(); video.removeEventListener('timeupdate', stop); } };
  video.addEventListener('timeupdate', stop);
});

$('#vt-go').addEventListener('click', async () => {
  if (!file) return;
  const [a, b] = times();
  if (a == null || b == null || b <= a || (Number.isFinite(video.duration) && b > video.duration + 0.05)) { st.error(new Error(t('badTimes'))); return; }
  const task = beginTask({ cancellable: true });
  const precise = $('#vt-mode').value === 'precise';
  const ext = precise ? 'mp4' : (extOf(file.name) || 'mp4');
  const outName = `${baseName(file.name)}_clip.${ext}`;
  const len = (b - a).toFixed(3);
  const args = precise
    ? ['-ss', a.toFixed(3), '-i', '{in}', '-t', len, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart']
    : ['-ss', a.toFixed(3), '-i', '{in}', '-t', len, '-map', '0', '-c', 'copy', '-avoid_negative_ts', 'make_zero'];
  $('#vt-go').disabled = true;
  bar.hidden = false;
  try {
    st.busy(t('loading'));
    st.busy(t('working', ''));
    const blob = await run(file, args, `out.${ext}`, precise ? 'video/mp4' : file.type || 'video/mp4', {
      signal: task.signal,
      duration: b - a,
      onProgress: (p) => { bar.firstElementChild.style.width = `${(p * 100).toFixed(1)}%`; st.busy(t('working', `${Math.round(p * 100)}%`)); },
    });
    releaseUrls($('#vt-result'));
    $('#vt-result').replaceChildren(
      el('video', { src: URL.createObjectURL(blob), controls: true, playsinline: true }),
      el('div', { class: 'row' }, el('button', { class: 'btn', text: `⬇ ${c('download')} ${outName}`, onclick: () => download(blob, outName) })));
    st.ok(t('done', outName, fmtBytes(blob.size)));
  } catch (e) {
    st.error(e);
  } finally {
    $('#vt-go').disabled = false;
    bar.hidden = true;
    task.finish();
  }
});
