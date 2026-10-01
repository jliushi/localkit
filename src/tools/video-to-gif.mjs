import { html } from '../../build/html.mjs';

export default {
  id: 'video-to-gif',
  category: 'video',
  iconName: 'sparkles',
  color: '#db2777',
  related: ['trim-video', 'compress-video', 'convert-video'],
  strings: {
    en: {
      name: 'Video to GIF',
      short: 'Turn a clip from any video into a looping animated GIF.',
      keywords: ['gif maker', 'mp4 to gif', 'animated gif', 'make gif', 'meme'],
      title: 'Video to GIF Converter — Make Animated GIFs from MP4/MOV Free, No Upload',
      desc: 'Make an animated GIF from any video: pick the moment on the filmstrip, choose size, frame rate and speed, and download. MP4, MOV, WebM to GIF in your browser — free, no watermark, no upload.',
      h1: 'Video to GIF — make an animated GIF from a video',
      sub: 'Choose the moment on the filmstrip, set the size and smoothness, and get a looping GIF for chats, docs or memes. Frames are rendered on your device; nothing is uploaded.',
      features: [
        ['film', 'Pick the exact moment', 'Drag the handles over the frames you want (up to 30 seconds) and play the selection to check it.'],
        ['sliders-horizontal', 'Size, smoothness, speed', 'Choose the width, frames per second, playback speed and whether the GIF loops forever or plays once.'],
        ['shield-check', 'No watermark, no upload', 'GIFs are encoded in your browser, so your video stays private and the result is clean.'],
      ],
      howToTitle: 'How to convert a video to GIF',
      steps: [
        'Drop a video (MP4, MOV, WebM…) on the box.',
        'Drag the yellow handles to select the part you want — short clips of 2–6 seconds make the best GIFs.',
        'Pick the width and frame rate, press Make GIF, preview it and download.',
      ],
      guide: [
        ['Keeping GIFs small', 'GIF is an old format with no modern compression, so size grows quickly. Rough sizes for a 4-second clip:', { table: [['Width', '10 fps', '15 fps'], ['320 px', '≈ 0.5–1 MB', '≈ 0.8–1.5 MB'], ['480 px', '≈ 1–2 MB', '≈ 1.5–3 MB'], ['640 px', '≈ 2–4 MB', '≈ 3–6 MB']] }, 'Screen recordings and flat graphics stay much smaller than camera footage. For long or large animations, an MP4 (see Compress Video) is usually 10× smaller and plays everywhere a GIF does.'],
        ['Where GIFs work best', { list: ['Reactions and memes in chats, Slack, Discord and forums.', 'Short product demos in README files, docs and e-mails (e-mail clients don\'t play video).', 'Looping UI animations in presentations.'] }],
      ],
      faq: [
        ['How do I make a GIF from a video?', 'Drop the video, drag the handles to the moment you want, then press Make GIF and download it.'],
        ['How long can the GIF be?', 'Up to 30 seconds. For anything longer, a short MP4 is a better choice — it is far smaller and smoother.'],
        ['Why is my GIF so big?', 'GIFs store every frame with only 256 colours and weak compression. Choose a smaller width (320 or 480 px), fewer frames per second (10) or a shorter selection.'],
        ['Does it add a watermark?', 'No. The GIF is yours, without any branding.'],
        ['Is my video uploaded?', 'No. Frames are decoded and the GIF is encoded inside your browser.'],
      ],
      ui: {
        drop: 'Drop a video to make a GIF', dropHint: 'MP4, MOV, WebM, MKV · stays on your device',
        width: 'Width', fps: 'Frames per second', speed: 'Speed', loop: 'Loop forever',
        make: 'Make GIF', making: 'Rendering frames…', encoding: 'Encoding GIF…', preparing: 'Reading video…',
        done: 'GIF ready · $1 × $2 · $3 frames · $4', download: 'Download GIF', another: 'Use another video', estimate: '$1 frames at $2 px wide',
        legacy: 'This format uses the compatibility engine, which is slower.', smooth: 'smooth', small: 'small',
      },
    },
    zh: {
      name: '视频转 GIF',
      short: '把视频中的片段做成循环播放的 GIF 动图。',
      keywords: ['gif 制作', 'mp4 转 gif', '动图', '表情包', '做动图'],
      title: '视频转 GIF — 在线把 MP4/MOV 做成动图，免费不上传',
      desc: '把任意视频做成 GIF 动图：在缩略图时间轴上选好片段，设置尺寸、帧率和速度，直接下载。MP4、MOV、WebM 转 GIF 在浏览器中完成 —— 免费、无水印、不上传。',
      h1: '视频转 GIF：把视频做成动图',
      sub: '在时间轴上选好片段，设置尺寸和流畅度，就能得到可以循环播放的 GIF，用于聊天、文档或表情包。帧在你的设备上渲染，不上传任何内容。',
      features: [
        ['film', '精确选择片段', '拖动手柄选中想要的画面（最长 30 秒），可以播放选中片段确认效果。'],
        ['sliders-horizontal', '尺寸、流畅度、速度', '可选择宽度、每秒帧数、播放速度，以及循环播放还是只播一次。'],
        ['shield-check', '无水印、不上传', 'GIF 在浏览器中编码，视频保持私密，生成的动图干干净净。'],
      ],
      howToTitle: '如何把视频转换成 GIF',
      steps: [
        '把视频（MP4、MOV、WebM 等）拖到框里。',
        '拖动黄色手柄选中需要的部分 —— 2 到 6 秒的片段最适合做 GIF。',
        '选择宽度和帧率，点击「生成 GIF」，预览后下载。',
      ],
      guide: [
        ['怎样让 GIF 更小', 'GIF 是很老的格式，没有现代压缩，体积增长很快。4 秒片段的大致大小：', { table: [['宽度', '10 帧/秒', '15 帧/秒'], ['320 像素', '约 0.5–1 MB', '约 0.8–1.5 MB'], ['480 像素', '约 1–2 MB', '约 1.5–3 MB'], ['640 像素', '约 2–4 MB', '约 3–6 MB']] }, '录屏和扁平图形会比实拍画面小得多。较长或较大的动画，用 MP4（见「视频压缩」）通常能小 10 倍，而且哪里都能播放。'],
        ['GIF 最适合的场景', { list: ['聊天、微信群、论坛里的表情和梗图。', 'README、文档和邮件里的简短演示（邮件客户端无法播放视频）。', '演示文稿里循环播放的界面动画。'] }],
      ],
      faq: [
        ['怎么把视频做成 GIF？', '拖入视频，拖动手柄选中想要的片段，点击「生成 GIF」并下载即可。'],
        ['GIF 最长可以多长？', '最长 30 秒。更长的内容建议用短 MP4，体积小得多也更流畅。'],
        ['为什么 GIF 这么大？', 'GIF 每一帧只有 256 种颜色，压缩效率很低。可以选更小的宽度（320 或 480 像素）、更低的帧率（10）或更短的片段。'],
        ['会加水印吗？', '不会，生成的 GIF 没有任何标记。'],
        ['视频会被上传吗？', '不会。帧的解码和 GIF 编码都在你的浏览器中完成。'],
      ],
      ui: {
        drop: '拖入视频来制作 GIF', dropHint: 'MP4、MOV、WebM、MKV · 文件不离开你的设备',
        width: '宽度', fps: '每秒帧数', speed: '速度', loop: '循环播放',
        make: '生成 GIF', making: '正在渲染帧…', encoding: '正在编码 GIF…', preparing: '正在读取视频…',
        done: 'GIF 已生成 · $1 × $2 · $3 帧 · $4', download: '下载 GIF', another: '换一个视频', estimate: '共 $1 帧，宽 $2 像素',
        legacy: '该格式使用兼容引擎处理，速度较慢。', smooth: '流畅', small: '小',
      },
    },
  },
  ui: (s) => html`
<div id="vg-pick"></div>
<div id="vg-work" class="panel" hidden>
  <div id="vg-file"></div>
  <div id="vg-player" class="player-fit"></div>
  <div id="vg-tl"></div>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.width}</span><div class="chips" id="vg-width" role="radiogroup" aria-label="${s.width}">
      <label class="chip"><input type="radio" name="vg-w" value="320"><span>320 px</span></label>
      <label class="chip"><input type="radio" name="vg-w" value="480" checked><span>480 px</span></label>
      <label class="chip"><input type="radio" name="vg-w" value="640"><span>640 px</span></label>
    </div></div>
    <div class="opt"><span class="field-label">${s.fps}</span><div class="chips" role="radiogroup" aria-label="${s.fps}">
      <label class="chip"><input type="radio" name="vg-fps" value="8"><span>8 <small>${s.small}</small></span></label>
      <label class="chip"><input type="radio" name="vg-fps" value="12" checked><span>12</span></label>
      <label class="chip"><input type="radio" name="vg-fps" value="20"><span>20 <small>${s.smooth}</small></span></label>
    </div></div>
    <div class="opt"><span class="field-label">${s.speed}</span><div class="chips" role="radiogroup" aria-label="${s.speed}">
      <label class="chip"><input type="radio" name="vg-speed" value="0.5"><span>0.5×</span></label>
      <label class="chip"><input type="radio" name="vg-speed" value="1" checked><span>1×</span></label>
      <label class="chip"><input type="radio" name="vg-speed" value="2"><span>2×</span></label>
    </div></div>
  </div>
  <label class="check"><input type="checkbox" id="vg-loop" checked> ${s.loop}</label>
  <div class="estimate" id="vg-est"></div>
  <div id="vg-alert"></div>
  <div class="actions"><button class="btn lg" id="vg-go">${s.make}</button></div>
  <div id="vg-task"></div>
  <div id="vg-result"></div>
</div>`,
};
