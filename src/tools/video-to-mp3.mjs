import { html } from '../../build/html.mjs';

export default {
  id: 'video-to-mp3',
  category: 'video',
  iconName: 'music',
  color: '#0284c7',
  related: ['trim-video', 'ai-subtitle-generator', 'convert-video'],
  strings: {
    en: {
      name: 'Video to MP3',
      short: 'Extract the audio from any video as MP3, M4A or WAV in seconds.',
      keywords: ['extract audio', 'mp4 to mp3', 'convert video to audio', 'audio converter', 'm4a', 'wav'],
      title: 'Video to MP3 Converter — Extract Audio from MP4/MOV Free, No Upload',
      desc: 'Convert MP4, MOV, MKV or WebM to MP3, M4A or WAV in seconds. Drop a video and the audio is extracted instantly in your browser — choose quality, keep only part of it. Free, private, no watermark.',
      h1: 'Video to MP3 — extract audio from video',
      sub: 'Drop a video and get its soundtrack as an MP3 a moment later. Pick M4A for lossless-quality AAC or WAV for editing, and keep just the part you need.',
      features: [
        ['zap', 'Starts instantly', 'No settings needed: the MP3 is ready seconds after you drop the file. Change the format or quality any time and it re-converts.'],
        ['audio-lines', 'Your choice of quality', 'MP3 at 128, 192 or 320 kbps, M4A (AAC, copied without re-encoding when possible) or uncompressed WAV.'],
        ['scissors', 'Keep only a part', 'Need just a song or a quote? Turn on "Only part of it" and drag the handles over the section you want.'],
      ],
      howToTitle: 'How to convert video to MP3',
      steps: [
        'Drop a video (MP4, MOV, MKV, WebM, AVI…) or an audio file on the box.',
        'The MP3 is extracted automatically. Optionally change the format, quality, or select only part of the audio.',
        'Listen to the preview and press Download.',
      ],
      guide: [
        ['MP3, M4A or WAV?', { table: [['Format', 'Best for', 'Size (per minute)'], ['MP3 192 kbps', 'Music and podcasts on any device', '≈ 1.4 MB'], ['MP3 128 kbps', 'Speech, lectures, voice notes', '≈ 0.9 MB'], ['MP3 320 kbps', 'Highest MP3 quality', '≈ 2.3 MB'], ['M4A (AAC)', 'Keeping the original quality; Apple devices', 'same as source'], ['WAV', 'Editing in Audacity, Premiere, DAWs', '≈ 10 MB']] }],
        ['Lossless M4A extraction', 'Most MP4 and MOV videos — including iPhone and Android recordings — already contain AAC audio. Choosing M4A copies that audio track unchanged, so there is no quality loss at all and even a two-hour video is processed in a few seconds.'],
        ['Converting audio files', 'This tool also works as an audio converter: drop an M4A, WAV, FLAC, OGG or AAC file to turn it into MP3, M4A or WAV.'],
      ],
      faq: [
        ['How do I convert an MP4 video to MP3?', 'Drop the MP4 on this page. The audio is extracted to MP3 automatically; press Download when the preview appears.'],
        ['Will the audio quality be reduced?', 'MP3 is a compressed format, but at 192 or 320 kbps it is hard to tell apart from the original. Choose M4A to keep the original audio unchanged.'],
        ['Can I extract audio from only part of a video?', 'Yes. Turn on "Only part of it", drag the handles to the section you want, and the result updates.'],
        ['Is there a file-size limit?', 'No fixed limit. Long videos work because only the audio is processed.'],
        ['Does it work on iPhone and Android?', 'Yes. Open the page in Safari or Chrome, pick a video from your gallery and download the MP3.'],
        ['Is my video uploaded?', 'No. The audio is extracted inside your browser; the video never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a video or audio file', dropHint: 'MP4, MOV, MKV, WebM, AVI, M4A, WAV… · stays on your device',
        format: 'Format', quality: 'Quality', q128: '128 kbps', q128s: 'speech', q192: '192 kbps', q192s: 'recommended', q320: '320 kbps', q320s: 'best',
        m4aCopy: 'original quality', wavSub: 'uncompressed', partial: 'Only part of it', converting: 'Extracting audio…', preparing: 'Reading file…',
        ready: '$1 ready · $2 · $3', download: 'Download $1', another: 'Convert another file', noAudio: 'This video has no audio track.',
        legacy: 'This format uses the compatibility engine, which is slower.',
      },
    },
    zh: {
      name: '视频转 MP3',
      short: '几秒钟把任意视频的声音提取为 MP3、M4A 或 WAV。',
      keywords: ['提取音频', 'mp4 转 mp3', '视频转音频', '音频转换', 'm4a', 'wav', '提取背景音乐'],
      title: '视频转 MP3 — 在线从 MP4/MOV 提取音频，免费不上传',
      desc: '几秒钟把 MP4、MOV、MKV、WebM 转成 MP3、M4A 或 WAV。拖入视频即可在浏览器里立刻提取音频，可选音质、可只保留一段。免费、私密、无水印。',
      h1: '视频转 MP3：从视频中提取音频',
      sub: '拖入视频，片刻之后就能得到它的 MP3 音频。想要原汁原味的 AAC 选 M4A，要剪辑就选 WAV，还可以只保留需要的那一段。',
      features: [
        ['zap', '拖入即开始', '无需任何设置：拖入文件几秒后 MP3 就准备好了。随时更改格式或音质，会自动重新转换。'],
        ['audio-lines', '音质随你选', 'MP3 可选 128、192、320 kbps；M4A（AAC，可能时直接复制不重新编码）；或无压缩的 WAV。'],
        ['scissors', '只保留一段', '只想要一首歌或一句话？打开「只要其中一段」，拖动手柄选中需要的部分即可。'],
      ],
      howToTitle: '如何把视频转换成 MP3',
      steps: [
        '把视频（MP4、MOV、MKV、WebM、AVI 等）或音频文件拖到框里。',
        '会自动提取为 MP3。也可以更改格式、音质，或只选择其中一段。',
        '试听预览，然后点击「下载」。',
      ],
      guide: [
        ['选 MP3、M4A 还是 WAV？', { table: [['格式', '适合', '每分钟大小'], ['MP3 192 kbps', '音乐、播客，所有设备通用', '约 1.4 MB'], ['MP3 128 kbps', '讲话、课程、语音备忘', '约 0.9 MB'], ['MP3 320 kbps', 'MP3 最高音质', '约 2.3 MB'], ['M4A（AAC）', '保留原始音质；苹果设备', '与原视频相同'], ['WAV', '在 Audacity、剪映、Premiere 中编辑', '约 10 MB']] }],
        ['无损提取 M4A', '大多数 MP4 和 MOV 视频（包括 iPhone 和安卓手机拍的）里本来就是 AAC 音频。选择 M4A 会原样复制这条音轨，完全没有音质损失，即使两小时的视频也只需几秒钟。'],
        ['转换音频文件', '这个工具也是音频格式转换器：拖入 M4A、WAV、FLAC、OGG、AAC 文件，即可转换为 MP3、M4A 或 WAV。'],
      ],
      faq: [
        ['怎么把 MP4 视频转成 MP3？', '把 MP4 拖到本页，会自动提取为 MP3；出现试听播放器后点击「下载」即可。'],
        ['音质会变差吗？', 'MP3 是压缩格式，但 192 或 320 kbps 时很难听出和原声的区别。如果想完全保留原始音频，请选择 M4A。'],
        ['可以只提取视频中的一段音频吗？', '可以。打开「只要其中一段」，拖动手柄选择需要的部分，结果会自动更新。'],
        ['有文件大小限制吗？', '没有固定限制。因为只处理音频，很长的视频也可以。'],
        ['手机上能用吗？', '能。在 Safari 或 Chrome 中打开本页，从相册选择视频，然后下载 MP3。'],
        ['视频会被上传吗？', '不会。音频在你的浏览器中提取，视频不会离开你的设备。'],
      ],
      ui: {
        drop: '拖入视频或音频文件', dropHint: 'MP4、MOV、MKV、WebM、AVI、M4A、WAV… · 文件不离开你的设备',
        format: '格式', quality: '音质', q128: '128 kbps', q128s: '讲话', q192: '192 kbps', q192s: '推荐', q320: '320 kbps', q320s: '最佳',
        m4aCopy: '原始音质', wavSub: '无压缩', partial: '只要其中一段', converting: '正在提取音频…', preparing: '正在读取文件…',
        ready: '$1 已就绪 · $2 · $3', download: '下载 $1', another: '转换另一个文件', noAudio: '这个视频没有音轨。',
        legacy: '该格式使用兼容引擎处理，速度较慢。',
      },
    },
  },
  ui: (s) => html`
<div id="va-pick"></div>
<div id="va-work" class="panel" hidden>
  <div id="va-file"></div>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.format}</span><div class="chips" role="radiogroup" aria-label="${s.format}">
      <label class="chip"><input type="radio" name="va-fmt" value="mp3" checked><span>MP3</span></label>
      <label class="chip"><input type="radio" name="va-fmt" value="m4a"><span>M4A <small>${s.m4aCopy}</small></span></label>
      <label class="chip"><input type="radio" name="va-fmt" value="wav"><span>WAV <small>${s.wavSub}</small></span></label>
    </div></div>
    <div class="opt" id="va-q-wrap"><span class="field-label">${s.quality}</span><div class="chips" role="radiogroup" aria-label="${s.quality}">
      <label class="chip"><input type="radio" name="va-q" value="128000"><span>${s.q128} <small>${s.q128s}</small></span></label>
      <label class="chip"><input type="radio" name="va-q" value="192000" checked><span>${s.q192} <small>${s.q192s}</small></span></label>
      <label class="chip"><input type="radio" name="va-q" value="320000"><span>${s.q320} <small>${s.q320s}</small></span></label>
    </div></div>
  </div>
  <label class="check"><input type="checkbox" id="va-part"> ${s.partial}</label>
  <div id="va-range" class="panel" hidden><div id="va-player" class="player-fit"></div><div id="va-tl"></div></div>
  <div id="va-alert"></div>
  <div id="va-task"></div>
  <div id="va-result"></div>
</div>`,
};
