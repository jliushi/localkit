import { html } from '../../build/html.mjs';

export default {
  id: 'pdf-to-jpg',
  category: 'pdf',
  iconName: 'file-image',
  color: '#c026d3',
  related: ['jpg-to-pdf', 'split-pdf', 'compress-image'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'PDF to JPG',
      short: 'Turn PDF pages into high-quality JPG or PNG images.',
      keywords: ['pdf to image', 'pdf to png', 'convert pdf to jpg', 'pdf page to picture', 'extract images', 'pdf to photo'],
      title: 'PDF to JPG Converter — Pages to JPG/PNG Free, No Upload',
      desc: 'Convert PDF pages to JPG or PNG images in high resolution (up to 300 DPI). Pick pages, preview and download one image or a ZIP. Free, private — the PDF stays in your browser.',
      h1: 'Convert PDF to JPG images',
      sub: 'PDF to JPG turns every page of a document — or just the pages you pick — into sharp JPG or PNG images for slides, social media, chats or documents. Choose screen or print resolution, up to 300 DPI; the PDF never leaves your browser.',
      features: [
        ['images', 'Pick the pages', 'All pages are selected by default; click thumbnails to choose only the ones you need.'],
        ['scan-eye', 'Screen or print quality', '72 DPI for quick previews, 150 DPI for screens and chat apps, 300 DPI for printing.'],
        ['shield-check', 'Nothing uploaded', 'Pages are rendered in your browser with pdf.js, so private documents stay private.'],
      ],
      howToTitle: 'How to convert PDF to JPG',
      steps: ['Drop a PDF on the box.', 'Choose JPG or PNG and the resolution; click thumbnails to deselect pages you don\'t need.', 'Press Convert. One page downloads as an image, several as a ZIP.'],
      guide: [
        ['JPG or PNG?', 'JPG makes small files and is ideal for pages with photos. PNG is lossless — best for pages that are mostly text, diagrams or screenshots, where you want perfectly crisp edges.'],
        ['Image size by resolution (A4 page)', { table: [['Resolution', 'Pixels', 'Good for'], ['72 DPI', '595 × 842', 'Thumbnails, previews'], ['150 DPI', '1240 × 1754', 'Screens, WeChat, slides'], ['300 DPI', '2480 × 3508', 'Printing, OCR']] }],
      ],
      faq: [
        ['How do I convert a PDF to JPG?', 'Drop the PDF, keep JPG selected and press Convert. With several pages you get a ZIP of JPGs, one per page.'],
        ['Can I convert only one page?', 'Yes. Click "None" and then click the page you want.'],
        ['What resolution should I use?', '150 DPI is right for screens and chat apps; choose 300 DPI if you will print the images.'],
        ['Does it work for scanned PDFs?', 'Yes. Each page is rendered exactly as it looks, so scans come out as images of the pages.'],
        ['Is my PDF uploaded?', 'No. Conversion happens in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF to convert', dropHint: 'Stays on your device', format: 'Format', dpi: 'Resolution', all: 'All', none: 'None',
        convert: 'Convert to images', converting: 'Rendering page $1 of $2…', done: '$1 image(s) ready', download: 'Download again', page: 'Page $1', selected: '$1 of $2 pages selected', noneSel: 'Select at least one page.',
        sScreen: 'screen', sPrint: 'print', sQuick: 'small', another: 'Convert another PDF', pagesN: '$1 pages',
      },
    },
    zh: {
      name: 'PDF 转图片',
      short: '把 PDF 页面转换成高清 JPG 或 PNG 图片。',
      keywords: ['pdf 转 jpg', 'pdf 转图片', 'pdf 转 png', 'pdf 页面转图片', 'pdf 截图', 'pdf 导出图片'],
      title: 'PDF 转 JPG — 在线把 PDF 转高清 JPG/PNG（不上传）',
      desc: '把 PDF 页面转换成高分辨率（最高 300 DPI）的 JPG 或 PNG 图片。可选择页面、预览，下载单张图片或 ZIP。免费、私密 —— PDF 留在你的浏览器里。',
      h1: '把 PDF 转换成 JPG 图片',
      sub: 'PDF 转图片是一个免费的在线工具：把每一页（或你选中的页面）转成高清 JPG 或 PNG，最高 300 DPI，方便放进幻灯片、聊天、打印或文档。PDF 不上传，在浏览器本地渲染。',
      features: [
        ['images', '自选页面', '默认选中全部页面；点击缩略图可以只保留需要的那几页。'],
        ['scan-eye', '屏幕或打印质量', '72 DPI 用于快速预览，150 DPI 适合屏幕和聊天软件，300 DPI 适合打印。'],
        ['shield-check', '不上传任何内容', '页面由浏览器中的 pdf.js 渲染，私密文件依然私密。'],
      ],
      howToTitle: '如何把 PDF 转成 JPG',
      steps: ['把 PDF 拖到框里。', '选择 JPG 或 PNG 以及分辨率；点击缩略图取消不需要的页面。', '点击「转换为图片」。单页直接下载图片，多页打包为 ZIP。'],
      guide: [
        ['选 JPG 还是 PNG？', 'JPG 文件小，适合有照片的页面。PNG 无损，最适合以文字、图表或截图为主的页面，边缘非常清晰。'],
        ['不同分辨率的图片大小（A4 页面）', { table: [['分辨率', '像素', '适合'], ['72 DPI', '595 × 842', '缩略图、预览'], ['150 DPI', '1240 × 1754', '屏幕、微信、幻灯片'], ['300 DPI', '2480 × 3508', '打印、文字识别']] }],
      ],
      faq: [
        ['怎么把 PDF 转成 JPG？', '拖入 PDF，保持选择 JPG，点击「转换为图片」。多页时会得到一个 ZIP，每页一张 JPG。'],
        ['可以只转换一页吗？', '可以。点击「全不选」，再点击需要的那一页。'],
        ['分辨率选多少？', '屏幕查看和聊天软件选 150 DPI；如果要打印，选 300 DPI。'],
        ['扫描版 PDF 能转吗？', '能。每一页都按显示效果渲染，扫描件会得到页面的图片。'],
        ['PDF 会被上传吗？', '不会，转换在你的浏览器中完成。'],
      ],
      ui: {
        drop: '拖入要转换的 PDF', dropHint: '文件不离开你的设备', format: '格式', dpi: '分辨率', all: '全选', none: '全不选',
        convert: '转换为图片', converting: '正在渲染第 $1 / $2 页…', done: '已生成 $1 张图片', download: '再次下载', page: '第 $1 页', selected: '已选 $1 / $2 页', noneSel: '请至少选择一页。',
        sScreen: '屏幕', sPrint: '打印', sQuick: '小', another: '转换另一个 PDF', pagesN: '共 $1 页',
      },
    },
  },
  ui: (s) => html`
<div id="pj-pick"></div>
<div id="pj-work" class="panel" hidden>
  <div id="pj-file"></div>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.format}</span><div class="chips"><label class="chip"><input type="radio" name="pj-fmt" value="image/jpeg" checked><span>JPG</span></label><label class="chip"><input type="radio" name="pj-fmt" value="image/png"><span>PNG</span></label></div></div>
    <div class="opt"><span class="field-label">${s.dpi}</span><div class="chips">
      <label class="chip"><input type="radio" name="pj-dpi" value="72"><span>72 DPI <small>${s.sQuick}</small></span></label>
      <label class="chip"><input type="radio" name="pj-dpi" value="150" checked><span>150 DPI <small>${s.sScreen}</small></span></label>
      <label class="chip"><input type="radio" name="pj-dpi" value="300"><span>300 DPI <small>${s.sPrint}</small></span></label>
    </div></div>
  </div>
  <div class="actions"><button class="btn lg" id="pj-go">${s.convert}</button><span class="muted" id="pj-sel"></span><button class="btn ghost sm" id="pj-all">${s.all}</button><button class="btn ghost sm" id="pj-none">${s.none}</button></div>
  <div id="pj-alert"></div>
  <div id="pj-task"></div>
  <div id="pj-result"></div>
  <div class="pages" id="pj-pages"></div>
</div>`,
};
