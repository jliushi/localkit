import { html } from '../../build/html.mjs';

export default {
  id: 'merge-pdf',
  category: 'pdf',
  iconName: 'file-stack',
  color: '#dc2626',
  related: ['split-pdf', 'organize-pdf', 'compress-pdf'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Merge PDF',
      short: 'Combine several PDFs into one file, in the order you choose.',
      keywords: ['combine pdf', 'join pdf', 'pdf merger', 'merge pdf files'],
      title: 'Merge PDF Online Free — Combine PDF Files in Seconds (No Upload)',
      desc: 'Combine multiple PDF files into one: drag to reorder, see the first page of each file, and download the merged PDF. Free, no sign-up, no watermark — PDFs never leave your device.',
      h1: 'Merge PDF files into one document',
      sub: 'Add your PDFs, drag them into order and download one combined file. Pages are copied exactly as they are, and nothing is uploaded — ideal for contracts, invoices and scans.',
      features: [
        ['grip-vertical', 'Drag to reorder', 'Each file shows its first page and page count. Drag cards or use the arrows to put them in the right order.'],
        ['badge-check', 'Original quality', 'Pages, text, fonts, links and images are copied unchanged — nothing is re-compressed or rasterised.'],
        ['lock', 'Confidential stays confidential', 'Merging happens in your browser, so private documents never touch a server.'],
      ],
      howToTitle: 'How to merge PDF files',
      steps: [
        'Drop two or more PDF files on the box (or choose them from your device).',
        'Drag the files into the order you want. Add more files any time.',
        'Press Merge PDF and download the combined document.',
      ],
      guide: [
        ['Good to know', { list: ['Bookmarks and form fields from the original files are not carried over; the visible content of every page is.', 'Password-protected PDFs need to be unlocked first (open with the password and save a copy).', 'To remove or rotate pages after merging, use Organize PDF.', 'To merge photos or scans, use JPG to PDF instead.'] }],
      ],
      faq: [
        ['How do I combine PDF files into one?', 'Drop the PDFs here, drag them into order and press Merge PDF. The merged file downloads immediately.'],
        ['Is there a limit to how many PDFs I can merge?', 'No. Merge as many files and pages as your device memory allows — hundreds of pages are no problem.'],
        ['Does merging reduce quality?', 'No. Pages are copied exactly; nothing is re-compressed.'],
        ['Can I merge PDFs on my phone?', 'Yes. Open this page on iPhone or Android, pick the PDFs from Files and download the result.'],
        ['Are my PDFs uploaded?', 'No. The PDFs are read and combined inside your browser.'],
      ],
      ui: {
        drop: 'Drop PDF files here', dropHint: 'Add two or more · stays on your device', add: 'Add more PDFs', merge: 'Merge PDF', merging: 'Merging…',
        pages: '$1 pages', page1: '1 page', total: '$1 files · $2 pages', needTwo: 'Add at least one more PDF to merge.', up: 'Move up', down: 'Move down',
        done: 'Merged $1 files into one PDF · $2 pages · $3', download: 'Download PDF', outName: 'merged.pdf', reading: 'Reading…',
      },
    },
    zh: {
      name: 'PDF 合并',
      short: '把多个 PDF 按你想要的顺序合并成一个文件。',
      keywords: ['合并 pdf', 'pdf 拼接', 'pdf 合并工具', '多个 pdf 合成一个'],
      title: 'PDF 合并 — 在线免费把多个 PDF 合并成一个（不上传）',
      desc: '把多个 PDF 合并成一个：可拖动排序，能看到每个文件的第一页，直接下载合并后的 PDF。免费、免注册、无水印 —— PDF 不离开你的设备。',
      h1: '把多个 PDF 合并成一个文件',
      sub: '添加 PDF，拖动调整顺序，下载合并好的文件。页面原样复制，也不会上传任何内容 —— 合同、发票、扫描件都可以放心合并。',
      features: [
        ['grip-vertical', '拖动排序', '每个文件都显示第一页和页数，拖动卡片或使用箭头调整到正确的顺序。'],
        ['badge-check', '保持原始质量', '页面、文字、字体、链接和图片原样复制，不会重新压缩，也不会转成图片。'],
        ['lock', '机密文件也放心', '合并在你的浏览器中完成，私密文件不会经过任何服务器。'],
      ],
      howToTitle: '如何合并 PDF 文件',
      steps: [
        '把两个或更多 PDF 拖到框里（或从设备中选择）。',
        '拖动文件调整顺序，随时可以继续添加。',
        '点击「合并 PDF」，下载合并后的文件。',
      ],
      guide: [
        ['需要了解的', { list: ['原文件的书签和表单域不会保留，但每一页可见的内容都会完整保留。', '有密码的 PDF 需要先解锁（用密码打开后另存一份）。', '合并后要删除或旋转页面，请使用「PDF 页面整理」。', '要把照片或扫描图片合成 PDF，请使用「图片转 PDF」。'] }],
      ],
      faq: [
        ['怎么把多个 PDF 合并成一个？', '把 PDF 拖进来，调整好顺序，点击「合并 PDF」，合并后的文件会立即下载。'],
        ['一次最多能合并多少个 PDF？', '没有限制，只受设备内存影响 —— 几百页完全没问题。'],
        ['合并会降低质量吗？', '不会，页面原样复制，不会重新压缩。'],
        ['手机上能合并 PDF 吗？', '能。在 iPhone 或安卓手机上打开本页，从「文件」中选择 PDF，然后下载结果。'],
        ['PDF 会被上传吗？', '不会，PDF 在你的浏览器中读取并合并。'],
      ],
      ui: {
        drop: '把 PDF 文件拖到这里', dropHint: '添加两个或更多 · 文件不离开你的设备', add: '继续添加 PDF', merge: '合并 PDF', merging: '正在合并…',
        pages: '$1 页', page1: '1 页', total: '$1 个文件 · 共 $2 页', needTwo: '请再添加至少一个 PDF。', up: '上移', down: '下移',
        done: '已把 $1 个文件合并为一个 PDF · $2 页 · $3', download: '下载 PDF', outName: '合并.pdf', reading: '正在读取…',
      },
    },
  },
  ui: (s) => html`
<div id="pm-pick"></div>
<div id="pm-work" class="panel" hidden>
  <ul class="flist" id="pm-list"></ul>
  <div id="pm-more"></div>
  <div class="actions"><button class="btn lg" id="pm-go">${s.merge}</button><span class="muted" id="pm-total"></span></div>
  <div id="pm-alert"></div>
  <div id="pm-task"></div>
  <div id="pm-result"></div>
</div>`,
};
