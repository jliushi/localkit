import { html } from '../../build/html.mjs';

export default {
  id: 'pdf-organize',
  category: 'pdf',
  icon: '⟳',
  color: '#b45309',
  strings: {
    en: {
      name: 'Rotate, Delete & Reorder PDF Pages',
      title: 'Rotate PDF, Delete Pages & Reorder Pages Online — Free',
      desc: 'Rotate PDF pages, delete pages and drag pages into a new order, with a live preview. Saves a new PDF in your browser — no upload, no watermark.',
      h1: 'Rotate, delete and reorder PDF pages',
      lead: 'Fix sideways scans, remove blank or unwanted pages and put pages in the right order — then save a clean new PDF.',
      steps: ['Drop a PDF on the box.', 'Use ⟲ ⟳ to rotate a page, 🗑 to delete it, and drag pages to reorder (or use ← →).', 'Click Save PDF.'],
      faq: [
        ['How do I rotate only one page?', 'Use the rotate buttons under that page. "Rotate all" turns every page.'],
        ['Can I undo a deletion?', 'Yes. Deleted pages stay greyed out until you save; click 🗑 again to restore.'],
        ['Is the rotation permanent?', 'Yes. The saved PDF stores the new orientation, so it opens correctly everywhere.'],
        ['Are my files uploaded?', 'No. The PDF is edited in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF here or click to choose', rotateAll: 'Rotate all ⟳', save: 'Save PDF', saving: 'Saving…',
        done: 'Saved $1 pages.', allDeleted: 'All pages are deleted — keep at least one.', page: 'Page $1', rotL: 'Rotate left',
        rotR: 'Rotate right', del: 'Delete / restore', left: 'Move left', right: 'Move right', loading: 'Loading pages…', reset: 'Start over',
      },
    },
    zh: {
      name: 'PDF 旋转、删除、排序页面',
      title: 'PDF 旋转页面、删除页面、调整页面顺序 — 在线免费',
      desc: '旋转 PDF 页面、删除页面、拖动调整页面顺序，实时预览。在浏览器中保存为新 PDF，不上传、无水印。',
      h1: '旋转、删除和重新排序 PDF 页面',
      lead: '把扫描歪了的页面转正，删除空白或多余的页面，按正确顺序排列，然后保存为新的 PDF。',
      steps: ['把 PDF 拖到框里。', '用 ⟲ ⟳ 旋转页面，用 🗑 删除页面，拖动页面调整顺序（或用 ← →）。', '点击「保存 PDF」。'],
      faq: [
        ['怎么只旋转某一页？', '点击该页下方的旋转按钮即可。「全部旋转」会旋转所有页面。'],
        ['删错了能恢复吗？', '可以。保存前被删除的页面只是变灰，再点一次 🗑 就能恢复。'],
        ['旋转是永久的吗？', '是的。保存后的 PDF 记录了新的方向，在任何阅读器里都能正确显示。'],
        ['文件会被上传吗？', '不会，PDF 在你的浏览器中编辑。'],
      ],
      ui: {
        drop: '把 PDF 拖到这里，或点击选择', rotateAll: '全部旋转 ⟳', save: '保存 PDF', saving: '正在保存…',
        done: '已保存 $1 页。', allDeleted: '所有页面都被删除了，请至少保留一页。', page: '第 $1 页', rotL: '向左旋转',
        rotR: '向右旋转', del: '删除 / 恢复', left: '左移', right: '右移', loading: '正在加载页面…', reset: '重新开始',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="po-drop"><strong>${s.drop}</strong></div>
<div id="po-work" hidden>
  <div class="row"><button class="btn big" id="po-save">${s.save}</button><button class="btn ghost" id="po-rotall">${s.rotateAll}</button><button class="btn ghost" id="po-reset">${s.reset}</button></div>
  <div class="status" id="po-status" hidden></div>
  <div class="thumbs" id="po-thumbs"></div>
</div>`,
};
