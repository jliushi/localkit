import { html } from '../../build/html.mjs';

export default {
  id: 'split-pdf',
  category: 'pdf',
  iconName: 'scissors-line-dashed',
  color: '#ea580c',
  related: ['merge-pdf', 'organize-pdf', 'pdf-to-jpg'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Split PDF',
      short: 'Extract pages or split a PDF into several files.',
      keywords: ['extract pages', 'separate pdf', 'pdf splitter', 'split pdf pages', 'pdf page range'],
      title: 'Split PDF Online Free — Extract Pages or Split by Range (No Upload)',
      desc: 'Split a PDF visually: click the pages to extract, split every page into its own file, cut every N pages, or type ranges like 1-3, 8-10. Free, private, runs in your browser.',
      h1: 'Split a PDF or extract pages',
      sub: 'See every page as a thumbnail. Click the pages you need to pull them into a new PDF, or split the document into single pages, fixed-size chunks or custom ranges.',
      features: [
        ['mouse-pointer-click', 'Click to pick pages', 'Select pages straight from thumbnails, or use All / Odd / Even. Shift-click selects a range.'],
        ['split', 'Four ways to split', 'Extract selected pages, split every page, split every N pages, or type ranges such as "1-3, 5, 9-".'],
        ['shield-check', 'Private and lossless', 'Pages are copied without re-compression, inside your browser. Nothing is uploaded.'],
      ],
      howToTitle: 'How to split a PDF',
      steps: [
        'Drop a PDF on the box. Thumbnails of every page appear.',
        'Choose how to split: select pages, every page, every N pages, or custom ranges.',
        'Press Split PDF. One result downloads as a PDF; several are bundled in a ZIP.',
      ],
      guide: [
        ['Writing page ranges', { table: [['You type', 'You get'], ['1-3', 'One file with pages 1, 2 and 3'], ['1-3, 5', 'Two files: pages 1–3 and page 5'], ['8-', 'One file from page 8 to the end'], ['-4, 5-', 'Two halves: pages 1–4 and 5 to the end']] }],
      ],
      faq: [
        ['How do I extract one page from a PDF?', 'Drop the PDF, click the page you want (it turns green) and press Split PDF. You get a one-page PDF.'],
        ['Can I split a PDF into single pages?', 'Yes. Choose "Every page" and press Split PDF — you get a ZIP with one PDF per page.'],
        ['Does splitting change the quality?', 'No. Pages are copied exactly as they are.'],
        ['Can I split a large PDF?', 'Yes, PDFs with hundreds of pages work; thumbnails load as you scroll.'],
        ['Is my PDF uploaded?', 'No. Splitting happens entirely in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF to split', dropHint: 'Stays on your device', mode: 'How to split',
        mSel: 'Extract selected pages', mEach: 'Every page', mEvery: 'Every N pages', mRanges: 'Custom ranges', everyN: 'Pages per file', ranges: 'Ranges', rangesPh: 'e.g. 1-3, 5, 9-',
        all: 'All', none: 'None', odd: 'Odd', even: 'Even', selected: '$1 of $2 pages selected', hint: 'Click pages to select them (Shift-click for a range).',
        split: 'Split PDF', splitting: 'Splitting…', noneSelected: 'Select at least one page first.', badRange: 'Check the ranges: "$1" isn\'t valid for a $2-page PDF.',
        done: 'Created $1 file(s).', download: 'Download again', page: 'Page $1', loading: 'Loading pages…', another: 'Split another PDF', willMake: 'Will create $1 file(s).', pagesN: '$1 pages',
      },
    },
    zh: {
      name: 'PDF 拆分',
      short: '提取部分页面，或把 PDF 拆分成多个文件。',
      keywords: ['提取 pdf 页面', 'pdf 分割', '拆分 pdf', 'pdf 按页拆分', 'pdf 页码范围'],
      title: 'PDF 拆分 — 在线免费提取页面或按范围拆分（不上传）',
      desc: '可视化拆分 PDF：点选要提取的页面，或每页拆成一个文件、每 N 页拆一份、按「1-3, 8-10」这样的范围拆分。免费、私密，在浏览器中完成。',
      h1: '拆分 PDF / 提取页面',
      sub: '每一页都以缩略图显示。点选需要的页面生成新 PDF，或者把文档拆成单页、固定页数的分段或自定义范围。',
      features: [
        ['mouse-pointer-click', '点选页面', '直接在缩略图上选择页面，也可以一键全选、选奇数页或偶数页；按住 Shift 点击可选择连续范围。'],
        ['split', '四种拆分方式', '提取选中页面、每页拆分、每 N 页拆分，或输入「1-3, 5, 9-」这样的自定义范围。'],
        ['shield-check', '私密且无损', '页面原样复制、不重新压缩，全部在浏览器中完成，不上传任何内容。'],
      ],
      howToTitle: '如何拆分 PDF',
      steps: [
        '把 PDF 拖到框里，会显示每一页的缩略图。',
        '选择拆分方式：选择页面、每页拆分、每 N 页拆分或自定义范围。',
        '点击「拆分 PDF」。只有一个结果时直接下载 PDF，多个结果会打包成 ZIP。',
      ],
      guide: [
        ['页码范围的写法', { table: [['输入', '得到'], ['1-3', '一个文件，包含第 1、2、3 页'], ['1-3, 5', '两个文件：第 1–3 页和第 5 页'], ['8-', '一个文件：从第 8 页到最后'], ['-4, 5-', '拆成两半：第 1–4 页和第 5 页到最后']] }],
      ],
      faq: [
        ['怎么从 PDF 中提取一页？', '拖入 PDF，点击需要的那一页（变成绿色），再点击「拆分 PDF」，就会得到只有一页的 PDF。'],
        ['可以把 PDF 拆成单页吗？', '可以。选择「每一页」并点击「拆分 PDF」，会得到一个 ZIP，每页一个 PDF。'],
        ['拆分会改变质量吗？', '不会，页面原样复制。'],
        ['能拆分很大的 PDF 吗？', '可以，几百页的 PDF 也没问题。'],
        ['PDF 会被上传吗？', '不会，拆分完全在你的浏览器中进行。'],
      ],
      ui: {
        drop: '拖入要拆分的 PDF', dropHint: '文件不离开你的设备', mode: '拆分方式',
        mSel: '提取选中的页面', mEach: '每一页', mEvery: '每 N 页', mRanges: '自定义范围', everyN: '每份页数', ranges: '范围', rangesPh: '例如 1-3, 5, 9-',
        all: '全选', none: '全不选', odd: '奇数页', even: '偶数页', selected: '已选 $1 / $2 页', hint: '点击页面进行选择（按住 Shift 点击可选择连续范围）。',
        split: '拆分 PDF', splitting: '正在拆分…', noneSelected: '请先选择至少一页。', badRange: '请检查范围：「$1」对于 $2 页的 PDF 无效。',
        done: '已生成 $1 个文件。', download: '再次下载', page: '第 $1 页', loading: '正在加载页面…', another: '拆分另一个 PDF', willMake: '将生成 $1 个文件。', pagesN: '共 $1 页',
      },
    },
  },
  ui: (s) => html`
<div id="ps-pick"></div>
<div id="ps-work" class="panel" hidden>
  <div id="ps-file"></div>
  <div class="opt"><span class="field-label">${s.mode}</span><div class="chips" role="radiogroup" aria-label="${s.mode}">
    <label class="chip"><input type="radio" name="ps-mode" value="sel" checked><span>${s.mSel}</span></label>
    <label class="chip"><input type="radio" name="ps-mode" value="each"><span>${s.mEach}</span></label>
    <label class="chip"><input type="radio" name="ps-mode" value="every"><span>${s.mEvery}</span></label>
    <label class="chip"><input type="radio" name="ps-mode" value="ranges"><span>${s.mRanges}</span></label>
  </div></div>
  <label class="inline-num" id="ps-every-wrap" hidden><span class="field-label">${s.everyN}</span><input type="number" id="ps-every" min="1" value="2"></label>
  <label class="field" id="ps-ranges-wrap" hidden><span>${s.ranges}</span><input type="text" id="ps-ranges" placeholder="${s.rangesPh}"></label>
  <div class="actions"><button class="btn lg" id="ps-go">${s.split}</button><span class="muted" id="ps-info"></span></div>
  <div id="ps-alert"></div>
  <div id="ps-task"></div>
  <div id="ps-result"></div>
  <div class="bar-sticky" id="ps-selbar"><span class="muted small">${s.hint}</span><span style="flex:1"></span>
    <button class="btn ghost sm" data-sel="all">${s.all}</button><button class="btn ghost sm" data-sel="odd">${s.odd}</button><button class="btn ghost sm" data-sel="even">${s.even}</button><button class="btn ghost sm" data-sel="none">${s.none}</button></div>
  <div class="pages" id="ps-pages"></div>
</div>`,
};
