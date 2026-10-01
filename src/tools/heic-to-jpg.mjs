import { html } from '../../build/html.mjs';

export default {
  id: 'heic-to-jpg',
  category: 'image',
  iconName: 'smartphone',
  color: '#f97316',
  related: ['convert-image', 'compress-image', 'jpg-to-pdf'],
  appCategory: 'DesignApplication',
  strings: {
    en: {
      name: 'HEIC to JPG',
      short: 'Convert iPhone HEIC photos to JPG (or PNG) in bulk.',
      keywords: ['heic converter', 'heif to jpg', 'iphone photo to jpg', 'heic to png', 'open heic on windows'],
      title: 'HEIC to JPG Converter — Convert iPhone Photos to JPG Free, in Bulk (No Upload)',
      desc: 'Convert HEIC and HEIF photos from iPhone to JPG or PNG in bulk, right in your browser. Keeps full resolution, fixes rotation, removes location data. Free, private — photos are never uploaded.',
      h1: 'Convert HEIC photos to JPG',
      sub: 'iPhones save photos as HEIC, which many Windows apps, websites and printers can\'t open. Drop your HEIC files to get standard JPGs at full resolution — privately, on your own device.',
      features: [
        ['smartphone', 'Made for iPhone photos', 'Converts .heic and .heif files from iPhone and iPad, with the correct orientation and full resolution.'],
        ['layers', 'Hundreds at once', 'Drop a whole export from your phone; download the JPGs individually or as one ZIP.'],
        ['map-pin-off', 'Private by default', 'Photos are decoded in your browser, and location data is not copied into the JPGs.'],
      ],
      howToTitle: 'How to convert HEIC to JPG',
      steps: ['Drop your HEIC photos on the box (or pick them from Files on your phone).', 'They are converted to JPG straight away. Choose PNG or WebP if you prefer.', 'Download each photo or all of them as a ZIP.'],
      guide: [
        ['What is HEIC?', 'HEIC (High Efficiency Image Container, based on HEIF) is the photo format iPhones use by default since iOS 11. It stores photos at about half the size of JPG, but support outside Apple devices is patchy — Windows needs an extra codec, and many upload forms reject it.'],
        ['Stop your iPhone from saving HEIC', 'Settings → Camera → Formats → "Most Compatible" makes new photos JPG. Existing photos stay HEIC, so convert them here.'],
      ],
      faq: [
        ['How do I open HEIC files on Windows?', 'Convert them to JPG here — JPG opens in every Windows app, browser and image viewer.'],
        ['Will converting HEIC to JPG lose quality?', 'At the default quality (90) the difference is invisible. Choose PNG for a lossless copy (larger files).'],
        ['Can I convert many HEIC photos at once?', 'Yes. Drop them all; each converts in turn and you can download a ZIP of everything.'],
        ['Are live photos supported?', 'The still image of a Live Photo is converted; the short video part is not included.'],
        ['Are my photos uploaded?', 'No. Decoding and conversion happen in your browser.'],
      ],
      ui: {
        drop: 'Drop HEIC photos here', dropHint: '.heic, .heif (also JPG/PNG/WebP) · batch · stays on your device', add: 'Add more photos',
        to: 'Convert to', quality: 'Quality', avifNo: 'AVIF', summary: '$1 photos · $2 → $3', zip: 'Download all (ZIP)', clear: 'Clear all',
      },
    },
    zh: {
      name: 'HEIC 转 JPG',
      short: '把 iPhone 的 HEIC 照片批量转换成 JPG（或 PNG）。',
      keywords: ['heic 转换', 'heic 转 jpg', 'iphone 照片转 jpg', 'heic 转 png', 'heic 打不开', 'heif'],
      title: 'HEIC 转 JPG — 免费批量把 iPhone 照片转成 JPG（不上传）',
      desc: '在浏览器中把 iPhone 的 HEIC、HEIF 照片批量转换成 JPG 或 PNG。保持原始分辨率，自动校正方向，去除位置信息。免费、私密 —— 照片绝不上传。',
      h1: '把 HEIC 照片转换成 JPG',
      sub: 'iPhone 默认用 HEIC 格式保存照片，很多 Windows 软件、网站和打印店都打不开。拖入 HEIC 文件即可得到原始分辨率的标准 JPG —— 在你自己的设备上私密完成。',
      features: [
        ['smartphone', '专为 iPhone 照片设计', '转换 iPhone 和 iPad 的 .heic、.heif 文件，方向正确，分辨率不变。'],
        ['layers', '几百张一起转', '把手机导出的照片整批拖进来，可以逐张下载 JPG，也可以打包成一个 ZIP。'],
        ['map-pin-off', '默认保护隐私', '照片在浏览器中解码，位置信息不会被复制到 JPG 里。'],
      ],
      howToTitle: '如何把 HEIC 转换成 JPG',
      steps: ['把 HEIC 照片拖到框里（手机上可以从「文件」中选择）。', '会立即转换为 JPG。如果需要，也可以选择 PNG 或 WebP。', '逐张下载，或打包成 ZIP 一次下载。'],
      guide: [
        ['HEIC 是什么？', 'HEIC（高效图像容器，基于 HEIF）是 iOS 11 起 iPhone 默认的照片格式。它的体积大约只有 JPG 的一半，但在苹果设备以外支持不佳 —— Windows 需要额外安装解码器，很多上传表单也不接受。'],
        ['让 iPhone 不再保存 HEIC', '设置 → 相机 → 格式 → 选择「兼容性最佳」，之后拍的照片就是 JPG。已有的照片仍是 HEIC，可以在这里转换。'],
      ],
      faq: [
        ['Windows 上怎么打开 HEIC 文件？', '在这里转换成 JPG —— JPG 在所有 Windows 软件、浏览器和看图工具里都能打开。'],
        ['HEIC 转 JPG 会损失画质吗？', '默认质量（90）下看不出区别。如果需要无损副本，可以选择 PNG（文件更大）。'],
        ['能一次转换很多张 HEIC 照片吗？', '能。全部拖进来，会依次转换，还可以一次下载包含所有照片的 ZIP。'],
        ['支持实况照片（Live Photo）吗？', '会转换实况照片的静态画面，不包含其中的短视频部分。'],
        ['照片会被上传吗？', '不会，解码和转换都在你的浏览器中完成。'],
      ],
      ui: {
        drop: '把 HEIC 照片拖到这里', dropHint: '.heic、.heif（也支持 JPG/PNG/WebP）· 支持批量 · 文件不离开你的设备', add: '继续添加照片',
        to: '转换为', quality: '质量', avifNo: 'AVIF', summary: '$1 张照片 · $2 → $3', zip: '全部下载（ZIP）', clear: '全部清除',
      },
    },
  },
  ui: (s) => html`
<div class="opts">
  <div class="opt"><span class="field-label">${s.to}</span><div class="chips">
    <label class="chip"><input type="radio" name="hj-f" value="image/jpeg" checked><span>JPG</span></label>
    <label class="chip"><input type="radio" name="hj-f" value="image/png"><span>PNG</span></label>
    <label class="chip"><input type="radio" name="hj-f" value="image/webp"><span>WebP</span></label>
  </div></div>
  <label class="field opt" id="hj-q-wrap"><span>${s.quality}: <b id="hj-qv">90</b></span><input type="range" id="hj-q" min="50" max="100" value="90"></label>
</div>
<div id="hj-pick" style="margin-top:16px"></div>
<div id="hj-work" class="panel" hidden style="margin-top:16px">
  <div class="actions"><span class="estimate" id="hj-summary"></span><span style="flex:1"></span><button class="btn" id="hj-zip" hidden>${s.zip}</button><button class="btn ghost sm" id="hj-clear">${s.clear}</button></div>
  <div id="hj-alert"></div>
  <div class="out-grid" id="hj-grid"></div>
  <div id="hj-more"></div>
</div>`,
};
