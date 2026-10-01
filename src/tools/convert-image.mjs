import { html } from '../../build/html.mjs';

export default {
  id: 'convert-image',
  category: 'image',
  iconName: 'image',
  color: '#db2777',
  related: ['heic-to-jpg', 'compress-image', 'jpg-to-pdf'],
  appCategory: 'DesignApplication',
  strings: {
    en: {
      name: 'Image Converter',
      short: 'Convert between JPG, PNG, WebP, AVIF and ICO, in bulk.',
      keywords: ['png to jpg', 'jpg to png', 'webp to jpg', 'webp to png', 'jpg to webp', 'png to ico', 'favicon', 'avif', 'image format', 'svg to png'],
      title: 'Image Converter Online — PNG/WebP/AVIF/ICO/JPG, No Upload',
      desc: 'Convert images between JPG, PNG, WebP, AVIF and ICO in bulk: PNG to JPG, WebP to JPG, JPG to WebP, favicons. Resize while converting. Free, private, in your browser.',
      h1: 'Convert images to JPG, PNG, WebP, AVIF or ICO',
      sub: 'Image Converter changes the format of any number of images at once — WebP downloads that won\'t open, PNG screenshots that are too big, a logo that needs to become a favicon. Conversion starts the moment you drop the files; nothing is uploaded.',
      features: [
        ['repeat', 'Every common format', 'JPG, PNG, WebP, AVIF, GIF, BMP, SVG and HEIC in; JPG, PNG, WebP, AVIF and ICO out.'],
        ['layers', 'Batch and instant', 'Drop a whole folder of images; each is converted immediately and can be downloaded alone or in a ZIP.'],
        ['maximize', 'Resize on the way', 'Set a maximum width/height and a quality to get web-ready images in one step.'],
      ],
      howToTitle: 'How to convert an image',
      steps: ['Choose the output format (JPG, PNG, WebP, AVIF or ICO).', 'Drop your images.', 'Download each image or all of them as a ZIP.'],
      guide: [
        ['Popular conversions', { table: [['From → To', 'Why'], ['WebP → JPG / PNG', 'Open web images in apps that don\'t support WebP'], ['PNG → JPG', 'Make screenshots and photos much smaller'], ['JPG / PNG → WebP', 'Smaller images for faster websites'], ['PNG → ICO', 'Create a favicon for a website (up to 256 × 256)'], ['HEIC → JPG', 'Open iPhone photos anywhere — see HEIC to JPG']] }],
        ['Transparency', 'PNG, WebP, AVIF and ICO keep transparent backgrounds. JPG has no transparency, so transparent areas are filled with the background colour you choose (white by default).'],
      ],
      faq: [
        ['How do I convert WebP to JPG?', 'Choose JPG, drop the WebP files and download the converted JPGs.'],
        ['How do I convert PNG to JPG without a black background?', 'LocalKit fills transparent areas with white (or the colour you pick) when saving JPG, so there is no black background.'],
        ['Can I convert many images at once?', 'Yes — drop as many as you like; download them individually or as a ZIP.'],
        ['Why is AVIF unavailable?', 'Saving AVIF needs browser support for AVIF encoding (recent Chrome and Edge). WebP is a good alternative.'],
        ['Are my images uploaded?', 'No. Conversion happens in your browser.'],
      ],
      ui: {
        drop: 'Drop images to convert', dropHint: 'JPG, PNG, WebP, AVIF, HEIC, GIF, BMP, SVG · batch · stays on your device', add: 'Add more images',
        to: 'Convert to', quality: 'Quality', resize: 'Max width/height', rOrig: 'Original', bg: 'Background (JPG)', avifNo: 'AVIF (not supported here)', icoNote: 'ICO is saved at up to 256 × 256.',
        summary: '$1 images · $2 → $3', zip: 'Download all (ZIP)', clear: 'Clear all',
      },
    },
    zh: {
      name: '图片格式转换',
      short: '在 JPG、PNG、WebP、AVIF、ICO 之间批量转换。',
      keywords: ['png 转 jpg', 'jpg 转 png', 'webp 转 jpg', 'webp 转 png', 'jpg 转 webp', 'png 转 ico', '图标', 'avif', '图片格式'],
      title: '图片格式转换 — PNG 转 JPG、WebP 互转，免费不上传',
      desc: '在 JPG、PNG、WebP、AVIF、ICO 之间批量转换图片：PNG 转 JPG、WebP 转 PNG、JPG 转 WebP、制作网站图标，还能顺便调整尺寸。免费、私密，在浏览器中运行。',
      h1: '图片格式转换：转 JPG、PNG、WebP、AVIF 或 ICO',
      sub: '图片格式转换是一个免费的在线工具：一次性转换任意多张图片 —— 打不开的 WebP、体积太大的 PNG 截图、需要做成网站图标的 Logo 都能搞定。拖入文件立即开始，全程不上传。',
      features: [
        ['repeat', '支持常见格式', '可输入 JPG、PNG、WebP、AVIF、GIF、BMP、SVG、HEIC；可输出 JPG、PNG、WebP、AVIF、ICO。'],
        ['layers', '批量且即时', '拖入一整个文件夹的图片，每张都会立即转换，可以单独下载或打包为 ZIP。'],
        ['maximize', '顺便调整尺寸', '设置最大宽高和质量，一步得到适合网页使用的图片。'],
      ],
      howToTitle: '如何转换图片格式',
      steps: ['选择输出格式（JPG、PNG、WebP、AVIF 或 ICO）。', '拖入图片。', '逐张下载，或打包成 ZIP 下载。'],
      guide: [
        ['常见的转换', { table: [['从 → 到', '用途'], ['WebP → JPG / PNG', '在不支持 WebP 的软件里打开网页图片'], ['PNG → JPG', '让截图和照片小很多'], ['JPG / PNG → WebP', '更小的图片，让网站更快'], ['PNG → ICO', '制作网站图标（最大 256 × 256）'], ['HEIC → JPG', '在任何地方打开 iPhone 照片 —— 见「HEIC 转 JPG」']] }],
        ['关于透明背景', 'PNG、WebP、AVIF、ICO 会保留透明背景。JPG 不支持透明，透明区域会用你选择的背景色填充（默认白色）。'],
      ],
      faq: [
        ['怎么把 WebP 转成 JPG？', '选择 JPG，拖入 WebP 文件，然后下载转换好的 JPG。'],
        ['PNG 转 JPG 怎么不出现黑底？', '保存为 JPG 时，LocalKit 会用白色（或你选的颜色）填充透明区域，所以不会出现黑色背景。'],
        ['能一次转换很多张吗？', '能 —— 想拖多少张都可以，逐张下载或打包为 ZIP。'],
        ['为什么 AVIF 不能选？', '保存 AVIF 需要浏览器支持 AVIF 编码（新版 Chrome 和 Edge）。WebP 是不错的替代。'],
        ['图片会被上传吗？', '不会，转换在你的浏览器中完成。'],
      ],
      ui: {
        drop: '拖入要转换的图片', dropHint: 'JPG、PNG、WebP、AVIF、HEIC、GIF、BMP、SVG · 支持批量 · 文件不离开你的设备', add: '继续添加图片',
        to: '转换为', quality: '质量', resize: '最大宽/高', rOrig: '原始尺寸', bg: '背景色（JPG）', avifNo: 'AVIF（此处不支持）', icoNote: 'ICO 最大保存为 256 × 256。',
        summary: '$1 张图片 · $2 → $3', zip: '全部下载（ZIP）', clear: '全部清除',
      },
    },
  },
  ui: (s) => html`
<div class="opts">
  <div class="opt"><span class="field-label">${s.to}</span><div class="chips" id="cm-formats">
    <label class="chip"><input type="radio" name="cm-f" value="image/jpeg" checked><span>JPG</span></label>
    <label class="chip"><input type="radio" name="cm-f" value="image/png"><span>PNG</span></label>
    <label class="chip"><input type="radio" name="cm-f" value="image/webp"><span>WebP</span></label>
    <label class="chip"><input type="radio" name="cm-f" value="image/avif" data-no="${s.avifNo}"><span>AVIF</span></label>
    <label class="chip"><input type="radio" name="cm-f" value="image/x-icon"><span>ICO</span></label>
  </div></div>
  <label class="field opt" id="cm-q-wrap"><span>${s.quality}: <b id="cm-qv">90</b></span><input type="range" id="cm-q" min="40" max="100" value="90"></label>
  <label class="field opt"><span>${s.resize}</span><select id="cm-max"><option value="0">${s.rOrig}</option><option value="2560">2560 px</option><option value="1920">1920 px</option><option value="1280">1280 px</option><option value="800">800 px</option><option value="512">512 px</option></select></label>
  <label class="field opt" id="cm-bg-wrap"><span>${s.bg}</span><input type="color" id="cm-bg" value="#ffffff"></label>
</div>
<div id="cm-pick" style="margin-top:16px"></div>
<div id="cm-work" class="panel" hidden style="margin-top:16px">
  <div class="actions"><span class="estimate" id="cm-summary"></span><span style="flex:1"></span><button class="btn" id="cm-zip" hidden>${s.zip}</button><button class="btn ghost sm" id="cm-clear">${s.clear}</button></div>
  <div id="cm-alert"></div>
  <div class="out-grid" id="cm-grid"></div>
  <div id="cm-more"></div>
</div>`,
};
