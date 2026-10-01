import { html } from '../../build/html.mjs';

export default {
  id: 'organize-pdf',
  category: 'pdf',
  iconName: 'layout-grid',
  color: '#b45309',
  related: ['merge-pdf', 'split-pdf', 'edit-pdf'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Rotate & Organize PDF',
      short: 'Rotate, delete and reorder PDF pages with drag and drop.',
      keywords: ['rotate pdf', 'delete pdf pages', 'reorder pdf', 'rearrange pdf', 'remove pages from pdf', 'organize pdf', 'flip pdf'],
      title: 'Rotate PDF & Delete or Reorder Pages — Free Online, No Upload',
      desc: 'Rotate PDF pages, delete pages and drag them into a new order with page thumbnails. Bulk-select pages, append another PDF, and save. Free, private, in your browser.',
      h1: 'Rotate, delete and reorder PDF pages',
      sub: 'This PDF organizer fixes page problems without uploading anything: straighten sideways scans, remove blank or unwanted pages, and drag pages into the right order with live thumbnails, then save a clean new PDF.',
      features: [
        ['rotate-cw', 'Rotate single or all pages', 'Turn pages left or right one by one, rotate a selection, or rotate the whole document. The rotation is saved in the file.'],
        ['grip-vertical', 'Drag and drop order', 'Drag thumbnails to rearrange pages, or use the arrow buttons. Add pages from another PDF at the end.'],
        ['trash-2', 'Remove pages safely', 'Deleted pages are greyed out until you save, so you can undo with one click.'],
      ],
      howToTitle: 'How to rotate or rearrange PDF pages',
      steps: [
        'Drop a PDF on the box. Every page appears as a thumbnail.',
        'Use the buttons under a page to rotate or delete it, drag pages to reorder, or click pages to select several and use the toolbar.',
        'Press Save PDF to download the reorganised document.',
      ],
      guide: [
        ['Tips', { list: ['Click a page to select it; Shift-click selects a range. The toolbar then rotates or deletes all selected pages.', 'Rotation is stored as page orientation, so text stays sharp and selectable.', 'Need to remove many pages? "Select all", click the pages you want to keep to deselect them, then "Delete selected".'] }],
      ],
      faq: [
        ['How do I rotate a PDF and save it?', 'Drop the PDF, press the rotate button under each sideways page (or "Rotate all"), then Save PDF. The new orientation is saved permanently.'],
        ['How do I delete pages from a PDF?', 'Click the trash button under the pages you want to remove (or select them and press "Delete selected"), then Save PDF.'],
        ['Can I undo a deleted page?', 'Yes — until you save, deleted pages stay greyed out. Press the button again to restore them.'],
        ['Can I combine pages from two PDFs?', 'Yes. Press "Add pages from another PDF"; its pages are appended and can be reordered freely.'],
        ['Is my PDF uploaded?', 'No. Everything happens in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF to organize', dropHint: 'Stays on your device', save: 'Save PDF', saving: 'Saving…', rotL: 'Rotate left', rotR: 'Rotate right', del: 'Delete / restore',
        left: 'Move earlier', right: 'Move later', rotAll: 'Rotate all', rotSel: 'Rotate selected', delSel: 'Delete selected', selAll: 'Select all', selNone: 'Clear selection',
        addPdf: 'Add pages from another PDF', page: 'Page $1', allDeleted: 'Every page is deleted — keep at least one.', done: 'Saved · $1 pages · $2',
        download: 'Download again', another: 'Organize another PDF', summary: '$1 pages · $2 selected · $3 deleted', hint: 'Drag to reorder · click to select · Shift-click for a range',
      },
    },
    zh: {
      name: 'PDF 旋转与页面整理',
      short: '旋转、删除、拖动排序 PDF 页面。',
      keywords: ['旋转 pdf', '删除 pdf 页面', 'pdf 页面排序', 'pdf 调整页面顺序', 'pdf 删页', '整理 pdf'],
      title: 'PDF 旋转、删除页面、调整顺序 — 在线免费（不上传）',
      desc: '旋转 PDF 页面、删除页面、拖动调整页面顺序 —— 带页面缩略图。可多选批量操作，可追加另一个 PDF 的页面，然后保存。免费、私密，在浏览器中完成。',
      h1: '旋转、删除和调整 PDF 页面顺序',
      sub: '这是一个免费的在线 PDF 页面整理工具：把扫描歪了的页面旋转转正，删除空白或不需要的页面，拖动排序。可批量选中，保存为新的 PDF，全程不上传。',
      features: [
        ['rotate-cw', '单页或整份旋转', '逐页向左或向右旋转，也可以旋转选中的页面或整份文档。旋转方向会保存在文件中。'],
        ['grip-vertical', '拖放排序', '拖动缩略图调整页面顺序，或使用箭头按钮；还可以在末尾追加另一个 PDF 的页面。'],
        ['trash-2', '安全删除页面', '保存之前，被删除的页面只是变灰，点一下就能恢复。'],
      ],
      howToTitle: '如何旋转或调整 PDF 页面',
      steps: [
        '把 PDF 拖到框里，每一页都会显示为缩略图。',
        '用页面下方的按钮旋转或删除，拖动页面调整顺序；也可以点击选中多页，再用工具栏批量操作。',
        '点击「保存 PDF」下载整理后的文档。',
      ],
      guide: [
        ['小技巧', { list: ['点击页面即可选中，按住 Shift 点击可选择连续范围；然后用工具栏旋转或删除所有选中的页面。', '旋转以页面方向的形式保存，文字依然清晰、可以选中。', '要删除很多页？先「全选」，再点击想保留的页面取消选中，最后「删除选中」。'] }],
      ],
      faq: [
        ['怎么旋转 PDF 并保存？', '拖入 PDF，点击歪了的页面下方的旋转按钮（或「全部旋转」），然后点「保存 PDF」，新的方向会永久保存。'],
        ['怎么删除 PDF 中的页面？', '点击要删除页面下方的垃圾桶按钮（或选中后点「删除选中」），然后保存 PDF。'],
        ['删错了能撤销吗？', '可以。保存之前，被删除的页面只是变灰，再点一次按钮就能恢复。'],
        ['能把两个 PDF 的页面放在一起吗？', '能。点击「追加另一个 PDF 的页面」，它的页面会加在末尾，可以自由调整顺序。'],
        ['PDF 会被上传吗？', '不会，全部在你的浏览器中完成。'],
      ],
      ui: {
        drop: '拖入要整理的 PDF', dropHint: '文件不离开你的设备', save: '保存 PDF', saving: '正在保存…', rotL: '向左旋转', rotR: '向右旋转', del: '删除 / 恢复',
        left: '前移', right: '后移', rotAll: '全部旋转', rotSel: '旋转选中', delSel: '删除选中', selAll: '全选', selNone: '取消选择',
        addPdf: '追加另一个 PDF 的页面', page: '第 $1 页', allDeleted: '所有页面都被删除了，请至少保留一页。', done: '已保存 · $1 页 · $2',
        download: '再次下载', another: '整理另一个 PDF', summary: '共 $1 页 · 选中 $2 · 删除 $3', hint: '拖动排序 · 点击选中 · Shift 点击选择范围',
      },
    },
  },
  ui: (s) => html`
<div id="po-pick"></div>
<div id="po-work" class="panel" hidden>
  <div class="bar-sticky">
    <button class="btn" id="po-save">${s.save}</button>
    <button class="btn ghost sm" id="po-rotall">${s.rotAll}</button>
    <button class="btn ghost sm" id="po-rotsel">${s.rotSel}</button>
    <button class="btn ghost sm" id="po-delsel">${s.delSel}</button>
    <button class="btn ghost sm" id="po-selall">${s.selAll}</button>
    <button class="btn ghost sm" id="po-selnone">${s.selNone}</button>
    <span class="muted small" id="po-sum"></span>
  </div>
  <p class="note">${s.hint}</p>
  <div id="po-alert"></div>
  <div id="po-task"></div>
  <div id="po-result"></div>
  <div class="pages" id="po-pages"></div>
  <div id="po-add"></div>
</div>`,
};
