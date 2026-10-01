import { html } from '../../build/html.mjs';

export default {
  id: 'pdf-to-images',
  category: 'pdf',
  icon: 'JPG',
  color: '#c026d3',
  strings: {
    en: {
      name: 'PDF to JPG / PNG',
      title: 'PDF to JPG / PNG Converter — Every Page as an Image, Free',
      desc: 'Convert PDF pages to high-resolution JPG or PNG images. Choose the resolution and pages, download as ZIP. Free and private — the PDF never leaves your browser.',
      h1: 'Convert PDF pages to JPG or PNG images',
      lead: 'Turn each page of a PDF into a sharp image for slides, social media or chat apps. Pick the resolution (up to 300 DPI) and which pages to convert.',
      steps: ['Drop a PDF on the box.', 'Choose JPG or PNG, the resolution and (optionally) page ranges.', 'Click Convert and download the images (several pages come as a ZIP).'],
      faq: [
        ['Which resolution should I use?', '150 DPI is good for screens and chat apps; 300 DPI is print quality but makes much larger files.'],
        ['JPG or PNG?', 'JPG makes small files and suits pages with photos. PNG is lossless and keeps text perfectly crisp.'],
        ['Can I convert only some pages?', 'Yes. Type ranges such as 1-3, 7. Leave the box empty to convert every page.'],
        ['Is the PDF uploaded?', 'No. Pages are rendered by your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF here or click to choose', format: 'Image format', dpi: 'Resolution', ranges: 'Pages (optional)', rangesPh: 'all pages, or e.g. 1-3, 7',
        convert: 'Convert to images', working: 'Rendering page $1 of $2…', done: 'Converted $1 pages.', badRange: 'Invalid range: $1', fileInfo: '$1 · $2 pages',
      },
    },
    zh: {
      name: 'PDF 转图片（JPG / PNG）',
      title: 'PDF 转 JPG / PNG — 每一页转成高清图片，免费',
      desc: '把 PDF 页面转换成高清 JPG 或 PNG 图片，可选分辨率和页码，打包 ZIP 下载。免费、私密，PDF 不会离开你的浏览器。',
      h1: '把 PDF 页面转换成 JPG 或 PNG 图片',
      lead: '把 PDF 的每一页转成清晰的图片，方便放进幻灯片、发朋友圈或聊天软件。可选分辨率（最高 300 DPI）和要转换的页面。',
      steps: ['把 PDF 拖到框里。', '选择 JPG 或 PNG、分辨率，以及（可选）页码范围。', '点击「转换」，下载图片（多页会打包为 ZIP）。'],
      faq: [
        ['分辨率选多少？', '150 DPI 适合屏幕查看和聊天发送；300 DPI 是打印质量，但文件会大很多。'],
        ['选 JPG 还是 PNG？', 'JPG 文件小，适合带照片的页面。PNG 无损，文字最清晰。'],
        ['可以只转换部分页面吗？', '可以，输入页码范围如 1-3, 7。留空则转换全部页面。'],
        ['PDF 会被上传吗？', '不会，页面由你的浏览器渲染。'],
      ],
      ui: {
        drop: '把 PDF 拖到这里，或点击选择', format: '图片格式', dpi: '分辨率', ranges: '页码（可选）', rangesPh: '全部页面，或如 1-3, 7',
        convert: '转换为图片', working: '正在渲染第 $1 / $2 页…', done: '已转换 $1 页。', badRange: '页码范围无效：$1', fileInfo: '$1 · 共 $2 页',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="pi-drop"><strong>${s.drop}</strong><span id="pi-info"></span></div>
<div class="fields">
  <label class="field"><span>${s.format}</span><select id="pi-fmt"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label>
  <label class="field"><span>${s.dpi}</span><select id="pi-dpi"><option value="72">72 DPI</option><option value="150" selected>150 DPI</option><option value="200">200 DPI</option><option value="300">300 DPI</option></select></label>
  <label class="field"><span>${s.ranges}</span><input type="text" id="pi-ranges" placeholder="${s.rangesPh}"></label>
</div>
<div class="row"><button class="btn big" id="pi-go" disabled>${s.convert}</button></div>
<div class="status" id="pi-status" hidden></div>
<div class="results" id="pi-results"></div>`,
};
