import { html } from '../../build/html.mjs';

export default {
  id: 'video-converter',
  category: 'video',
  icon: '▶',
  color: '#4f46e5',
  strings: {
    en: {
      name: 'Video Converter & Compressor',
      title: 'Video Converter & Compressor Online — MP4, WebM, GIF, MOV, Free & Private',
      desc: 'Convert videos to MP4, WebM or GIF and make them smaller by lowering resolution and quality. Works with MOV, MKV, AVI, FLV and more. Runs in your browser — no upload.',
      h1: 'Convert and compress videos',
      lead: 'Convert MOV, MKV, AVI, FLV, WMV and other videos to MP4, WebM or animated GIF, and shrink them for e-mail or chat by lowering resolution and quality.',
      steps: [
        'Drop a video on the box.',
        'Choose the output format, resolution and quality. Lower settings make smaller files.',
        'Click Convert and keep this tab open until it finishes, then download the result.',
      ],
      faq: [
        ['How long does it take?', 'Conversion runs on your own computer\'s processor inside the browser, which is slower than desktop software: roughly real-time for 720p MP4 on a recent laptop, slower on phones. Short clips finish in seconds.'],
        ['How do I make a video smaller?', 'Choose MP4, a lower resolution such as 720p or 480p, and the "Smaller file" quality. A 1080p phone video usually shrinks to a fraction of its size.'],
        ['What is the maximum file size?', 'Browsers can handle files up to about 2 GB; for very long or 4K videos, desktop software is the better choice.'],
        ['Is my video uploaded?', 'No. The video is processed by a WebAssembly build of FFmpeg in your browser and never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a video here or click to choose', dropSub: 'MP4, MOV, MKV, WebM, AVI, FLV, WMV, 3GP…', format: 'Output format',
        resolution: 'Resolution', rOriginal: 'Original', quality: 'Quality', qHigh: 'High', qBalanced: 'Balanced', qSmall: 'Smaller file',
        convert: 'Convert', loading: 'Loading the video engine (about 30 MB, first time only)…', working: 'Converting… $1',
        done: 'Done: $1 → $2.', gifNote: 'GIF: keep clips short (under ~15 s); GIFs get big quickly.', fps: 'GIF frame rate', mute: 'Remove audio', info: '$1 · $2 · $3',
      },
    },
    zh: {
      name: '视频格式转换与压缩',
      title: '在线视频格式转换与压缩 — MP4、WebM、GIF、MOV，免费且私密',
      desc: '把视频转换为 MP4、WebM 或 GIF，并通过降低分辨率和画质减小文件体积。支持 MOV、MKV、AVI、FLV 等格式。在浏览器中运行，不上传。',
      h1: '视频格式转换与压缩',
      lead: '把 MOV、MKV、AVI、FLV、WMV 等视频转换成 MP4、WebM 或 GIF 动图，并通过降低分辨率和画质压缩体积，方便发邮件或聊天软件。',
      steps: [
        '把视频拖到框里。',
        '选择输出格式、分辨率和画质。设置越低，文件越小。',
        '点击「转换」，在完成前请保持此页面打开，完成后下载结果。',
      ],
      faq: [
        ['需要多长时间？', '转换在浏览器里用你自己电脑的处理器完成，比桌面软件慢：较新的笔记本转换 720p MP4 大约与视频时长相当，手机会更慢。短视频几秒钟就能完成。'],
        ['怎样把视频变小？', '选择 MP4、较低的分辨率（如 720p 或 480p）和「更小文件」画质。手机拍的 1080p 视频通常能压缩到原来的几分之一。'],
        ['最大支持多大的文件？', '浏览器大约能处理 2 GB 以内的文件；特别长或 4K 的视频建议使用桌面软件。'],
        ['视频会被上传吗？', '不会。视频由浏览器中的 FFmpeg（WebAssembly 版）处理，不会离开你的设备。'],
      ],
      ui: {
        drop: '把视频拖到这里，或点击选择', dropSub: 'MP4、MOV、MKV、WebM、AVI、FLV、WMV、3GP…', format: '输出格式',
        resolution: '分辨率', rOriginal: '原始', quality: '画质', qHigh: '高', qBalanced: '均衡', qSmall: '更小文件',
        convert: '开始转换', loading: '正在加载视频引擎（约 30 MB，仅首次需要）…', working: '正在转换… $1',
        done: '完成：$1 → $2。', gifNote: 'GIF：建议片段短于 15 秒左右，GIF 体积增长很快。', fps: 'GIF 帧率', mute: '去除音频', info: '$1 · $2 · $3',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="vc-drop"><strong>${s.drop}</strong>${s.dropSub}</div>
<div class="media-box" id="vc-preview" hidden><video id="vc-video" controls playsinline></video><div class="muted small" id="vc-info"></div></div>
<div class="fields">
  <label class="field"><span>${s.format}</span><select id="vc-fmt"><option value="mp4">MP4 (H.264)</option><option value="webm">WebM (VP8)</option><option value="gif">GIF</option><option value="mov">MOV (H.264)</option></select></label>
  <label class="field"><span>${s.resolution}</span><select id="vc-res"><option value="0">${s.rOriginal}</option><option value="1080">1080p</option><option value="720" selected>720p</option><option value="480">480p</option><option value="360">360p</option></select></label>
  <label class="field" id="vc-q-wrap"><span>${s.quality}</span><select id="vc-q"><option value="high">${s.qHigh}</option><option value="balanced" selected>${s.qBalanced}</option><option value="small">${s.qSmall}</option></select></label>
  <label class="field" id="vc-fps-wrap" hidden><span>${s.fps}</span><select id="vc-fps"><option>8</option><option selected>10</option><option>15</option></select></label>
  <label class="check" id="vc-mute-wrap"><input type="checkbox" id="vc-mute"> ${s.mute}</label>
</div>
<p class="muted small" id="vc-gifnote" hidden>${s.gifNote}</p>
<div class="row"><button class="btn big" id="vc-go" disabled>${s.convert}</button></div>
<div class="status" id="vc-status" hidden></div>
<div class="progress" id="vc-progress" hidden><span></span></div>
<div class="media-box" id="vc-result"></div>`,
};
