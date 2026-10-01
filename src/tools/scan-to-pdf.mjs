import { html } from '../../build/html.mjs';

export default {
  id: 'scan-to-pdf',
  category: 'pdf',
  iconName: 'scan-line',
  color: '#0d9488',
  related: ['jpg-to-pdf', 'compress-pdf', 'merge-pdf'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Scan to PDF',
      short: 'Turn phone photos of documents into a clean, straight scanned PDF.',
      keywords: ['document scanner', 'scan document', 'phone scanner', 'camera scanner', 'photo to scan', 'receipt scanner'],
      title: 'Scan to PDF Online — Free Document Scanner for Phone Photos (No App, No Upload)',
      desc: 'Free online document scanner: take photos of paper documents, receipts or notes and get a clean PDF. Automatic edge detection, perspective correction and scan filters (black & white, enhanced color). No app, no upload.',
      h1: 'Scan documents to PDF with your phone',
      sub: 'Photograph a document, receipt or whiteboard — LocalKit finds the page edges, straightens it, cleans up shadows and saves a crisp PDF. No app to install, and your photos never leave your device.',
      features: [
        ['scan', 'Automatic page detection', 'The edges of the paper are found automatically and the page is straightened, even if you took the photo at an angle.'],
        ['wand-sparkles', 'Scanner filters', 'Enhanced colour, clean black & white (removes shadows) or grayscale — make a quick photo look like a flatbed scan.'],
        ['files', 'Multi-page documents', 'Add as many pages as you need, reorder and rotate them, and save one PDF.'],
      ],
      howToTitle: 'How to scan a document to PDF',
      steps: [
        'On your phone, tap "Take photo" (or drop existing photos on a computer).',
        'Check each page: tap Crop to adjust the corners if needed, and pick a filter.',
        'Add more pages, then press Create PDF.',
      ],
      guide: [
        ['Tips for a perfect scan', { list: ['Put the paper on a darker, plain surface so the edges stand out.', 'Shoot in daylight or bright light and avoid your own shadow over the page.', 'Fill most of the frame with the document; a slight angle is fine — it will be straightened.', 'For text documents choose "Black & white"; for receipts with colour or photos choose "Enhanced".'] }],
        ['Which filter should I use?', { table: [['Filter', 'Best for'], ['Enhanced', 'Most documents: brighter paper, stronger text, colours kept'], ['Black & white', 'Text-only pages, forms, contracts — smallest files, shadows removed'], ['Grayscale', 'Documents with pencil or photos where colour doesn\'t matter'], ['Original', 'Keep the photo exactly as taken']] }],
      ],
      faq: [
        ['Do I need to install a scanner app?', 'No. This page works in the browser on iPhone and Android: tap "Take photo" to use the camera.'],
        ['How does the automatic cropping work?', 'LocalKit looks for the bright rectangle of the paper against the background and moves the four corners onto it. You can always drag the corners yourself.'],
        ['Can I scan multiple pages into one PDF?', 'Yes. Keep adding photos; each becomes a page. Drag to reorder before creating the PDF.'],
        ['Is the result searchable text?', 'The PDF contains images of the pages (like any scanner). Text recognition (OCR) is not included.'],
        ['Are my photos uploaded?', 'No. Detection, straightening and the PDF are all done on your device.'],
      ],
      ui: {
        drop: 'Drop photos of documents', dropHint: 'JPG, PNG, HEIC · or use the camera · stays on your device', camera: 'Take photo', add: 'Add more pages',
        filter: 'Filter', fEnh: 'Enhanced', fBw: 'Black & white', fGray: 'Grayscale', fOrig: 'Original', size: 'Page size', sA4: 'A4', sLetter: 'Letter', sFit: 'Fit to scan',
        create: 'Create PDF', creating: 'Processing page $1 of $2…', done: 'PDF created · $1 pages · $2', download: 'Download again', another: 'Start over',
        crop: 'Crop', rotL: 'Rotate left', rotR: 'Rotate right', left: 'Move earlier', right: 'Move later', page: 'Page $1', pages: '$1 pages',
        cropTitle: 'Adjust the corners', cropHint: 'Drag the four circles onto the corners of the document.', auto: 'Auto detect', full: 'Whole photo', apply: 'Apply', cancel: 'Cancel',
        detecting: 'Finding the page…',
      },
    },
    zh: {
      name: '扫描成 PDF',
      short: '把手机拍的文件照片变成干净、端正的扫描版 PDF。',
      keywords: ['文档扫描', '手机扫描', '拍照扫描', '扫描件', '照片转扫描件', '扫描王', '收据扫描'],
      title: '在线扫描成 PDF — 手机拍照变扫描件，免费免安装（不上传）',
      desc: '免费在线文档扫描：拍下纸质文件、收据或笔记，得到干净的 PDF。自动识别边缘、透视校正，提供黑白、增强等扫描滤镜。无需安装 App，不上传。',
      h1: '用手机把文件扫描成 PDF',
      sub: '给文件、收据或白板拍张照 —— LocalKit 会自动找到纸张边缘、把页面拉正、去除阴影，保存为清晰的 PDF。无需安装 App，照片不会离开你的设备。',
      features: [
        ['scan', '自动识别页面', '自动找到纸张的边缘并把页面拉正，即使拍照时有角度也没关系。'],
        ['wand-sparkles', '扫描滤镜', '增强彩色、干净的黑白（去除阴影）或灰度 —— 让随手拍的照片看起来像平板扫描仪扫的一样。'],
        ['files', '多页文档', '想加多少页都可以，可以调整顺序和方向，最后保存为一个 PDF。'],
      ],
      howToTitle: '如何把文件扫描成 PDF',
      steps: [
        '在手机上点击「拍照」（电脑上可以直接拖入已有照片）。',
        '检查每一页：需要时点击「裁剪」调整四个角，并选择滤镜。',
        '继续添加页面，然后点击「生成 PDF」。',
      ],
      guide: [
        ['拍出完美扫描件的小技巧', { list: ['把纸放在颜色较深、纯色的桌面上，让边缘更清楚。', '在自然光或明亮的灯光下拍摄，避免自己的影子挡住页面。', '让文件占满大部分画面；稍微有点角度没关系，会被自动拉正。', '纯文字文件选「黑白」；有颜色或照片的收据选「增强」。'] }],
        ['滤镜怎么选？', { table: [['滤镜', '适合'], ['增强', '大多数文件：纸张更白、文字更清楚、保留颜色'], ['黑白', '纯文字页、表格、合同 —— 文件最小，去除阴影'], ['灰度', '有铅笔字迹或照片、不需要颜色的文件'], ['原图', '保持照片原样']] }],
      ],
      faq: [
        ['需要安装扫描 App 吗？', '不需要。在 iPhone 和安卓手机的浏览器中都能使用：点击「拍照」就会打开相机。'],
        ['自动裁剪是怎么做到的？', 'LocalKit 会在背景中寻找纸张的明亮矩形区域，并把四个角移到上面。你随时都可以自己拖动调整。'],
        ['可以把多页扫描成一个 PDF 吗？', '可以。继续添加照片，每张都会成为一页；生成 PDF 前可以拖动调整顺序。'],
        ['生成的 PDF 能搜索文字吗？', 'PDF 中是页面的图像（和扫描仪一样），目前不包含文字识别（OCR）。'],
        ['照片会被上传吗？', '不会。识别、拉正和生成 PDF 都在你的设备上完成。'],
      ],
      ui: {
        drop: '拖入文件照片', dropHint: 'JPG、PNG、HEIC · 也可以直接拍照 · 文件不离开你的设备', camera: '拍照', add: '继续添加页面',
        filter: '滤镜', fEnh: '增强', fBw: '黑白', fGray: '灰度', fOrig: '原图', size: '纸张大小', sA4: 'A4', sLetter: 'Letter', sFit: '按扫描尺寸',
        create: '生成 PDF', creating: '正在处理第 $1 / $2 页…', done: 'PDF 已生成 · $1 页 · $2', download: '再次下载', another: '重新开始',
        crop: '裁剪', rotL: '向左旋转', rotR: '向右旋转', left: '前移', right: '后移', page: '第 $1 页', pages: '$1 页',
        cropTitle: '调整四个角', cropHint: '把四个圆点拖到文件的四个角上。', auto: '自动识别', full: '整张照片', apply: '应用', cancel: '取消',
        detecting: '正在识别页面…',
      },
    },
  },
  ui: (s) => html`
<div id="sc-pick"></div>
<div class="actions" id="sc-cam-row"><label class="btn soft" for="sc-cam">${s.camera}</label><input type="file" id="sc-cam" accept="image/*" capture="environment" hidden></div>
<div id="sc-work" class="panel" hidden>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.filter}</span><div class="chips">
      <label class="chip"><input type="radio" name="sc-f" value="enhance" checked><span>${s.fEnh}</span></label>
      <label class="chip"><input type="radio" name="sc-f" value="bw"><span>${s.fBw}</span></label>
      <label class="chip"><input type="radio" name="sc-f" value="gray"><span>${s.fGray}</span></label>
      <label class="chip"><input type="radio" name="sc-f" value="original"><span>${s.fOrig}</span></label>
    </div></div>
    <div class="opt"><span class="field-label">${s.size}</span><div class="chips">
      <label class="chip"><input type="radio" name="sc-size" value="a4" checked><span>${s.sA4}</span></label>
      <label class="chip"><input type="radio" name="sc-size" value="letter"><span>${s.sLetter}</span></label>
      <label class="chip"><input type="radio" name="sc-size" value="fit"><span>${s.sFit}</span></label>
    </div></div>
  </div>
  <div class="actions"><button class="btn lg" id="sc-go">${s.create}</button><label class="btn ghost" for="sc-cam">${s.camera}</label><span class="muted" id="sc-count"></span></div>
  <div id="sc-alert"></div>
  <div id="sc-task"></div>
  <div id="sc-result"></div>
  <div class="pages" id="sc-pages"></div>
  <div id="sc-more"></div>
</div>
<dialog id="sc-crop">
  <h3>${s.cropTitle}</h3>
  <p class="note">${s.cropHint}</p>
  <div class="crop-stage"><div class="crop-wrap" id="sc-cropwrap"></div></div>
  <div class="actions" style="margin-top:14px"><button class="btn" id="sc-apply">${s.apply}</button><button class="btn ghost" id="sc-auto">${s.auto}</button><button class="btn ghost" id="sc-full">${s.full}</button><button class="btn ghost" id="sc-cancel">${s.cancel}</button></div>
</dialog>`,
};
