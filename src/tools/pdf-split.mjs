import { html } from '../../build/html.mjs';

export default {
  id: 'pdf-split',
  category: 'pdf',
  icon: '✂',
  color: '#ea580c',
  strings: {
    en: {
      name: 'Split PDF',
      title: 'Split PDF Online — Extract Pages or Split by Range, Free',
      desc: 'Split a PDF into single pages or page ranges, or extract the pages you pick into a new PDF. Visual page preview, free, no upload — runs in your browser.',
      h1: 'Split a PDF or extract pages',
      lead: 'See every page, click the ones you need, or type ranges like 1-3, 8, 10-. Get one new PDF, one file per range, or one file per page.',
      steps: ['Drop a PDF on the box.', 'Click pages to select them, or type page ranges.', 'Choose how to split and click Split PDF. Several files are downloaded as a ZIP.'],
      faq: [
        ['How do I extract a few pages from a PDF?', 'Click the pages you want (they turn green), choose "Selected pages → one PDF" and click Split PDF.'],
        ['How do page ranges work?', 'Separate ranges with commas: "1-3, 5, 9-" makes three files — pages 1 to 3, page 5, and page 9 to the end.'],
        ['Does splitting reduce quality?', 'No. Pages are copied unchanged.'],
        ['Is the PDF uploaded?', 'No. Everything happens in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF here or click to choose', mode: 'Split mode', modeSelected: 'Selected pages → one PDF',
        modeRanges: 'Page ranges → one PDF each', modeEach: 'Every page → separate PDF', ranges: 'Page ranges', rangesPh: 'e.g. 1-3, 5, 9-',
        selectAll: 'Select all', selectNone: 'Select none', split: 'Split PDF', working: 'Splitting…', selectedN: '$1 of $2 pages selected',
        noneSelected: 'Click at least one page to select it.', badRange: 'Invalid range: $1', done: 'Created $1 file(s).', page: 'Page $1', loading: 'Loading pages…',
      },
    },
    zh: {
      name: 'PDF 拆分',
      title: 'PDF 拆分 — 在线提取页面或按范围拆分，免费',
      desc: '把 PDF 拆分成单页或指定页码范围，或把选中的页面提取成新的 PDF。可视化预览页面，免费、不上传，在浏览器中运行。',
      h1: '拆分 PDF / 提取页面',
      lead: '预览每一页，点选需要的页面，或输入页码范围如 1-3, 8, 10-。可以生成一个新 PDF、每个范围一个文件，或每页一个文件。',
      steps: ['把 PDF 拖到框里。', '点击页面进行选择，或输入页码范围。', '选择拆分方式并点击「拆分 PDF」。多个文件会打包成 ZIP 下载。'],
      faq: [
        ['怎么从 PDF 里提取几页？', '点击需要的页面（变成绿色），选择「选中的页面 → 一个 PDF」，再点击「拆分 PDF」。'],
        ['页码范围怎么写？', '用逗号分隔各个范围：「1-3, 5, 9-」会生成三个文件 —— 第 1 到 3 页、第 5 页、第 9 页到最后。'],
        ['拆分会降低质量吗？', '不会，页面原样复制。'],
        ['PDF 会被上传吗？', '不会，全部在浏览器中完成。'],
      ],
      ui: {
        drop: '把 PDF 拖到这里，或点击选择', mode: '拆分方式', modeSelected: '选中的页面 → 一个 PDF',
        modeRanges: '按页码范围 → 每个范围一个 PDF', modeEach: '每一页 → 单独的 PDF', ranges: '页码范围', rangesPh: '例如 1-3, 5, 9-',
        selectAll: '全选', selectNone: '全不选', split: '拆分 PDF', working: '正在拆分…', selectedN: '已选 $1 / $2 页',
        noneSelected: '请至少点击选择一页。', badRange: '页码范围无效：$1', done: '已生成 $1 个文件。', page: '第 $1 页', loading: '正在加载页面…',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="ps-drop"><strong>${s.drop}</strong></div>
<div id="ps-work" hidden>
  <div class="fields">
    <label class="field"><span>${s.mode}</span>
      <select id="ps-mode"><option value="selected">${s.modeSelected}</option><option value="ranges">${s.modeRanges}</option><option value="each">${s.modeEach}</option></select>
    </label>
    <label class="field" id="ps-ranges-wrap" hidden><span>${s.ranges}</span><input type="text" id="ps-ranges" placeholder="${s.rangesPh}"></label>
  </div>
  <div class="row"><button class="btn big" id="ps-go">${s.split}</button><button class="btn ghost" id="ps-all">${s.selectAll}</button><button class="btn ghost" id="ps-none">${s.selectNone}</button><span class="muted" id="ps-count"></span></div>
  <div class="status" id="ps-status" hidden></div>
  <div class="thumbs" id="ps-thumbs"></div>
</div>`,
};
