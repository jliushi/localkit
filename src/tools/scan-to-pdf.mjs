import { html } from '../../build/html.mjs';

export default {
  id: 'scan-to-pdf',
  category: 'pdf',
  icon: '⎙',
  color: '#0d9488',
  strings: {
    en: {
      name: 'Scan to PDF / Images to PDF',
      title: 'Scan to PDF — Turn Photos into a Clean PDF Scan, Images to PDF Free',
      desc: 'Turn phone photos of documents, receipts and notes into a clean scanned PDF, with auto-enhance, grayscale or black-and-white. Also converts JPG/PNG to PDF. No upload.',
      h1: 'Scan documents to PDF with your phone or photos',
      lead: 'Take photos of paper documents (or pick existing images), clean them up with a scanner filter, and save them as one PDF. Works on phones and computers.',
      steps: [
        'Tap "Take photo" on your phone, or drop images on the box.',
        'Choose a filter — Enhanced, Grayscale or Black & white makes photos look like scans — and the page size.',
        'Rotate or reorder pages if needed, then click Create PDF.',
      ],
      faq: [
        ['How do I make a photo look like a scan?', 'Choose "Black & white document". It evens out shadows and turns the paper white and the text black, like a photocopy. "Enhanced" keeps colour but increases contrast.'],
        ['Tips for better scans', 'Lay the paper on a dark, flat surface, fill the frame with the page, avoid your own shadow and hold the phone parallel to the paper.'],
        ['Can I convert JPG or PNG to PDF?', 'Yes. Choose the "Original" filter and "Fit to image" page size to put images into a PDF unchanged.'],
        ['Is anything uploaded?', 'No. Photos are processed and the PDF is created on your device.'],
      ],
      ui: {
        drop: 'Drop images here or click to choose', dropSub: 'JPG, PNG, WebP, HEIC · several pages at once', camera: '📷 Take photo',
        filter: 'Filter', fOriginal: 'Original', fEnhance: 'Enhanced colour', fGray: 'Grayscale', fBw: 'Black & white document',
        size: 'Page size', sA4: 'A4', sLetter: 'US Letter', sFit: 'Fit to image', margin: 'Margin', mNone: 'None', mSmall: 'Small', mNormal: 'Normal',
        create: 'Create PDF', working: 'Processing page $1 of $2…', done: 'Created a $1-page PDF ($2).', page: 'Page $1', outName: 'scan.pdf',
        rotL: 'Rotate left', rotR: 'Rotate right', left: 'Move left', right: 'Move right',
      },
    },
    zh: {
      name: '扫描成 PDF / 图片转 PDF',
      title: '手机扫描成 PDF — 把照片变成清晰的扫描件，图片转 PDF 免费',
      desc: '把手机拍的文件、收据、笔记照片变成清晰的扫描版 PDF，支持自动增强、灰度、黑白文档效果。也可以把 JPG/PNG 转成 PDF。不上传。',
      h1: '用手机拍照扫描成 PDF',
      lead: '给纸质文件拍照（或选择已有图片），用扫描滤镜处理干净，再合成为一个 PDF。手机和电脑都能用。',
      steps: [
        '在手机上点「拍照」，或把图片拖到框里。',
        '选择滤镜（增强、灰度、黑白文档能让照片看起来像扫描件）和纸张大小。',
        '需要时旋转或调整页面顺序，然后点击「生成 PDF」。',
      ],
      faq: [
        ['怎样让照片看起来像扫描件？', '选择「黑白文档」。它会去除阴影，把纸变白、字变黑，就像复印件一样。「增强」则保留颜色并提高对比度。'],
        ['怎样拍得更清楚？', '把纸平放在深色平整的桌面上，让纸张占满画面，避免自己的影子，手机与纸面保持平行。'],
        ['可以把 JPG 或 PNG 转成 PDF 吗？', '可以。滤镜选「原图」，纸张大小选「适应图片」，图片会原样放入 PDF。'],
        ['会上传任何内容吗？', '不会。照片在你的设备上处理，PDF 也在本地生成。'],
      ],
      ui: {
        drop: '把图片拖到这里，或点击选择', dropSub: 'JPG、PNG、WebP、HEIC · 可一次添加多页', camera: '📷 拍照',
        filter: '滤镜', fOriginal: '原图', fEnhance: '增强（彩色）', fGray: '灰度', fBw: '黑白文档',
        size: '纸张大小', sA4: 'A4', sLetter: '美国信纸', sFit: '适应图片', margin: '页边距', mNone: '无', mSmall: '小', mNormal: '标准',
        create: '生成 PDF', working: '正在处理第 $1 / $2 页…', done: '已生成 $1 页的 PDF（$2）。', page: '第 $1 页', outName: '扫描件.pdf',
        rotL: '向左旋转', rotR: '向右旋转', left: '左移', right: '右移',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="sp-drop"><strong>${s.drop}</strong>${s.dropSub}</div>
<div class="row"><label class="btn secondary" for="sp-cam">${s.camera}</label><input type="file" id="sp-cam" accept="image/*" capture="environment" hidden></div>
<div class="fields">
  <label class="field"><span>${s.filter}</span><select id="sp-filter"><option value="enhance">${s.fEnhance}</option><option value="bw">${s.fBw}</option><option value="gray">${s.fGray}</option><option value="original">${s.fOriginal}</option></select></label>
  <label class="field"><span>${s.size}</span><select id="sp-size"><option value="a4">${s.sA4}</option><option value="letter">${s.sLetter}</option><option value="fit">${s.sFit}</option></select></label>
  <label class="field"><span>${s.margin}</span><select id="sp-margin"><option value="0">${s.mNone}</option><option value="18" selected>${s.mSmall}</option><option value="36">${s.mNormal}</option></select></label>
</div>
<div class="row"><button class="btn big" id="sp-go" disabled>${s.create}</button></div>
<div class="status" id="sp-status" hidden></div>
<div class="thumbs" id="sp-thumbs"></div>`,
};
