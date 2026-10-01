import { html } from '../../build/html.mjs';

export default {
  id: 'jpg-to-pdf',
  category: 'pdf',
  iconName: 'image-plus',
  color: '#0891b2',
  related: ['scan-to-pdf', 'merge-pdf', 'compress-image'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'JPG to PDF',
      short: 'Combine photos and images (JPG, PNG, HEIC) into one PDF.',
      keywords: ['image to pdf', 'png to pdf', 'photo to pdf', 'heic to pdf', 'pictures to pdf', 'images to pdf'],
      title: 'JPG to PDF — Convert Images to PDF Free, No Upload',
      desc: 'Convert JPG, PNG, HEIC and WebP images to PDF: drag to reorder, choose A4, Letter or image size, orientation and margins. JPGs embedded losslessly. Free, private, no upload.',
      h1: 'Convert JPG and other images to PDF',
      sub: 'JPG to PDF combines photos, screenshots and scans into one PDF document. Drag the images into order, pick the page size and margins, and download — nothing is uploaded, and JPGs keep their original quality.',
      features: [
        ['grip-vertical', 'Order by drag and drop', 'Every image shows as a thumbnail; drag to reorder, rotate or remove before creating the PDF.'],
        ['badge-check', 'No quality loss', 'JPG images are embedded exactly as they are; PNG transparency and screenshots stay crisp.'],
        ['smartphone', 'Works with iPhone photos', 'HEIC pictures from iPhone are converted automatically, together with JPG, PNG, WebP, GIF and BMP.'],
      ],
      howToTitle: 'How to convert JPG to PDF',
      steps: ['Drop JPG, PNG or HEIC images on the box.', 'Drag them into the right order.', 'Press Create PDF and download your document.'],
      guide: [
        ['Choosing the page size', { table: [['Option', 'What happens'], ['A4 / Letter', 'Each image is centred on a standard page — best for printing and documents.'], ['Same as image', 'The page takes the image\'s own size — best for screenshots and slides, no white borders.']] }, 'Orientation "Automatic" turns the page sideways for landscape pictures, so they fill the page.'],
        ['Scanning paper documents?', 'If your images are phone photos of documents, use Scan to PDF: it crops and straightens the page and makes it look like a real scan.'],
      ],
      faq: [
        ['How do I convert several JPGs into one PDF?', 'Drop all the images at once, drag them into the right order and press Create PDF. They become pages of a single PDF.'],
        ['Will the image quality be reduced?', 'No. JPG files are embedded unchanged. Other formats are converted at high quality.'],
        ['Can I convert iPhone HEIC photos to PDF?', 'Yes. HEIC photos are decoded in your browser and added like any other image.'],
        ['Is there a limit on the number of images?', 'No fixed limit; dozens or hundreds of images work.'],
        ['Are my photos uploaded?', 'No. The PDF is created on your device.'],
      ],
      ui: {
        drop: 'Drop images here', dropHint: 'JPG, PNG, HEIC, WebP · several at once · stays on your device', add: 'Add more images',
        size: 'Page size', sA4: 'A4', sLetter: 'Letter', sFit: 'Same as image', orient: 'Orientation', oAuto: 'Automatic', oPortrait: 'Portrait', oLandscape: 'Landscape',
        margin: 'Margin', mNone: 'None', mSmall: 'Small', mBig: 'Large', create: 'Create PDF', creating: 'Creating PDF… $1 of $2', done: 'PDF created · $1 pages · $2',
        download: 'Download again', rotL: 'Rotate left', rotR: 'Rotate right', left: 'Move earlier', right: 'Move later', image: 'Image $1', count: '$1 images', another: 'Start over',
      },
    },
    zh: {
      name: '图片转 PDF',
      short: '把照片和图片（JPG、PNG、HEIC）合成一个 PDF。',
      keywords: ['jpg 转 pdf', '图片合成 pdf', '照片转 pdf', 'png 转 pdf', 'heic 转 pdf', '多张图片转 pdf'],
      title: '图片转 PDF — JPG、PNG、HEIC 合成 PDF，免费不上传',
      desc: '把 JPG、PNG、HEIC、WebP 图片合成 PDF：拖动排序，可选 A4、Letter 或原图尺寸、方向和页边距。JPG 原样嵌入、画质无损。免费、私密，在浏览器中完成。',
      h1: '把 JPG 等图片转换成 PDF',
      sub: '图片转 PDF 是一个免费的在线工具：把照片、截图和扫描图片合成一个 PDF 文档。拖动调整顺序，选择纸张大小和页边距，直接下载。JPG 原样嵌入，全程不上传。',
      features: [
        ['grip-vertical', '拖放排序', '每张图片都显示缩略图，生成前可以拖动排序、旋转或移除。'],
        ['badge-check', '画质无损', 'JPG 图片原样嵌入；PNG 的透明背景和截图依然清晰。'],
        ['smartphone', '支持 iPhone 照片', 'iPhone 的 HEIC 照片会自动转换，JPG、PNG、WebP、GIF、BMP 也都支持。'],
      ],
      howToTitle: '如何把图片转成 PDF',
      steps: ['把 JPG、PNG、HEIC 图片拖到框里。', '拖动调整顺序。', '点击「生成 PDF」并下载文档。'],
      guide: [
        ['纸张大小怎么选', { table: [['选项', '效果'], ['A4 / Letter', '每张图片居中放在标准纸张上 —— 适合打印和文档。'], ['与图片相同', '页面大小等于图片尺寸 —— 适合截图和幻灯片，没有白边。']] }, '方向选「自动」时，横向图片会使用横向页面，铺满整页。'],
        ['要扫描纸质文件？', '如果是用手机拍的文件照片，请使用「扫描成 PDF」：它会裁剪并拉正页面，让照片看起来像真正的扫描件。'],
      ],
      faq: [
        ['怎么把多张 JPG 合成一个 PDF？', '一次拖入所有图片，调整好顺序，点击「生成 PDF」，它们会成为同一个 PDF 的各页。'],
        ['画质会降低吗？', '不会。JPG 文件原样嵌入，其他格式以高质量转换。'],
        ['iPhone 的 HEIC 照片能转 PDF 吗？', '能。HEIC 照片在浏览器中解码后，和其他图片一样加入 PDF。'],
        ['图片数量有限制吗？', '没有固定限制，几十上百张都可以。'],
        ['照片会被上传吗？', '不会，PDF 在你的设备上生成。'],
      ],
      ui: {
        drop: '把图片拖到这里', dropHint: 'JPG、PNG、HEIC、WebP · 可多选 · 文件不离开你的设备', add: '继续添加图片',
        size: '纸张大小', sA4: 'A4', sLetter: 'Letter', sFit: '与图片相同', orient: '方向', oAuto: '自动', oPortrait: '纵向', oLandscape: '横向',
        margin: '页边距', mNone: '无', mSmall: '小', mBig: '大', create: '生成 PDF', creating: '正在生成 PDF… 第 $1 / $2 张', done: 'PDF 已生成 · $1 页 · $2',
        download: '再次下载', rotL: '向左旋转', rotR: '向右旋转', left: '前移', right: '后移', image: '第 $1 张', count: '$1 张图片', another: '重新开始',
      },
    },
  },
  ui: (s) => html`
<div id="ip-pick"></div>
<div id="ip-work" class="panel" hidden>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.size}</span><div class="chips"><label class="chip"><input type="radio" name="ip-size" value="a4" checked><span>${s.sA4}</span></label><label class="chip"><input type="radio" name="ip-size" value="letter"><span>${s.sLetter}</span></label><label class="chip"><input type="radio" name="ip-size" value="fit"><span>${s.sFit}</span></label></div></div>
    <div class="opt"><span class="field-label">${s.orient}</span><div class="chips"><label class="chip"><input type="radio" name="ip-or" value="auto" checked><span>${s.oAuto}</span></label><label class="chip"><input type="radio" name="ip-or" value="p"><span>${s.oPortrait}</span></label><label class="chip"><input type="radio" name="ip-or" value="l"><span>${s.oLandscape}</span></label></div></div>
    <div class="opt"><span class="field-label">${s.margin}</span><div class="chips"><label class="chip"><input type="radio" name="ip-m" value="0"><span>${s.mNone}</span></label><label class="chip"><input type="radio" name="ip-m" value="20" checked><span>${s.mSmall}</span></label><label class="chip"><input type="radio" name="ip-m" value="48"><span>${s.mBig}</span></label></div></div>
  </div>
  <div class="actions"><button class="btn lg" id="ip-go">${s.create}</button><span class="muted" id="ip-count"></span></div>
  <div id="ip-alert"></div>
  <div id="ip-task"></div>
  <div id="ip-result"></div>
  <div class="pages" id="ip-pages"></div>
  <div id="ip-more"></div>
</div>`,
};
