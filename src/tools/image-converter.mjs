import { html } from '../../build/html.mjs';

export default {
  id: 'image-converter',
  category: 'image',
  icon: 'IMG',
  color: '#db2777',
  strings: {
    en: {
      name: 'Image Converter',
      title: 'Image Converter — HEIC, WebP, PNG, JPG, AVIF, ICO Online, Batch & Free',
      desc: 'Convert images between JPG, PNG, WebP, AVIF and ICO, including iPhone HEIC photos. Batch convert, resize and compress in your browser — no upload, no watermark.',
      h1: 'Convert images to JPG, PNG, WebP, AVIF or ICO',
      lead: 'Batch-convert photos and graphics, including iPhone HEIC pictures, with quality and resize control. Conversion happens on your device, so even private photos are safe.',
      steps: [
        'Drop images (JPG, PNG, WebP, GIF, BMP, AVIF, SVG or HEIC) on the box, or click to choose them.',
        'Pick the output format, quality and optional maximum size.',
        'Click Convert, then download each image or all of them as a ZIP.',
      ],
      faq: [
        ['How do I convert HEIC to JPG?', 'Drop the HEIC photos from your iPhone, choose JPG and click Convert. HEIC decoding runs in your browser, so the photos are never uploaded.'],
        ['Which format should I choose?', 'JPG for photos with the widest compatibility, PNG for screenshots and graphics that need sharp edges or transparency, WebP or AVIF for the smallest files on websites, ICO for website favicons.'],
        ['Does converting reduce quality?', 'PNG is lossless. JPG, WebP and AVIF are lossy: a quality of 80–90 looks the same as the original for most photos while making files much smaller.'],
        ['Why is AVIF disabled?', 'Saving AVIF needs browser support for AVIF encoding. If your browser lacks it, the option is disabled; WebP gives similar savings.'],
        ['Is there a limit on the number of files?', 'No. You can convert hundreds of images at once; the only limit is your device memory.'],
      ],
      ui: {
        drop: 'Drop images here or click to choose', dropSub: 'JPG, PNG, WebP, GIF, BMP, AVIF, SVG, HEIC · batch supported',
        format: 'Convert to', quality: 'Quality', maxSize: 'Max width/height (px)', maxSizeHint: 'empty = keep size',
        background: 'Background for transparent areas', convert: 'Convert $1 images', converting: 'Converting $1 of $2…',
        doneN: '$1 images converted. Total $2 → $3.', avifNo: 'AVIF (not supported by this browser)', failed: 'Could not read $1',
        decodingHeic: 'Decoding HEIC…', icoNote: 'ICO is saved at up to 256 × 256 px.',
      },
    },
    zh: {
      name: '图片格式转换',
      title: '图片格式转换 — HEIC、WebP、PNG、JPG、AVIF、ICO 在线批量转换，免费',
      desc: '在 JPG、PNG、WebP、AVIF、ICO 之间转换图片，支持苹果手机 HEIC 照片。在浏览器里批量转换、调整尺寸和压缩，不上传、无水印。',
      h1: '图片转换为 JPG、PNG、WebP、AVIF 或 ICO',
      lead: '批量转换照片和图片，包括 iPhone 拍的 HEIC 照片，可调节质量和尺寸。转换在你的设备上完成，私密照片也安全。',
      steps: [
        '把图片（JPG、PNG、WebP、GIF、BMP、AVIF、SVG 或 HEIC）拖到框里，或点击选择。',
        '选择输出格式、质量，以及可选的最大尺寸。',
        '点击「转换」，然后逐个下载，或打包成 ZIP 一次下载。',
      ],
      faq: [
        ['HEIC 怎么转 JPG？', '把 iPhone 的 HEIC 照片拖进来，选择 JPG，点击转换即可。HEIC 解码在浏览器中进行，照片不会被上传。'],
        ['应该选哪种格式？', '照片选 JPG，兼容性最好；截图和需要透明背景的图形选 PNG；网站用图选 WebP 或 AVIF，文件最小；网站图标选 ICO。'],
        ['转换会降低画质吗？', 'PNG 是无损格式。JPG、WebP、AVIF 是有损格式：质量设为 80–90 时，大多数照片看起来和原图一样，文件却小很多。'],
        ['为什么 AVIF 不能选？', '保存 AVIF 需要浏览器支持 AVIF 编码。如果你的浏览器不支持，该选项会被禁用；WebP 的压缩效果相近。'],
        ['文件数量有限制吗？', '没有。一次可以转换几百张图片，唯一的限制是设备内存。'],
      ],
      ui: {
        drop: '把图片拖到这里，或点击选择', dropSub: 'JPG、PNG、WebP、GIF、BMP、AVIF、SVG、HEIC · 支持批量',
        format: '转换为', quality: '质量', maxSize: '最大宽/高（像素）', maxSizeHint: '留空 = 保持原尺寸',
        background: '透明区域背景色', convert: '转换 $1 张图片', converting: '正在转换第 $1 / $2 张…',
        doneN: '已转换 $1 张图片。总大小 $2 → $3。', avifNo: 'AVIF（此浏览器不支持）', failed: '无法读取 $1',
        decodingHeic: '正在解码 HEIC…', icoNote: 'ICO 最大保存为 256 × 256 像素。',
      },
    },
  },
  ui: (s, c) => html`
<div class="dropzone" id="ic-drop"><strong>${s.drop}</strong>${s.dropSub}</div>
<ul class="files" id="ic-files"></ul>
<div class="fields">
  <label class="field"><span>${s.format}</span>
    <select id="ic-format">
      <option value="image/jpeg">JPG</option>
      <option value="image/png">PNG</option>
      <option value="image/webp" selected>WebP</option>
      <option value="image/avif" data-label-no="${s.avifNo}">AVIF</option>
      <option value="image/x-icon">ICO</option>
    </select>
  </label>
  <label class="field" id="ic-q-wrap"><span>${s.quality}: <b id="ic-q-val">85</b></span><input type="range" id="ic-q" min="10" max="100" value="85"></label>
  <label class="field"><span>${s.maxSize}</span><input type="number" id="ic-max" min="16" max="20000" placeholder="${s.maxSizeHint}"></label>
  <label class="field" id="ic-bg-wrap"><span>${s.background}</span><input type="color" id="ic-bg" value="#ffffff"></label>
</div>
<div class="row"><button class="btn big" id="ic-go" disabled>${s.convert.replace('$1', '0')}</button><button class="btn ghost" id="ic-zip" hidden>${c.downloadAll}</button><button class="btn ghost" id="ic-clear" hidden>${c.clear}</button></div>
<div class="status" id="ic-status" hidden></div>
<div class="results" id="ic-results"></div>`,
};
