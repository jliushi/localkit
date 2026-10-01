import { $, t, c, el, dropzone, download, fmtBytes, baseName, status } from './lib.js';
import { getFFmpeg, run, mediaDuration, fmtTime } from './ffmpeg-common.js';

const st = status($('#vc-status'));
const bar = $('#vc-progress');
let file = null, duration = null;

const MIME = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif', mov: 'video/quicktime' };
const CRF = { mp4: { high: 20, balanced: 26, small: 31 }, webm: { high: '1.5M', balanced: '900k', small: '450k' } };

function refresh() {
  const gif = $('#vc-fmt').value === 'gif';
  $('#vc-fps-wrap').hidden = !gif;
  $('#vc-gifnote').hidden = !gif;
  $('#vc-mute-wrap').hidden = gif;
  $('#vc-q-wrap').hidden = gif;
}
$('#vc-fmt').addEventListener('change', refresh);

dropzone($('#vc-drop'), {
  accept: 'video/*,.mkv,.flv,.wmv,.avi,.3gp,.ts,.m4v,.mov',
  onFiles: async ([f]) => {
    file = f;
    st.clear();
    $('#vc-result').replaceChildren();
    duration = await mediaDuration(f);
    const v = $('#vc-video');
    v.src = URL.createObjectURL(f);
    $('#vc-preview').hidden = false;
    $('#vc-info').textContent = t('info', f.name, fmtBytes(f.size), fmtTime(duration));
    $('#vc-go').disabled = false;
    getFFmpeg().catch(() => {}); // start downloading the engine early
  },
});

/** Builds ffmpeg arguments for the chosen settings. */
export function buildArgs(fmt, res, quality, fps, mute) {
  const scale = res ? `scale=-2:'min(${res},ih)'` : null;
  if (fmt === 'gif') {
    const w = res ? Math.round((res * 16) / 9) : 480;
    return ['-i', '{in}', '-vf', `fps=${fps},scale='min(${Math.min(w, 640)},iw)':-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0'];
  }
  const vf = scale ? ['-vf', scale] : [];
  const audio = mute ? ['-an'] : fmt === 'webm' ? ['-c:a', 'libvorbis', '-q:a', '3'] : ['-c:a', 'aac', '-b:a', quality === 'small' ? '96k' : '128k'];
  if (fmt === 'webm') {
    return ['-i', '{in}', ...vf, '-c:v', 'libvpx', '-b:v', CRF.webm[quality], '-deadline', 'realtime', '-cpu-used', '8', ...audio];
  }
  return ['-i', '{in}', ...vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(CRF.mp4[quality]), '-pix_fmt', 'yuv420p', ...audio, '-movflags', '+faststart'];
}

$('#vc-go').addEventListener('click', async () => {
  if (!file) return;
  const fmt = $('#vc-fmt').value;
  $('#vc-go').disabled = true;
  $('#vc-result').replaceChildren();
  bar.hidden = false;
  bar.firstElementChild.style.width = '0';
  try {
    st.busy(t('loading'));
    await getFFmpeg();
    st.busy(t('working', ''));
    const args = buildArgs(fmt, Number($('#vc-res').value), $('#vc-q').value, $('#vc-fps').value, $('#vc-mute').checked);
    const outName = `${baseName(file.name)}.${fmt}`;
    const blob = await run(file, args, `out.${fmt}`, MIME[fmt], {
      duration,
      onProgress: (p) => { bar.firstElementChild.style.width = `${(p * 100).toFixed(1)}%`; st.busy(t('working', `${Math.round(p * 100)}%`)); },
    });
    bar.firstElementChild.style.width = '100%';
    const url = URL.createObjectURL(blob);
    $('#vc-result').append(
      fmt === 'gif' ? el('img', { src: url, alt: '', style: 'max-width:100%;border-radius:10px' }) : el('video', { src: url, controls: true, playsinline: true }),
      el('div', { class: 'row' }, el('button', { class: 'btn', text: `⬇ ${c('download')} ${outName}`, onclick: () => download(blob, outName) })));
    st.ok(t('done', fmtBytes(file.size), fmtBytes(blob.size)));
  } catch (e) {
    st.error(e);
  } finally {
    $('#vc-go').disabled = false;
    bar.hidden = true;
  }
});
refresh();
