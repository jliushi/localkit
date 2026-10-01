import { html } from '../../build/html.mjs';

export default {
  id: 'pdf-merge',
  category: 'pdf',
  icon: 'PDF',
  color: '#dc2626',
  strings: {
    en: {
      name: 'Merge PDF',
      title: 'Merge PDF Files Online — Combine PDFs Free, No Upload',
      desc: 'Combine several PDF files into one, in any order. Free, no file-size limit, no watermark — PDFs are merged in your browser and never uploaded.',
      h1: 'Merge PDF files into one',
      lead: 'Combine contracts, invoices, scans or chapters into a single PDF. Drag to reorder the files. Merging happens on your device, so confidential documents stay private.',
      steps: ['Drop two or more PDF files on the box (or click to choose).', 'Drag the files into the order you want.', 'Click Merge PDF and save the combined file.'],
      faq: [
        ['Is there a file-size or page limit?', 'No. The only limit is your device memory; merging hundreds of pages works on a normal computer.'],
        ['Will the quality change?', 'No. Pages are copied as they are — text, images and fonts are not re-compressed.'],
        ['Can I merge password-protected PDFs?', 'Not directly. Open the file with its password, save an unprotected copy, and merge that.'],
        ['Are my files uploaded?', 'No. The PDFs are read and combined by your browser; nothing is sent to a server.'],
      ],
      ui: {
        drop: 'Drop PDF files here or click to choose', dropSub: 'Add as many as you like · drag to reorder',
        merge: 'Merge PDF', merging: 'Merging…', needTwo: 'Add at least two PDF files.', pages: '$1 pages',
        done: 'Merged $1 files, $2 pages ($3).', outName: 'merged.pdf', up: 'Move up', down: 'Move down',
      },
    },
    zh: {
      name: 'PDF 合并',
      title: 'PDF 合并 — 在线把多个 PDF 合并成一个，免费，不上传',
      desc: '把多个 PDF 文件按任意顺序合并成一个。免费、不限大小、无水印 —— PDF 在浏览器中合并，绝不上传。',
      h1: '把多个 PDF 合并成一个文件',
      lead: '把合同、发票、扫描件或章节合并成一个 PDF，可拖动调整顺序。合并在你的设备上完成，机密文件也安全。',
      steps: ['把两个或更多 PDF 文件拖到框里（或点击选择）。', '拖动文件，调整成你想要的顺序。', '点击「合并 PDF」，保存合并后的文件。'],
      faq: [
        ['有文件大小或页数限制吗？', '没有，唯一的限制是设备内存。普通电脑合并几百页没有问题。'],
        ['合并后质量会变吗？', '不会。页面原样复制，文字、图片和字体都不会被重新压缩。'],
        ['可以合并有密码的 PDF 吗？', '不能直接合并。请先用密码打开文件，另存为无密码版本后再合并。'],
        ['文件会被上传吗？', '不会。PDF 由你的浏览器读取并合并，不会发送到任何服务器。'],
      ],
      ui: {
        drop: '把 PDF 文件拖到这里，或点击选择', dropSub: '数量不限 · 可拖动排序',
        merge: '合并 PDF', merging: '正在合并…', needTwo: '请至少添加两个 PDF 文件。', pages: '$1 页',
        done: '已合并 $1 个文件，共 $2 页（$3）。', outName: '合并.pdf', up: '上移', down: '下移',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="pm-drop"><strong>${s.drop}</strong>${s.dropSub}</div>
<ul class="files" id="pm-files"></ul>
<div class="row"><button class="btn big" id="pm-go" disabled>${s.merge}</button></div>
<div class="status" id="pm-status" hidden></div>`,
};
