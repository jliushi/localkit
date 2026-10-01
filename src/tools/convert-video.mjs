import { html } from '../../build/html.mjs';

export default {
  id: 'convert-video',
  category: 'video',
  iconName: 'repeat-2',
  color: '#2563eb',
  related: ['compress-video', 'video-to-gif', 'video-to-mp3'],
  strings: {
    en: {
      name: 'Convert Video',
      short: 'Convert MOV, MKV, WebM, AVI and more to MP4 (or back), often instantly.',
      keywords: ['video converter', 'mov to mp4', 'mkv to mp4', 'webm to mp4', 'avi to mp4', 'mp4 to webm', 'format'],
      title: 'Video Converter Online Free — MOV/MKV/AVI/WebM to MP4, No Upload',
      desc: 'Convert videos between MP4, MOV, WebM and MKV — MOV to MP4, MKV to MP4, WebM to MP4, AVI to MP4. Instant without re-encoding when possible. Free, private, no upload.',
      h1: 'Convert video to MP4, MOV, WebM or MKV',
      sub: 'This free online video converter changes a video\'s format — MOV to MP4, MKV to MP4, WebM to MP4 — so it plays where you need it. When the video data is already compatible, LocalKit just rewraps it: seconds instead of minutes, original quality, no upload.',
      features: [
        ['zap', 'Instant when possible', 'MOV→MP4, MKV→MP4 and similar conversions usually need no re-encoding: the streams are copied into the new container in seconds.'],
        ['cpu', 'Hardware re-encoding', 'When a codec must change (for example MP4→WebM), the conversion uses your device\'s video encoder, so it is much faster than typical web converters.'],
        ['shield-check', 'Private, no limits', 'Files are converted locally and never uploaded. No sign-up, no watermark, no size cap.'],
      ],
      howToTitle: 'How to convert a video',
      steps: [
        'Drop a video file (MOV, MKV, WebM, AVI, MP4, FLV, 3GP…) on the box.',
        'Choose the output format. LocalKit shows whether it can convert instantly or needs to re-encode.',
        'Press Convert and download the new file.',
      ],
      guide: [
        ['Which format should I choose?', { table: [['Format', 'Use it for'], ['MP4 (H.264)', 'Everything: phones, Windows, Mac, YouTube, WhatsApp, PowerPoint. The safe default.'], ['MOV', 'Apple workflows: iMovie, Final Cut, QuickTime.'], ['WebM (VP9)', 'Websites and browsers; small files with good quality.'], ['MKV', 'Archiving with several audio or subtitle tracks; players like VLC.']] }],
        ['Why some conversions are instant', 'A video file is a container (MP4, MOV, MKV…) holding compressed streams (H.264 video, AAC audio…). If the target container supports the same streams, LocalKit copies them without decoding — "remuxing" — so quality is untouched and speed is limited only by your disk. Re-encoding is only done when the target needs a different codec.'],
        ['Converting to GIF or MP3', 'For animated GIFs use the Video to GIF tool; to keep only the sound use Video to MP3. Both are linked below.'],
      ],
      faq: [
        ['How do I convert MOV to MP4?', 'Drop the MOV file, keep MP4 selected and press Convert. iPhone MOV files are usually converted instantly without re-encoding.'],
        ['Will converting reduce the quality?', 'Not when the conversion is instant (streams are copied). When re-encoding is required, the "High" quality setting keeps the result visually identical for most videos.'],
        ['Can I convert AVI, FLV or WMV?', 'Yes. These older formats are converted to MP4 using a compatibility engine; it is slower than the instant path but still runs entirely in your browser.'],
        ['Is there a file-size limit?', 'No fixed limit; very large files are limited only by your device memory.'],
        ['Are my videos uploaded?', 'No. Everything is converted in your browser.'],
      ],
      ui: {
        drop: 'Drop a video to convert', dropHint: 'MOV, MKV, WebM, AVI, MP4, FLV, 3GP · stays on your device',
        to: 'Convert to', mp4Sub: 'most compatible', movSub: 'Apple', webmSub: 'web', mkvSub: 'archive',
        instant: 'Instant: the video can be rewrapped without re-encoding — original quality.', reencode: 'This needs re-encoding ($1). It uses your device\'s hardware encoder.',
        same: 'This file is already $1. Pick another format, or use Compress Video to make it smaller.',
        more: 'More options', quality: 'Quality (when re-encoding)', qHigh: 'High', qMedium: 'Balanced', qLow: 'Smaller file', resolution: 'Resolution', resOriginal: 'Original',
        convert: 'Convert', converting: 'Converting…', preparing: 'Reading video…', done: 'Converted to $1 · $2', download: 'Download $1', another: 'Convert another video',
        legacy: 'This format is converted with the compatibility engine, which is slower.', gifHint: 'Want an animated GIF?', gifLink: 'Use Video to GIF',
      },
    },
    zh: {
      name: '视频格式转换',
      short: '把 MOV、MKV、WebM、AVI 等转换为 MP4（或反过来），常常秒转。',
      keywords: ['视频转换器', 'mov 转 mp4', 'mkv 转 mp4', 'webm 转 mp4', 'avi 转 mp4', 'mp4 转 webm', '格式转换'],
      title: '视频格式转换 — MOV/MKV/AVI/WebM 转 MP4，免费不上传',
      desc: '视频格式在线转换：MOV、MKV、WebM、AVI 转 MP4，或 MP4 转其他格式。能兼容时无需重新编码，秒速完成。免费、私密，在浏览器本地运行，不上传。',
      h1: '视频格式转换：转 MP4、MOV、WebM 或 MKV',
      sub: '这是一个免费的在线视频格式转换器：把 MOV、MKV、WebM、AVI 转成 MP4（或反过来），让视频在目标设备上能播放。如果视频数据本身就兼容 —— 比如 iPhone 的 MOV —— 只需重新封装，几秒完成，画质不变，不上传。',
      features: [
        ['zap', '能秒转就秒转', 'MOV→MP4、MKV→MP4 这类转换通常不需要重新编码：直接把音视频流复制进新的容器，几秒钟完成。'],
        ['cpu', '硬件加速重新编码', '必须更换编码时（例如 MP4→WebM），会调用设备的视频编码器，比一般的网页转换器快得多。'],
        ['shield-check', '私密，不限量', '文件在本地转换，绝不上传。无需注册、没有水印、不限大小。'],
      ],
      howToTitle: '如何转换视频格式',
      steps: [
        '把视频文件（MOV、MKV、WebM、AVI、MP4、FLV、3GP 等）拖到框里。',
        '选择输出格式。LocalKit 会告诉你能否秒转，还是需要重新编码。',
        '点击「转换」并下载新文件。',
      ],
      guide: [
        ['该选哪种格式？', { table: [['格式', '适用场景'], ['MP4（H.264）', '通用：手机、Windows、Mac、B 站、微信、PPT。最稳妥的默认选择。'], ['MOV', '苹果生态：iMovie、Final Cut、QuickTime。'], ['WebM（VP9）', '网页和浏览器；文件小、画质好。'], ['MKV', '归档、多音轨或多字幕；VLC 等播放器。']] }],
        ['为什么有些转换是秒完成的', '视频文件是一个「容器」（MP4、MOV、MKV…），里面装着压缩好的音视频流（H.264 视频、AAC 音频…）。如果目标容器支持同样的流，LocalKit 会直接复制而不解码 ——「转封装」—— 画质完全不变，速度只受磁盘限制。只有目标需要不同的编码时才会重新编码。'],
        ['转 GIF 或 MP3', '要做 GIF 动图请用「视频转 GIF」，只要声音请用「视频转 MP3」，下方都有链接。'],
      ],
      faq: [
        ['怎么把 MOV 转成 MP4？', '拖入 MOV 文件，保持选择 MP4，点击「转换」。iPhone 拍的 MOV 通常无需重新编码，秒转完成。'],
        ['转换会降低画质吗？', '秒转（直接复制流）时不会。需要重新编码时，选择「高」画质，大多数视频看起来和原来一样。'],
        ['能转换 AVI、FLV、WMV 吗？', '能。这些较老的格式会通过兼容引擎转换为 MP4，比秒转慢，但仍然完全在浏览器中进行。'],
        ['有文件大小限制吗？', '没有固定限制，特别大的文件只受设备内存限制。'],
        ['视频会被上传吗？', '不会，全部在你的浏览器中转换。'],
      ],
      ui: {
        drop: '拖入要转换的视频', dropHint: 'MOV、MKV、WebM、AVI、MP4、FLV、3GP · 文件不离开你的设备',
        to: '转换为', mp4Sub: '兼容性最好', movSub: '苹果', webmSub: '网页', mkvSub: '归档',
        instant: '可秒转：无需重新编码，直接重新封装，保持原始画质。', reencode: '需要重新编码（$1），将使用设备的硬件编码器。',
        same: '这个文件已经是 $1 格式。请选择其他格式，或使用「视频压缩」减小体积。',
        more: '更多选项', quality: '画质（重新编码时）', qHigh: '高', qMedium: '均衡', qLow: '更小文件', resolution: '分辨率', resOriginal: '原始',
        convert: '开始转换', converting: '正在转换…', preparing: '正在读取视频…', done: '已转换为 $1 · $2', download: '下载 $1', another: '转换另一个视频',
        legacy: '该格式将通过兼容引擎转换，速度较慢。', gifHint: '想要 GIF 动图？', gifLink: '使用「视频转 GIF」',
      },
    },
  },
  ui: (s, c, lang) => html`
<div id="cx-pick"></div>
<div id="cx-work" class="panel" hidden>
  <div id="cx-file"></div>
  <div class="opt"><span class="field-label">${s.to}</span><div class="chips" role="radiogroup" aria-label="${s.to}">
    <label class="chip"><input type="radio" name="cx-fmt" value="mp4" checked><span>MP4 <small>${s.mp4Sub}</small></span></label>
    <label class="chip"><input type="radio" name="cx-fmt" value="mov"><span>MOV <small>${s.movSub}</small></span></label>
    <label class="chip"><input type="radio" name="cx-fmt" value="webm"><span>WebM <small>${s.webmSub}</small></span></label>
    <label class="chip"><input type="radio" name="cx-fmt" value="mkv"><span>MKV <small>${s.mkvSub}</small></span></label>
  </div>
  <p class="note">${s.gifHint} <a href="../video-to-gif/">${s.gifLink}</a></p></div>
  <details class="more"><summary>${s.more}</summary><div class="opts">
    <label class="field"><span>${s.quality}</span><select id="cx-q"><option value="high">${s.qHigh}</option><option value="medium" selected>${s.qMedium}</option><option value="low">${s.qLow}</option></select></label>
    <label class="field"><span>${s.resolution}</span><select id="cx-res"><option value="0">${s.resOriginal}</option><option value="1080">1080p</option><option value="720">720p</option><option value="480">480p</option></select></label>
  </div></details>
  <div id="cx-mode"></div>
  <div id="cx-alert"></div>
  <div class="actions"><button class="btn lg" id="cx-go">${s.convert}</button></div>
  <div id="cx-task"></div>
  <div id="cx-result"></div>
</div>`,
};
