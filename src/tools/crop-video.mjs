import { html } from '../../build/html.mjs';

export default {
  id: 'crop-video',
  category: 'video',
  iconName: 'crop',
  color: '#f97316',
  related: ['rotate-video', 'blur-video', 'compress-video'],
  appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Crop Video',
      short: 'Crop the picture to any size or a 9:16, 1:1, 16:9 or 4:3 frame — drag a box over the video.',
      keywords: ['crop video', 'video cropper', 'make video vertical', 'video 9:16', 'tiktok video size', 'instagram reels crop', 'youtube shorts crop', 'remove black bars', 'square video'],
      title: 'Crop Video Online Free — Make 9:16, 1:1 or 16:9 (No Upload)',
      desc: 'Crop video with a draggable box or choose 9:16 for Reels and Shorts, 1:1, 16:9 or 4:3. Set exact pixels, preview and export privately. No upload.',
      h1: 'Crop a video to any size or aspect ratio',
      sub: 'Crop Video cuts away the edges of the picture: drag the box and its handles over the video, or pick a ready-made shape such as 9:16 for TikTok, Instagram Reels and YouTube Shorts. Fine-tune with exact pixel values, then export. Your video is processed on your device and never uploaded.',
      features: [
        ['crop', 'Drag, resize or type the area', 'Move the crop box, pull its corners and edges, or enter the exact left, top, width and height in pixels. The box can never leave the frame.'],
        ['smartphone', 'Presets for every platform', 'Free, 16:9, 9:16, 1:1 and 4:3 lock the shape while you resize. 9:16 turns a landscape clip into a vertical video for TikTok, Reels and Shorts.'],
        ['shield-check', 'Private and watermark-free', 'The video is cropped in your browser using your device, with no upload, no sign-up and no watermark. The sound is kept.'],
      ],
      howToTitle: 'How to crop a video',
      steps: [
        'Drop a video on the box, or pick one from your phone.',
        'Choose a shape (Free, 16:9, 9:16, 1:1, 4:3) and drag the box over the part of the picture you want to keep. Use the numbers below to fine-tune it.',
        'Press Crop video and download the result.',
      ],
      guide: [
        ['Which aspect ratio should I choose?', { table: [['Ratio', 'Typical use'], ['9:16', 'Vertical video: TikTok, Instagram Reels and Stories, YouTube Shorts'], ['1:1', 'Square posts on Instagram, Facebook and LinkedIn'], ['16:9', 'Widescreen: YouTube, presentations, TVs'], ['4:3', 'Older TV and tablet-style frames'], ['Free', 'Any shape, for example to remove black bars or a border']] }],
        ['Cropping versus resizing', 'Cropping removes part of the picture and keeps the rest at its original pixel size, so the result is sharp. It does not stretch or squash anything. To make the file smaller afterwards, use Compress Video.'],
        ['Good to know', 'Cropping changes the picture, so the video is re-encoded once (the sound is copied through). The output size is the size of the box, rounded to even numbers because video formats require it.'],
      ],
      faq: [
        ['How do I crop a video online?', 'Drop the video, drag the box (or its corners and edges) over the part you want to keep, and press Crop video.'],
        ['How do I turn a landscape video into a vertical 9:16 video?', 'Pick the 9:16 preset. The box becomes a tall frame; drag it left or right to choose which part of the picture stays, then press Crop video.'],
        ['Can I crop to an exact pixel size?', 'Yes. Type the left, top, width and height in pixels. With an aspect ratio selected, changing the width also updates the height to keep the shape.'],
        ['Does cropping reduce the video quality?', 'The part you keep is not scaled, so it stays sharp. Because the picture is changed, the video is re-encoded once at high quality.'],
        ['Can I crop videos on my iPhone or Android phone?', 'Yes. Open this page in Safari or Chrome, choose the video from your gallery and drag the box with your finger.'],
        ['Is my video uploaded to a server?', 'No. Everything happens in your browser and the file never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a video to crop', dropHint: 'MP4, MOV, MKV, WebM, AVI · stays on your device', preparing: 'Reading video…',
        hint: 'Drag the box to move it and the handles to resize it. Pick a shape to lock the aspect ratio.',
        shape: 'Shape', free: 'Free', area: 'Crop area (pixels)', left: 'Left', top: 'Top', width: 'Width', height: 'Height', reset: 'Whole frame',
        output: 'Output: $1×$2 ($3)', ratioFree: 'free shape', crop: 'Crop video', cropping: 'Cropping…', done: 'Cropped to $1×$2 · $3', download: 'Download video', another: 'Crop another video',
        nothing: 'The box covers the whole video. Drag it smaller to crop.', legacy: 'This format is converted to MP4 with the compatibility engine, which is slower.',
        play: 'Play', box: 'Crop box',
      },
    },
    zh: {
      name: '视频裁剪',
      short: '裁剪视频画面：在视频上拖动裁剪框，或直接选 9:16、1:1、16:9、4:3。',
      keywords: ['裁剪视频画面', '视频改成竖屏', '视频裁剪', '横屏转竖屏', '视频 9:16', '抖音视频尺寸', '视频去黑边', '正方形视频', '视频画面裁剪'],
      title: '视频画面裁剪 — 在线改成 9:16 竖屏、1:1，免费不上传',
      desc: '在视频上拖动裁剪框裁剪画面，或一键选择 9:16（抖音、Reels、Shorts）、1:1、16:9、4:3。可输入精确像素、实时预览，导出 MP4，免费、私密，视频不上传。',
      h1: '裁剪视频画面，改成任意尺寸或比例',
      sub: '视频裁剪用来去掉画面的边缘：在视频上拖动裁剪框和它的手柄，或直接选择现成的比例，比如适合抖音、Instagram Reels、YouTube Shorts 的 9:16 竖屏。还能输入精确像素微调，然后导出。视频在你的设备上处理，不会上传。',
      features: [
        ['crop', '拖动、缩放或直接输入', '移动裁剪框，拖动四角和四边调整大小，也可以输入精确的左、上、宽、高像素值。裁剪框不会超出画面。'],
        ['smartphone', '覆盖各大平台的比例', '自由、16:9、9:16、1:1、4:3 会在缩放时锁定形状。9:16 可以把横屏视频改成适合抖音、Reels、Shorts 的竖屏。'],
        ['shield-check', '私密、无水印', '视频在浏览器里利用你的设备裁剪，无需上传、无需注册、没有水印，声音会保留。'],
      ],
      howToTitle: '如何裁剪视频',
      steps: [
        '把视频拖到框里，或在手机上点击选择视频。',
        '选择比例（自由、16:9、9:16、1:1、4:3），把裁剪框拖到想保留的画面上；可用下方的数字微调。',
        '点击「裁剪视频」并下载结果。',
      ],
      guide: [
        ['该选哪个比例？', { table: [['比例', '常见用途'], ['9:16', '竖屏视频：抖音、Instagram Reels 和快拍、YouTube Shorts'], ['1:1', 'Instagram、Facebook、LinkedIn 的方形帖子'], ['16:9', '宽屏：YouTube、演示文稿、电视'], ['4:3', '较老的电视和平板比例'], ['自由', '任意形状，比如去掉黑边或边框']] }],
        ['裁剪和缩放的区别', '裁剪是去掉一部分画面，保留部分的像素尺寸不变，所以依然清晰，不会拉伸或压扁。如果之后想让文件更小，可以再用「视频压缩」。'],
        ['需要知道的', '裁剪会改变画面，所以视频会重新编码一次（声音直接复制）。输出尺寸就是裁剪框的大小，并取偶数，因为视频格式要求如此。'],
      ],
      faq: [
        ['怎么在线裁剪视频？', '拖入视频，把裁剪框（或它的四角、四边）拖到想保留的部分，然后点击「裁剪视频」。'],
        ['怎么把横屏视频改成 9:16 竖屏？', '选择 9:16 比例，裁剪框会变成竖长的形状；左右拖动它来选择保留画面的哪一部分，然后点击「裁剪视频」。'],
        ['能按精确像素裁剪吗？', '可以。直接输入左、上、宽、高的像素值。选定比例后，修改宽度会同时更新高度以保持形状。'],
        ['裁剪会降低画质吗？', '保留的部分不会被缩放，所以依然清晰。由于画面被修改，视频会以高质量重新编码一次。'],
        ['能在 iPhone 或安卓手机上裁剪视频吗？', '可以。用 Safari 或 Chrome 打开本页，从相册选择视频，用手指拖动裁剪框即可。'],
        ['视频会上传到服务器吗？', '不会。所有处理都在浏览器中完成，文件不会离开你的设备。'],
      ],
      ui: {
        drop: '拖入要裁剪的视频', dropHint: 'MP4、MOV、MKV、WebM、AVI · 文件不离开你的设备', preparing: '正在读取视频…',
        hint: '拖动裁剪框移动位置，拖动手柄调整大小；选择比例可锁定宽高比。',
        shape: '比例', free: '自由', area: '裁剪区域（像素）', left: '左', top: '上', width: '宽', height: '高', reset: '整个画面',
        output: '输出：$1×$2（$3）', ratioFree: '自由比例', crop: '裁剪视频', cropping: '正在裁剪…', done: '已裁剪为 $1×$2 · $3', download: '下载视频', another: '裁剪另一个视频',
        nothing: '裁剪框覆盖了整个视频，请把它拖小一些再裁剪。', legacy: '该格式会通过兼容引擎转换为 MP4，速度较慢。',
        play: '播放', box: '裁剪框',
      },
    },
  },
  ui: (s) => html`
<div id="cr-pick"></div>
<div id="cr-work" class="panel" hidden>
  <div id="cr-file"></div>
  <p class="note">${s.hint}</p>
  <div class="bv-stage" id="cr-stage"></div>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.shape}</span><div class="chips" id="cr-shapes">
      <label class="chip"><input type="radio" name="cr-ratio" value="free" checked><span>${s.free}</span></label>
      <label class="chip"><input type="radio" name="cr-ratio" value="16:9"><span>16:9</span></label>
      <label class="chip"><input type="radio" name="cr-ratio" value="9:16"><span>9:16</span></label>
      <label class="chip"><input type="radio" name="cr-ratio" value="1:1"><span>1:1</span></label>
      <label class="chip"><input type="radio" name="cr-ratio" value="4:3"><span>4:3</span></label>
    </div></div>
    <div class="opt"><span class="field-label">${s.area}</span><div class="cr-nums">
      <label class="field"><span>${s.left}</span><input type="number" id="cr-x" min="0" step="2" inputmode="numeric"></label>
      <label class="field"><span>${s.top}</span><input type="number" id="cr-y" min="0" step="2" inputmode="numeric"></label>
      <label class="field"><span>${s.width}</span><input type="number" id="cr-w" min="2" step="2" inputmode="numeric"></label>
      <label class="field"><span>${s.height}</span><input type="number" id="cr-h" min="2" step="2" inputmode="numeric"></label>
    </div></div>
  </div>
  <p class="note" id="cr-out" aria-live="polite"></p>
  <div id="cr-alert"></div>
  <div class="actions"><button class="btn lg" id="cr-go">${s.crop}</button><button type="button" class="btn ghost" id="cr-reset">${s.reset}</button></div>
  <div id="cr-task"></div>
  <div id="cr-result"></div>
</div>`,
};
