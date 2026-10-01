import { html } from '../../build/html.mjs';

export default {
  id: 'compress-pdf',
  category: 'pdf',
  iconName: 'file-archive',
  color: '#9333ea',
  related: ['merge-pdf', 'scan-to-pdf', 'compress-image'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Compress PDF',
      short: 'Make PDFs smaller by recompressing their images, keeping text sharp.',
      keywords: ['reduce pdf size', 'pdf compressor', 'shrink pdf', 'make pdf smaller', 'pdf size', 'compress pdf online'],
      title: 'Compress PDF Online — Reduce PDF Size Free, No Upload',
      desc: 'Reduce PDF file size by recompressing the photos and scans inside, while text stays sharp and selectable. Three compression levels, clear before/after sizes. Free, private, no upload.',
      h1: 'Compress PDF — reduce the file size',
      sub: 'Compress PDF shrinks a PDF by recompressing the images inside it. Most large PDFs are large because of their photos and scans; those are resized and recompressed while text, fonts and vector graphics stay untouched — sharp and searchable, on your device only.',
      features: [
        ['image-down', 'Shrinks the images only', 'Photos and scanned pages are resized and recompressed; text and drawings stay vector and selectable.'],
        ['sliders-horizontal', 'Three levels', 'Light keeps print quality, Recommended is right for e-mail and portals, Strong squeezes scans to the minimum.'],
        ['lock', 'Private', 'Contracts, bank statements and IDs are compressed on your device, never uploaded to a server.'],
      ],
      howToTitle: 'How to compress a PDF',
      steps: ['Drop the PDF on the box.', 'Choose a compression level — Recommended suits most uses.', 'Press Compress PDF and compare the before/after size, then download.'],
      guide: [
        ['How much smaller will it get?', 'It depends on what the PDF contains. Scanned documents and PDFs with photos often shrink by 50–90%. PDFs that are mostly text are usually small already and may not shrink much; LocalKit tells you when the result isn\'t smaller and keeps your original.'],
        ['Which level should I choose?', { table: [['Level', 'Images', 'Use for'], ['Light', 'up to 2400 px, high quality', 'Printing, archiving'], ['Recommended', 'up to 1600 px, good quality', 'E-mail, upload forms, sharing'], ['Strong', 'up to 1100 px, smaller', 'Scans that must fit strict limits (e.g. 2 MB)']] }],
      ],
      faq: [
        ['How do I reduce the size of a PDF?', 'Drop the PDF here, keep "Recommended" and press Compress PDF. The images inside are recompressed and the smaller file downloads.'],
        ['Will the text become blurry?', 'No. Only images are recompressed; text and vector graphics are not touched.'],
        ['Why didn\'t my PDF get smaller?', 'If it contains mostly text or already-optimised images, there is little to remove. Try the Strong level for scans.'],
        ['Can I compress a scanned PDF?', 'Yes — scanned PDFs are made of images, so they usually compress very well.'],
        ['Is my PDF uploaded?', 'No. Compression runs in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF to compress', dropHint: 'Stays on your device', level: 'Compression level', lLight: 'Light', lLightSub: 'best quality', lRec: 'Recommended', lRecSub: 'e-mail & upload', lStrong: 'Strong', lStrongSub: 'smallest',
        compress: 'Compress PDF', compressing: 'Compressing images… $1 of $2', saving: 'Saving…', done: 'Your PDF is $1 smaller.', notSmaller: 'This PDF is already well optimised — the compressed version is not smaller. Your original is fine to use.',
        before: 'Before', after: 'After', saved: 'Saved', download: 'Download compressed PDF', another: 'Compress another PDF', images: '$1 images recompressed', noImages: 'No compressible images were found in this PDF; it was only re-saved.', pagesN: '$1 pages',
      },
    },
    zh: {
      name: 'PDF 压缩',
      short: '重新压缩 PDF 里的图片来减小体积，文字依然清晰。',
      keywords: ['pdf 压缩', '减小 pdf 大小', 'pdf 变小', 'pdf 文件太大', '压缩 pdf 文件', 'pdf 太大怎么压缩', '在线压缩 pdf'],
      title: 'PDF 压缩 — 在线减小 PDF 文件大小，文字清晰（不上传）',
      desc: '通过重新压缩 PDF 中的照片和扫描图来减小文件大小，文字保持清晰可选。三种压缩强度，显示压缩前后大小。免费、私密，在浏览器中完成，不上传。',
      h1: 'PDF 压缩：减小文件大小',
      sub: 'PDF 压缩是一个免费的在线工具：大多数 PDF 之所以大，是因为里面的图片。LocalKit 缩小并重新压缩这些图片，文字和矢量图形保持不变，文档依然清晰、可搜索，全程不上传。',
      features: [
        ['image-down', '只压缩图片', '照片和扫描页会被缩小并重新压缩；文字和矢量图形保持矢量，可以选中复制。'],
        ['sliders-horizontal', '三种强度', '「轻度」保留打印质量，「推荐」适合邮件和网站上传，「强力」把扫描件压到最小。'],
        ['lock', '私密', '合同、银行流水、证件都在你的设备上压缩，绝不上传到服务器。'],
      ],
      howToTitle: '如何压缩 PDF',
      steps: ['把 PDF 拖到框里。', '选择压缩强度 —— 大多数情况选「推荐」即可。', '点击「压缩 PDF」，对比压缩前后的大小，然后下载。'],
      guide: [
        ['能压缩多少？', '取决于 PDF 的内容。扫描件和带照片的 PDF 通常能减小 50–90%。以文字为主的 PDF 本来就不大，可能压缩不了多少；如果结果没有变小，LocalKit 会提示你继续使用原文件。'],
        ['压缩强度怎么选？', { table: [['强度', '图片处理', '适用场景'], ['轻度', '最大 2400 像素，高质量', '打印、存档'], ['推荐', '最大 1600 像素，良好质量', '邮件、网站上传、分享'], ['强力', '最大 1100 像素，更小', '必须满足严格限制的扫描件（如 2MB）']] }],
      ],
      faq: [
        ['怎么减小 PDF 的大小？', '把 PDF 拖进来，保持「推荐」，点击「压缩 PDF」。里面的图片会被重新压缩，并下载更小的文件。'],
        ['文字会变模糊吗？', '不会。只重新压缩图片，文字和矢量图形不受影响。'],
        ['为什么我的 PDF 没有变小？', '如果它主要是文字，或者图片已经优化过，就没有多少可以压缩的空间。扫描件可以试试「强力」。'],
        ['扫描版 PDF 能压缩吗？', '能 —— 扫描版 PDF 由图片组成，通常压缩效果非常好。'],
        ['PDF 会被上传吗？', '不会，压缩在你的浏览器中完成。'],
      ],
      ui: {
        drop: '拖入要压缩的 PDF', dropHint: '文件不离开你的设备', level: '压缩强度', lLight: '轻度', lLightSub: '质量最好', lRec: '推荐', lRecSub: '邮件和上传', lStrong: '强力', lStrongSub: '体积最小',
        compress: '压缩 PDF', compressing: '正在压缩图片… 第 $1 / $2 张', saving: '正在保存…', done: '你的 PDF 缩小了 $1。', notSmaller: '这个 PDF 已经优化得很好，压缩后并没有变小，继续使用原文件即可。',
        before: '压缩前', after: '压缩后', saved: '节省', download: '下载压缩后的 PDF', another: '压缩另一个 PDF', images: '已重新压缩 $1 张图片', noImages: '这个 PDF 中没有可压缩的图片，只做了重新保存。', pagesN: '共 $1 页',
      },
    },
  },
  ui: (s) => html`
<div id="cp-pick"></div>
<div id="cp-work" class="panel" hidden>
  <div id="cp-file"></div>
  <div class="opt"><span class="field-label">${s.level}</span><div class="chips">
    <label class="chip"><input type="radio" name="cp-l" value="light"><span>${s.lLight} <small>${s.lLightSub}</small></span></label>
    <label class="chip"><input type="radio" name="cp-l" value="rec" checked><span>${s.lRec} <small>${s.lRecSub}</small></span></label>
    <label class="chip"><input type="radio" name="cp-l" value="strong"><span>${s.lStrong} <small>${s.lStrongSub}</small></span></label>
  </div></div>
  <div class="actions"><button class="btn lg" id="cp-go">${s.compress}</button></div>
  <div id="cp-alert"></div>
  <div id="cp-task"></div>
  <div id="cp-result"></div>
</div>`,
};
