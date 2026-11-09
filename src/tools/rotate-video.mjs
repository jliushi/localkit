import { html } from '../../build/html.mjs';

export default {
  id: 'rotate-video',
  category: 'video',
  iconName: 'rotate-cw',
  color: '#0ea5e9',
  related: ['crop-video', 'trim-video', 'compress-video'],
  appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Rotate & Flip Video',
      short: 'Fix a sideways video: rotate 90°, 180°, 270° or mirror it, with a live preview.',
      keywords: ['rotate video', 'flip video', 'fix sideways video', 'mirror video', 'turn video upside down', 'rotate mp4', 'video rotator', 'rotate iphone video'],
      title: 'Rotate Video Online Free — Rotate & Flip MP4, MOV (No Upload)',
      desc: 'Rotate a video 90°, 180° or 270° or flip it horizontally or vertically. See the result live, save in the original format. Free, private, no upload or watermark.',
      h1: 'Rotate and flip a video',
      sub: 'Turn or mirror a clip and check the live preview before saving. Compatible files use lossless rotation metadata; choose re-encoding to bake the change into the picture. Nothing is uploaded.',
      features: [
        ['rotate-cw', 'Rotate and flip with a live preview', 'Turn the video 90° left or right, flip it horizontally or vertically, and see exactly how it will look before you save.'],
        ['zap', 'Lossless when the format supports it', 'Compatible formats store the rotation as metadata, keeping picture data unchanged. Other formats require re-encoding.'],
        ['shield-check', 'Private, in your browser', 'The video is processed on your device. It is never uploaded, and the result keeps the original format and sound.'],
      ],
      howToTitle: 'How to rotate a video',
      steps: [
        'Drop a video on the box, or pick one from your phone.',
        'Press Rotate left or Rotate right until the preview looks right. Use Flip horizontal or Flip vertical to mirror it.',
        'Press Save rotated video and download the result.',
      ],
      guide: [
        ['Two ways to rotate: flag or re-encode', { table: [['Mode', 'How it works', 'Best for'], ['Fast (default)', 'Writes a rotation flag; the video data is untouched', 'Phones, browsers, VLC and most modern players, with no quality loss'], ['Re-encode', 'Turns every frame and re-compresses the video', 'Old players, TVs, editors or sites that ignore the rotation flag']] }, 'If the rotated video still looks sideways in some app, tick "Re-encode so every player shows it rotated" and save again.'],
        ['Why do some videos play sideways?', 'Phones record in one fixed orientation and store a flag that says how to turn the picture. Some players, upload forms and editors ignore that flag, so the clip shows sideways. Rotating it here and, if needed, re-encoding fixes it for good.'],
        ['What does flip do?', 'Flip horizontal mirrors the picture left to right (useful when a selfie camera recorded text backwards). Flip vertical turns it upside down like a reflection in a lake. Rotation and flips can be combined.'],
      ],
      faq: [
        ['How do I rotate a video online?', 'Drop the video, press Rotate right or Rotate left until the preview is the right way up, then press Save rotated video.'],
        ['Does rotating reduce the quality?', 'Metadata rotation keeps picture data unchanged when supported by the container. Re-encoding compresses the video again and can reduce quality.'],
        ['Why does my rotated video still play sideways somewhere?', 'Some players and websites ignore the rotation flag. Tick "Re-encode so every player shows it rotated" and save again; the rotation is then part of the picture itself.'],
        ['Can I rotate videos from my iPhone or Android phone?', 'Yes. Open this page in Safari or Chrome, choose the video from your gallery, rotate it and save it back to your phone.'],
        ['Which formats are supported?', 'MP4, MOV, MKV and WebM keep their format when supported by your browser. M4V and legacy formats such as AVI are saved as MP4. Some codecs may not be readable on your device.'],
        ['Is my video uploaded to a server?', 'No. It is read and processed in your browser and never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a video to rotate', dropHint: 'MP4, MOV, MKV, WebM, AVI · stays on your device', preparing: 'Reading video…',
        rotateLeft: 'Rotate left', rotateRight: 'Rotate right', flipH: 'Flip horizontal', flipV: 'Flip vertical', reset: 'Reset',
        state: 'Result: rotated $1°$2 · shows as $3×$4', stateNone: 'Result: unchanged · $1×$2', flippedH: ', flipped horizontally', flippedV: ', flipped vertically',
        reencode: 'Re-encode so every player shows it rotated (slower)', reencodeHint: 'Leave off to use lossless metadata when the format supports it. Some players ignore rotation metadata.',
        save: 'Save rotated video', saving: 'Rotating…', done: 'Your video is ready · $1', download: 'Download video', another: 'Rotate another video',
        legacy: 'This format is converted to MP4 with the compatibility engine, which is slower.', play: 'Play', preview: 'Live preview of the result',
        nothing: 'Rotate or flip the video first.', modeFast: 'automatic (metadata when supported)', modeEnc: 're-encoded', size: 'Shows as $1×$2',
      },
    },
    zh: {
      name: '视频旋转翻转',
      short: '修正横着或倒着的视频：旋转 90°、180°、270° 或镜像翻转，实时预览。',
      keywords: ['旋转视频', '视频翻转', '视频方向', '视频镜像', '视频倒了', '横屏转竖屏', '视频旋转 90 度', '手机视频旋转'],
      title: '视频旋转翻转 — 在线旋转 MP4/MOV 90 度，免费不上传',
      desc: '把视频旋转 90°、180°、270°，或水平、垂直翻转，实时预览效果，兼容格式可以无损保存，也可重新编码。免费、私密、无水印，视频不会上传，手机电脑都能用。',
      h1: '旋转和翻转视频',
      sub: '旋转或镜像翻转视频，预览确认后再保存。兼容格式优先使用无损旋转标记，也可以重新编码，把方向直接写进画面。视频不会被上传。',
      features: [
        ['rotate-cw', '旋转翻转，实时预览', '向左或向右旋转 90°，水平或垂直翻转，保存前就能看到最终的样子。'],
        ['zap', '兼容格式支持无损旋转', '支持的格式可用标记保存旋转方向，画面数据保持不变。其他格式需要重新编码。'],
        ['shield-check', '在浏览器里私密处理', '视频在你的设备上处理，不会上传；结果保持原来的格式和声音。'],
      ],
      howToTitle: '如何旋转视频',
      steps: [
        '把视频拖到框里，或在手机上点击选择视频。',
        '点击「向左旋转」或「向右旋转」，直到预览方向正确；需要镜像就点击「水平翻转」或「垂直翻转」。',
        '点击「保存旋转后的视频」并下载结果。',
      ],
      guide: [
        ['两种旋转方式：标记或重新编码', { table: [['模式', '原理', '适合'], ['快速（默认）', '只写入旋转标记，视频数据保持不变', '手机、浏览器、VLC 和大多数新播放器，画质无损'], ['重新编码', '把每一帧转正并重新压缩', '不认旋转标记的旧播放器、电视、剪辑软件或网站']] }, '如果旋转后的视频在某个应用里仍然是横的，请勾选「重新编码，让所有播放器都显示为旋转后的样子」后再保存一次。'],
        ['为什么有些视频会横着播放？', '手机总是按固定方向录像，再写入一个告诉播放器如何转正画面的标记。有些播放器、上传页面和剪辑软件会忽略这个标记，视频就显示成横的。在这里旋转并在需要时重新编码，就能彻底解决。'],
        ['「翻转」是什么意思？', '水平翻转是把画面左右镜像（比如前置摄像头把文字拍反了）；垂直翻转是把画面上下颠倒，像水面的倒影。旋转和翻转可以叠加使用。'],
      ],
      faq: [
        ['怎么在线旋转视频？', '拖入视频，点击「向右旋转」或「向左旋转」直到预览方向正确，然后点击「保存旋转后的视频」。'],
        ['旋转会降低画质吗？', '格式支持旋转标记时，画面数据原样保留。重新编码会再次压缩视频，可能降低画质。'],
        ['为什么旋转后的视频在别处还是横的？', '有些播放器和网站会忽略旋转标记。勾选「重新编码，让所有播放器都显示为旋转后的样子」再保存一次，旋转就成了画面本身的一部分。'],
        ['能旋转 iPhone 或安卓手机拍的视频吗？', '可以。用 Safari 或 Chrome 打开本页，从相册选择视频，旋转后保存回手机。'],
        ['支持哪些格式？', '浏览器支持时，MP4、MOV、MKV、WebM 会保持原格式。M4V 和 AVI 等旧格式保存为 MP4。部分编码可能无法在你的设备上读取。'],
        ['视频会上传到服务器吗？', '不会。视频在浏览器中读取和处理，不会离开你的设备。'],
      ],
      ui: {
        drop: '拖入要旋转的视频', dropHint: 'MP4、MOV、MKV、WebM、AVI · 文件不离开你的设备', preparing: '正在读取视频…',
        rotateLeft: '向左旋转', rotateRight: '向右旋转', flipH: '水平翻转', flipV: '垂直翻转', reset: '还原',
        state: '效果：旋转 $1°$2 · 显示为 $3×$4', stateNone: '效果：与原视频相同 · $1×$2', flippedH: '，水平翻转', flippedV: '，垂直翻转',
        reencode: '重新编码，让所有播放器都显示为旋转后的样子（较慢）', reencodeHint: '不勾选时，格式支持则优先写入无损旋转标记。部分播放器会忽略此标记。',
        save: '保存旋转后的视频', saving: '正在旋转…', done: '视频已处理完成 · $1', download: '下载视频', another: '旋转另一个视频',
        legacy: '该格式会通过兼容引擎转换为 MP4，速度较慢。', play: '播放', preview: '结果实时预览',
        nothing: '请先旋转或翻转视频。', modeFast: '自动处理（支持时使用旋转标记）', modeEnc: '已重新编码', size: '显示为 $1×$2',
      },
    },
  },
  ui: (s) => html`
<div id="rv-pick"></div>
<div id="rv-work" class="panel" hidden>
  <div id="rv-file"></div>
  <div class="bv-stage" id="rv-stage"></div>
  <div class="actions rv-btns">
    <button type="button" class="btn soft" id="rv-left">${s.rotateLeft}</button>
    <button type="button" class="btn soft" id="rv-right">${s.rotateRight}</button>
    <button type="button" class="btn soft" id="rv-fh">${s.flipH}</button>
    <button type="button" class="btn soft" id="rv-fv">${s.flipV}</button>
    <button type="button" class="btn ghost" id="rv-reset">${s.reset}</button>
  </div>
  <p class="note" id="rv-state" aria-live="polite"></p>
  <div class="opt">
    <label class="check"><input type="checkbox" id="rv-reencode"> ${s.reencode}</label>
    <span class="note">${s.reencodeHint}</span>
  </div>
  <div id="rv-alert"></div>
  <div class="actions"><button class="btn lg" id="rv-go">${s.save}</button></div>
  <div id="rv-task"></div>
  <div id="rv-result"></div>
</div>`,
};
