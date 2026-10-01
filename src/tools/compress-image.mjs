import { html } from '../../build/html.mjs';

export default {
  id: 'compress-image',
  category: 'image',
  iconName: 'image-down',
  color: '#e11d48',
  related: ['convert-image', 'heic-to-jpg', 'compress-pdf'],
  appCategory: 'DesignApplication',
  strings: {
    en: {
      name: 'Compress Image',
      short: 'Shrink JPG, PNG and WebP images — batch, with a target size in KB.',
      keywords: ['reduce image size', 'image compressor', 'compress jpg', 'compress png', 'photo size kb', 'tinypng alternative', 'resize photo', 'compress photo'],
      title: 'Compress Image Online — JPG/PNG/WebP to KB, Free, No Upload',
      desc: 'Compress JPG, PNG and WebP images in bulk: up to 90% smaller with no visible loss, or hit an exact size like 100 KB or 200 KB. Resize and strip location data. Free, private.',
      h1: 'Compress images — JPG, PNG and WebP',
      sub: 'Compress Image makes JPG, PNG and WebP photos smaller without visible loss — often 60–90% savings — and can hit an exact size like 200 KB for application forms. Everything runs on your device: nothing is uploaded.',
      features: [
        ['gauge', 'Smart compression', 'JPG and WebP are re-encoded at a well-tuned quality; PNGs are colour-reduced like TinyPNG, keeping transparency.'],
        ['target', 'Exact target size', 'Choose "Max size" and type 100 KB, 200 KB or any limit — quality (and size if needed) is adjusted to fit.'],
        ['map-pin-off', 'Removes hidden data', 'Location and camera details (EXIF) are stripped from the result, and nothing is uploaded.'],
      ],
      howToTitle: 'How to compress an image',
      steps: ['Drop one or many images (JPG, PNG, WebP, HEIC).', 'They are compressed immediately. Optionally pick a stronger level, a maximum size in KB, or a smaller width.', 'Download each image or all of them as a ZIP.'],
      guide: [
        ['Hitting an exact file size', 'Government portals, job sites and exam forms often require photos under 50, 100 or 200 KB. Choose "Max size", type the limit, and LocalKit searches for the best quality that fits — and downsizes the photo only if quality alone isn\'t enough.'],
        ['JPG, PNG or WebP?', { table: [['Format', 'Best for', 'Notes'], ['JPG', 'Photos', 'Universal; no transparency'], ['PNG', 'Screenshots, logos, transparency', 'Compressed by reducing colours (up to 256)'], ['WebP', 'Websites', 'Usually 25–35% smaller than JPG at the same quality']] }],
      ],
      faq: [
        ['How do I reduce the size of a photo?', 'Drop the photo here — it is compressed straight away. Download the result, or choose "Strong" or a max size for an even smaller file.'],
        ['How do I compress an image to 100 KB?', 'Choose "Max size", type 100 and drop your image. The result will be 100 KB or less.'],
        ['Does compression reduce quality?', 'With "Recommended", changes are practically invisible on screens. "Strong" and very small targets trade some detail for size.'],
        ['Can I compress many images at once?', 'Yes. Drop as many as you like and download them all as a ZIP.'],
        ['Are my photos uploaded?', 'No. Compression happens in your browser; even the location data in your photos is removed before you download.'],
      ],
      ui: {
        drop: 'Drop images to compress', dropHint: 'JPG, PNG, WebP, HEIC · batch · stays on your device', add: 'Add more images',
        level: 'Compression', lRec: 'Recommended', lStrong: 'Strong', lTarget: 'Max size', kb: 'KB', format: 'Output', fSame: 'Same as original', fWebp: 'WebP', fJpg: 'JPG',
        resize: 'Max width/height', rOrig: 'Original', summary: '$1 images · $2 → $3', zip: 'Download all (ZIP)', clear: 'Clear all',
      },
    },
    zh: {
      name: '图片压缩',
      short: '压缩 JPG、PNG、WebP 图片 —— 支持批量和指定 KB 大小。',
      keywords: ['压缩图片', '图片变小', '图片压缩到 kb', '照片压缩', '压缩 jpg', '压缩 png', '证件照压缩', 'jpg 压缩', '在线压缩图片'],
      title: '图片压缩 — 在线把 JPG/PNG/WebP 压到指定 KB（不上传）',
      desc: '批量压缩 JPG、PNG、WebP 图片：体积减小最多 90% 且看不出差别，也可以压到指定大小（如 100KB、200KB）。可调整尺寸、去除位置信息。免费、私密。',
      h1: '在线压缩图片：JPG、PNG、WebP',
      sub: '图片压缩是一个免费的在线工具：拖入 JPG、PNG、WebP 图片立即压缩，通常能小 60–90% 且肉眼看不出区别。报名表要求指定大小（如 100KB、200KB）也能精准压到。全程不上传。',
      features: [
        ['gauge', '智能压缩', 'JPG 和 WebP 以调校好的质量重新编码；PNG 像 TinyPNG 一样减少颜色，并保留透明背景。'],
        ['target', '精确到 KB', '选择「最大体积」并输入 100KB、200KB 或任意限制 —— 自动调整质量（必要时缩小尺寸）来满足要求。'],
        ['map-pin-off', '去除隐藏信息', '结果中会去除位置和相机信息（EXIF），而且不会上传任何内容。'],
      ],
      howToTitle: '如何压缩图片',
      steps: ['拖入一张或多张图片（JPG、PNG、WebP、HEIC）。', '可选更强的压缩、最大 KB 数或更小的宽度。', '逐张下载，或打包成 ZIP 一次下载。'],
      guide: [
        ['压缩到指定大小', '考试报名、政务网站和招聘网站常常要求照片小于 50KB、100KB 或 200KB。选择「最大体积」，输入限制值，LocalKit 会找到能放下的最好画质 —— 只有单靠降低质量不够时才会缩小尺寸。'],
        ['选 JPG、PNG 还是 WebP？', { table: [['格式', '适合', '说明'], ['JPG', '照片', '兼容性最好；不支持透明'], ['PNG', '截图、Logo、透明背景', '通过减少颜色（最多 256 色）来压缩'], ['WebP', '网站用图', '同等画质通常比 JPG 小 25–35%']] }],
      ],
      faq: [
        ['怎么减小照片的大小？', '把照片拖进来，会立刻压缩。直接下载结果，或者选择「强力」或最大体积，得到更小的文件。'],
        ['怎么把图片压缩到 100KB 以内？', '选择「最大体积」，输入 100，然后拖入图片，结果会小于等于 100KB。'],
        ['压缩会降低画质吗？', '使用「推荐」时，在屏幕上几乎看不出变化。「强力」和非常小的目标会用一些细节换取体积。'],
        ['可以一次压缩很多张吗？', '可以。想拖多少张都行，还能打包成 ZIP 一次下载。'],
        ['照片会被上传吗？', '不会。压缩在你的浏览器中完成，下载前连照片里的位置信息都会被去除。'],
      ],
      ui: {
        drop: '拖入要压缩的图片', dropHint: 'JPG、PNG、WebP、HEIC · 支持批量 · 文件不离开你的设备', add: '继续添加图片',
        level: '压缩方式', lRec: '推荐', lStrong: '强力', lTarget: '最大体积', kb: 'KB', format: '输出格式', fSame: '与原图相同', fWebp: 'WebP', fJpg: 'JPG',
        resize: '最大宽/高', rOrig: '原始尺寸', summary: '$1 张图片 · $2 → $3', zip: '全部下载（ZIP）', clear: '全部清除',
      },
    },
  },
  ui: (s) => html`
<div id="ci-pick"></div>
<div id="ci-work" class="panel" hidden>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.level}</span><div class="chips">
      <label class="chip"><input type="radio" name="ci-l" value="rec" checked><span>${s.lRec}</span></label>
      <label class="chip"><input type="radio" name="ci-l" value="strong"><span>${s.lStrong}</span></label>
      <label class="chip"><input type="radio" name="ci-l" value="target"><span>${s.lTarget}</span></label>
    </div><label class="inline-num" id="ci-kb-wrap" hidden><input type="number" id="ci-kb" min="5" value="200" inputmode="numeric"> ${s.kb}</label></div>
    <div class="opt"><span class="field-label">${s.format}</span><div class="chips">
      <label class="chip"><input type="radio" name="ci-f" value="same" checked><span>${s.fSame}</span></label>
      <label class="chip"><input type="radio" name="ci-f" value="image/webp"><span>${s.fWebp}</span></label>
      <label class="chip"><input type="radio" name="ci-f" value="image/jpeg"><span>${s.fJpg}</span></label>
    </div></div>
    <label class="field opt"><span>${s.resize}</span><select id="ci-max"><option value="0">${s.rOrig}</option><option value="3840">3840 px (4K)</option><option value="2560">2560 px</option><option value="1920">1920 px</option><option value="1280">1280 px</option><option value="800">800 px</option></select></label>
  </div>
  <div class="actions"><span class="estimate" id="ci-summary"></span><span style="flex:1"></span><button class="btn" id="ci-zip" hidden>${s.zip}</button><button class="btn ghost sm" id="ci-clear">${s.clear}</button></div>
  <div id="ci-alert"></div>
  <div class="out-grid" id="ci-grid"></div>
  <div id="ci-more"></div>
</div>`,
};
