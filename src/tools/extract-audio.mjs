import { html } from '../../build/html.mjs';

export default {
  id: 'extract-audio',
  category: 'video',
  icon: '♫',
  color: '#0284c7',
  strings: {
    en: {
      name: 'Extract Audio from Video (MP3)',
      title: 'Extract Audio from Video — Video to MP3, M4A, WAV Online Free',
      desc: 'Save the soundtrack of any video as MP3, M4A or WAV. Works with MP4, MOV, MKV, WebM, AVI and more. Free, no upload — the conversion runs in your browser.',
      h1: 'Extract audio from a video (video to MP3)',
      lead: 'Get the music, speech or podcast audio out of a video file. MP3 plays everywhere; M4A keeps the original quality when possible; WAV is uncompressed for editing.',
      steps: ['Drop a video on the box.', 'Choose MP3, M4A or WAV and the quality.', 'Click Extract audio and download the file.'],
      faq: [
        ['Which format should I choose?', 'MP3 for the widest compatibility. M4A copies the original AAC soundtrack without re-encoding when the video has one, so it is fastest and lossless. WAV for audio editing software.'],
        ['Can I convert audio files too?', 'Yes — drop an audio file (M4A, WAV, OGG, FLAC, AAC…) to convert it to MP3, M4A or WAV.'],
        ['Is my file uploaded?', 'No. Extraction runs in your browser with FFmpeg compiled to WebAssembly.'],
      ],
      ui: {
        drop: 'Drop a video or audio file here or click to choose', format: 'Format', bitrate: 'MP3 quality', bHigh: 'High (≈190 kbps)', bStd: 'Standard (≈130 kbps)', bSmall: 'Small (≈100 kbps)',
        extract: 'Extract audio', loading: 'Loading the audio engine (first time only)…', working: 'Extracting… $1', done: 'Saved $1 ($2).', noAudio: 'This video has no audio track.', info: '$1 · $2',
      },
    },
    zh: {
      name: '视频提取音频（转 MP3）',
      title: '视频提取音频 — 在线把视频转成 MP3、M4A、WAV，免费',
      desc: '把任意视频的声音保存为 MP3、M4A 或 WAV。支持 MP4、MOV、MKV、WebM、AVI 等格式。免费、不上传，在浏览器中完成转换。',
      h1: '从视频中提取音频（视频转 MP3）',
      lead: '把视频里的音乐、讲话或播客音频单独保存。MP3 兼容所有设备；M4A 在可能时保留原始音质；WAV 无压缩，适合后期编辑。',
      steps: ['把视频拖到框里。', '选择 MP3、M4A 或 WAV 以及音质。', '点击「提取音频」并下载文件。'],
      faq: [
        ['该选哪种格式？', '要兼容性最好选 MP3。如果视频本身是 AAC 音轨，M4A 会直接复制、不重新编码，速度最快且无损。要用音频软件编辑选 WAV。'],
        ['也能转换音频文件吗？', '可以。拖入音频文件（M4A、WAV、OGG、FLAC、AAC 等）即可转换为 MP3、M4A 或 WAV。'],
        ['文件会被上传吗？', '不会。提取过程由浏览器中的 FFmpeg（WebAssembly 版）完成。'],
      ],
      ui: {
        drop: '把视频或音频文件拖到这里，或点击选择', format: '格式', bitrate: 'MP3 音质', bHigh: '高（约 190 kbps）', bStd: '标准（约 130 kbps）', bSmall: '小（约 100 kbps）',
        extract: '提取音频', loading: '正在加载音频引擎（仅首次需要）…', working: '正在提取… $1', done: '已保存 $1（$2）。', noAudio: '这个视频没有音轨。', info: '$1 · $2',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="ea-drop"><strong>${s.drop}</strong><span id="ea-info"></span></div>
<div class="fields">
  <label class="field"><span>${s.format}</span><select id="ea-fmt"><option value="mp3">MP3</option><option value="m4a">M4A (AAC)</option><option value="wav">WAV</option></select></label>
  <label class="field" id="ea-q-wrap"><span>${s.bitrate}</span><select id="ea-q"><option value="2">${s.bHigh}</option><option value="5" selected>${s.bStd}</option><option value="7">${s.bSmall}</option></select></label>
</div>
<div class="row"><button class="btn big" id="ea-go" disabled>${s.extract}</button></div>
<div class="status" id="ea-status" hidden></div>
<div class="progress" id="ea-progress" hidden><span></span></div>
<div class="media-box" id="ea-result"></div>`,
};
