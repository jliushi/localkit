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
      short: 'Combine PDFs and images into one file. Choose, reorder and rotate individual pages.',
      keywords: ['combine pdf', 'join pdf', 'pdf merger', 'merge pdf files', 'merge pdf pages', 'combine pdf and images', 'interleave pdf', 'merge pdf online'],
      title: 'Merge PDF Online Free — Combine PDFs & Pick Pages, No Upload',
      desc: 'Merge PDFs and images page by page: pick page ranges, drag pages across files, interleave duplex scans, add bookmarks and page numbers. Free, private, no watermark.',
      h1: 'Merge PDF files — and decide exactly which pages go where',
      sub: 'Add PDFs and photos, then build the document page by page: take only pages 1–3 of one file and page 5 of another, drag any page anywhere, rotate or delete pages, insert blank pages, interleave odd and even scans. Everything runs in your browser — nothing is uploaded.',
      features: [
        ['layout-grid', 'A page-level composer', 'Switch from the file list to a grid of every page. Drag pages between files, select several at once, rotate, delete or insert blanks and images anywhere.'],
        ['shuffle', 'Smart merge modes', 'Append, alternate pages from several files, or interleave the front and back scans of a duplex document, with the back stack reversed if needed.'],
        ['lock', 'Private by design', 'Merging happens on your device, so contracts and scans never touch a server. No sign-up, no watermark, no page limit.'],
      ],
      howToTitle: 'How to merge PDF files',
      steps: [
        'Drop PDFs (and photos if you like) on the box. Reorder the files, or type a page range such as 1-3, 5 for any file.',
        'Open the Pages view to drag pages into place, rotate or delete them, or insert a blank page or another file at any position.',
        'Choose the output options (bookmarks, page size, page numbers), press Merge PDF and download.',
      ],
      guide: [
        ['Page ranges and modes', { list: ['A range field accepts numbers and ranges (1-3, 5, 8-), plus the words odd, even and reverse. Leave it empty to use every page.', 'Interleave takes one file as the odd pages and another as the even pages. Tick "reverse the second file" when the back sides were scanned from the last page to the first.', 'Alternate takes a set number of pages from each file in turn.', 'Arranging pages again replaces any manual page order, so use it first and fine-tune in the Pages view afterwards. Undo brings the old order back.'] }],
        ['Good to know', { list: ['Bookmarks from the original files are not copied. Instead you can add one bookmark per source file, named after the file.', 'If you normalise the page size, pages are placed as drawings on A4 or Letter pages; links and form fields on those pages are not kept. With "Keep original sizes" pages are copied unchanged.', 'Password-protected PDFs must be unlocked first (open with the password and save an unprotected copy). A file that cannot be read is flagged and the others still merge.', 'On touch screens use the arrow buttons on each page instead of dragging.'] }],
      ],
      faq: [
        ['How do I combine PDF files into one?', 'Drop the PDFs here, put them in order and press Merge PDF. The merged file downloads immediately.'],
        ['Can I merge only certain pages of a PDF?', 'Yes. Type a range such as 1-3, 5 next to the file, or open the Pages view and delete the pages you do not want.'],
        ['Can I mix photos and PDFs?', 'Yes. JPG, PNG, WebP and HEIC images become pages — fitted to A4 or Letter, or kept at the image size.'],
        ['How do I merge two scans of a double-sided document?', 'Choose Interleave, select the file with the front sides as the first file and the back sides as the second, and tick reverse if the backs were scanned in reverse order.'],
        ['Does merging reduce quality?', 'No. With "Keep original sizes" pages are copied exactly; nothing is re-compressed or rasterised.'],
        ['Are my PDFs uploaded?', 'No. The PDFs are read and combined inside your browser, and you can verify that with the network tab.'],
      ],
      ui: {
        drop: 'Drop PDF files or images here', dropHint: 'PDF, JPG, PNG, WebP, HEIC · stays on your device', add: 'Add PDFs or images', merge: 'Merge PDF', merging: 'Merging…',
        pages: '$1 pages', page1: '1 page', image: 'Image', reading: 'Reading…', imgMeta: 'image',
        tabFiles: 'Files', tabPages: 'Pages', up: 'Move up', down: 'Move down',
        rangeLabel: 'Pages', rangePh: 'All · e.g. 1-3, 5, odd', rangeBad: '"$1" is not a valid range for this file.', usedOf: '$1 of $2 pages used',
        modeTitle: 'Arrange the pages', mAppend: 'Append', mAlt: 'Alternate', mInter: 'Interleave', arrange: 'Arrange pages',
        mAppendHint: 'Put the files one after another, using each file\'s page range.',
        altEvery: 'Pages per turn', altHint: 'Take that many pages from each file in turn, until all files run out.',
        interA: 'Odd pages (front sides)', interB: 'Even pages (back sides)', interRev: 'Reverse the second file (backs scanned last page first)',
        interHint: 'Result: A1, B1, A2, B2, … Other files are added at the end.', needInter: 'Interleave needs at least two readable files.',
        arranged: 'Pages arranged. Use Undo in the Pages view to go back.',
        selAll: 'Select all', selNone: 'Clear selection', rotSel: 'Rotate selected', delSel: 'Delete selected', undo: 'Undo',
        insBlank: 'Insert blank page', insFile: 'Insert files or images', insAfter: 'New pages go after page $1', insEnd: 'New pages go at the end',
        left: 'Move earlier', right: 'Move later', rotR: 'Rotate right', del: 'Delete page', blankAfter: 'Insert a blank page after this one',
        blank: 'Blank page', pageLabel: 'Page $1', empty: 'No pages yet. Add a file or insert a blank page.',
        summary: '$1 pages in the output', order: 'Order', outTitle: 'Output', outName: 'File name', bm: 'Add a bookmark for each source file', numbers: 'Add page numbers',
        size: 'Page size', sKeep: 'Keep original sizes', sA4: 'A4', sLetter: 'Letter',
        imgSize: 'Image pages', iA4: 'A4', iLetter: 'Letter', iFit: 'Image size',
        nPos: 'Position', nL: 'Left', nC: 'Centre', nR: 'Right', nFmt: 'Format', nPlain: '1', nOf: '1 / 12',
        needPages: 'Add at least one PDF or image.', cancelled: 'Cancelled.',
        done: 'Merged $1 files into one PDF · $2 pages · $3', download: 'Download PDF', preview: 'Preview of the merged document', editMore: 'Keep editing',
        defName: 'merged', fileErr: '$1: $2',
      },
    },
    zh: {
      name: 'PDF 合并',
      short: '把多个 PDF 和图片合并成一个文件，可逐页挑选、排序、旋转。',
      keywords: ['合并 pdf', 'pdf合并', 'pdf 拼接', 'pdf 页面合并', '图片和 pdf 合并', 'pdf 奇偶页合并', '在线合并 pdf', 'pdf 合并工具'],
      title: 'PDF 合并 — 免费在线合并 PDF、逐页挑选（不上传）',
      desc: '逐页合并 PDF 和图片：选择页码范围、跨文件拖动页面、合并双面扫描的奇偶页，还能加书签和页码。免费、无水印，文件不离开你的设备。',
      h1: '合并 PDF —— 每一页放在哪里，由你决定',
      sub: '添加 PDF 和照片，再逐页编排文档：只取 A 文件的第 1–3 页和 B 文件的第 5 页，随意拖动页面，旋转、删除、插入空白页，合并奇偶页扫描件。全部在浏览器里完成，不上传任何文件。',
      features: [
        ['layout-grid', '逐页编排', '从文件列表切换到所有页面的缩略图网格。页面可以跨文件拖动，可多选，也能在任意位置旋转、删除、插入空白页或图片。'],
        ['shuffle', '智能合并方式', '依次追加、多个文件轮流取页，或把双面扫描的正面和背面交错合并，背面顺序反了也能一键倒置。'],
        ['lock', '天生保护隐私', '合并在你的设备上完成，合同和扫描件不会经过服务器。无需注册、无水印、不限页数。'],
      ],
      howToTitle: '如何合并 PDF 文件',
      steps: [
        '把 PDF（也可以加照片）拖到框里。调整文件顺序，或为任一文件输入页码范围，例如 1-3, 5。',
        '打开「页面」视图，拖动页面到合适位置，旋转或删除页面，也可以在任意位置插入空白页或另一个文件。',
        '设置输出选项（书签、页面大小、页码），点击「合并 PDF」并下载。',
      ],
      guide: [
        ['页码范围与合并方式', { list: ['页码框支持数字和范围（1-3, 5, 8-），也可以写 odd（奇数页）、even（偶数页）、reverse（倒序），中文的「奇数」「偶数」「倒序」同样有效。留空表示全部页面。', '「奇偶交错」把一个文件当作奇数页、另一个当作偶数页。如果背面是从最后一页往前扫描的，请勾选「倒置第二个文件」。', '「轮流取页」会按设定的页数依次从每个文件中取页。', '重新排列页面会覆盖手动调整的顺序，所以请先排列，再到「页面」视图微调；撤销可以恢复原来的顺序。'] }],
        ['需要了解的', { list: ['原文件的书签不会复制，但可以为每个源文件添加一条以文件名命名的书签。', '统一页面大小时，页面会作为图形放到 A4 或 Letter 页面上，这些页面里的链接和表单域不会保留；选择「保持原始大小」则页面原样复制。', '有密码的 PDF 需要先解锁（用密码打开后另存为无密码的副本）。无法读取的文件会被标出，其余文件仍可正常合并。', '触屏设备上无法拖动时，请使用每个页面下方的箭头按钮。'] }],
      ],
      faq: [
        ['怎么把多个 PDF 合并成一个？', '把 PDF 拖进来，调整好顺序，点击「合并 PDF」，合并后的文件会立即下载。'],
        ['可以只合并 PDF 的部分页面吗？', '可以。在文件旁边输入页码范围，例如 1-3, 5；或打开「页面」视图，删除不需要的页面。'],
        ['可以把照片和 PDF 一起合并吗？', '可以。JPG、PNG、WebP、HEIC 图片会变成 PDF 页面，可适应 A4 或 Letter 页面，也可保持图片原尺寸。'],
        ['双面文档的两份扫描件怎么合并？', '选择「奇偶交错」，第一个文件选正面扫描，第二个文件选背面扫描；如果背面是倒着扫的，勾选「倒置第二个文件」。'],
        ['合并会降低质量吗？', '不会。选择「保持原始大小」时页面原样复制，不会重新压缩，也不会转成图片。'],
        ['PDF 会被上传吗？', '不会。PDF 在你的浏览器中读取并合并，你可以在浏览器的网络面板中自行验证。'],
      ],
      ui: {
        drop: '把 PDF 或图片拖到这里', dropHint: 'PDF、JPG、PNG、WebP、HEIC · 文件不离开你的设备', add: '添加 PDF 或图片', merge: '合并 PDF', merging: '正在合并…',
        pages: '$1 页', page1: '1 页', image: '图片', reading: '正在读取…', imgMeta: '图片',
        tabFiles: '文件', tabPages: '页面', up: '上移', down: '下移',
        rangeLabel: '页码', rangePh: '全部 · 例如 1-3, 5, 奇数', rangeBad: '「$1」不是这个文件的有效页码范围。', usedOf: '已选用 $1 / $2 页',
        modeTitle: '排列页面', mAppend: '依次追加', mAlt: '轮流取页', mInter: '奇偶交错', arrange: '重新排列页面',
        mAppendHint: '按文件顺序一个接一个，使用每个文件设定的页码范围。',
        altEvery: '每轮取页数', altHint: '每次从每个文件取这么多页，轮流进行，直到所有文件取完。',
        interA: '奇数页（正面）', interB: '偶数页（背面）', interRev: '倒置第二个文件（背面从最后一页开始扫描）',
        interHint: '结果：A1、B1、A2、B2……其余文件接在最后。', needInter: '奇偶交错至少需要两个可读取的文件。',
        arranged: '页面已重新排列。可在「页面」视图中撤销。',
        selAll: '全选', selNone: '取消选择', rotSel: '旋转所选', delSel: '删除所选', undo: '撤销',
        insBlank: '插入空白页', insFile: '插入文件或图片', insAfter: '新页面将插入到第 $1 页之后', insEnd: '新页面将添加到末尾',
        left: '前移', right: '后移', rotR: '向右旋转', del: '删除此页', blankAfter: '在此页之后插入空白页',
        blank: '空白页', pageLabel: '第 $1 页', empty: '还没有页面。请添加文件或插入空白页。',
        summary: '输出共 $1 页', order: '顺序', outTitle: '输出设置', outName: '文件名', bm: '为每个源文件添加书签', numbers: '添加页码',
        size: '页面大小', sKeep: '保持原始大小', sA4: 'A4', sLetter: 'Letter',
        imgSize: '图片页面', iA4: 'A4', iLetter: 'Letter', iFit: '图片原尺寸',
        nPos: '位置', nL: '左', nC: '居中', nR: '右', nFmt: '格式', nPlain: '1', nOf: '1 / 12',
        needPages: '请至少添加一个 PDF 或图片。', cancelled: '已取消。',
        done: '已把 $1 个文件合并为一个 PDF · $2 页 · $3', download: '下载 PDF', preview: '合并后文档预览', editMore: '继续编辑',
        defName: '合并', fileErr: '$1：$2',
      },
    },
  },
  ui: (s) => html`
<div id="pm-pick"></div>
<div id="pm-work" class="panel" hidden>
  <div class="tabs" role="tablist">
    <button type="button" role="tab" id="pm-tab-files" aria-selected="true">${s.tabFiles}</button>
    <button type="button" role="tab" id="pm-tab-pages" aria-selected="false">${s.tabPages}</button>
  </div>
  <div id="pm-alert"></div>

  <div id="pm-v-files">
    <ul class="flist pm-flist" id="pm-list"></ul>
    <div id="pm-more"></div>
    <div class="pm-box">
      <span class="field-label">${s.modeTitle}</span>
      <div class="chips" id="pm-modes">
        <label class="chip"><input type="radio" name="pm-mode" value="append" checked><span>${s.mAppend}</span></label>
        <label class="chip"><input type="radio" name="pm-mode" value="alt"><span>${s.mAlt}</span></label>
        <label class="chip"><input type="radio" name="pm-mode" value="inter"><span>${s.mInter}</span></label>
      </div>
      <p class="note" id="pm-mode-hint">${s.mAppendHint}</p>
      <div class="pm-mopts" id="pm-mo-alt" hidden><label class="field"><span>${s.altEvery}</span><input type="number" id="pm-every" min="1" max="99" value="1"></label></div>
      <div class="pm-mopts" id="pm-mo-inter" hidden>
        <label class="field"><span>${s.interA}</span><select id="pm-ia"></select></label>
        <label class="field"><span>${s.interB}</span><select id="pm-ib"></select></label>
        <label class="check"><input type="checkbox" id="pm-irev"> ${s.interRev}</label>
      </div>
      <div><button type="button" class="btn ghost sm" id="pm-arrange">${s.arrange}</button></div>
    </div>
  </div>

  <div id="pm-v-pages" hidden>
    <div class="pm-tools">
      <button type="button" class="btn ghost sm" id="pm-selall">${s.selAll}</button>
      <button type="button" class="btn ghost sm" id="pm-selnone">${s.selNone}</button>
      <button type="button" class="btn ghost sm" id="pm-rotsel">${s.rotSel}</button>
      <button type="button" class="btn ghost sm" id="pm-delsel">${s.delSel}</button>
      <button type="button" class="btn ghost sm" id="pm-undo">${s.undo}</button>
    </div>
    <div class="pm-tools">
      <button type="button" class="btn soft sm" id="pm-blank">${s.insBlank}</button>
      <span id="pm-insfile"></span>
      <span class="muted small" id="pm-insat"></span>
    </div>
    <div class="pages pm-pages" id="pm-pages"></div>
  </div>

  <div class="pm-box">
    <span class="field-label">${s.outTitle}</span>
    <div class="opts">
      <label class="field"><span>${s.outName}</span><input type="text" id="pm-name" value="${s.defName}" maxlength="80" autocomplete="off"></label>
      <div class="opt"><span class="field-label">${s.size}</span><div class="chips"><label class="chip"><input type="radio" name="pm-size" value="keep" checked><span>${s.sKeep}</span></label><label class="chip"><input type="radio" name="pm-size" value="a4"><span>${s.sA4}</span></label><label class="chip"><input type="radio" name="pm-size" value="letter"><span>${s.sLetter}</span></label></div></div>
      <div class="opt"><span class="field-label">${s.imgSize}</span><div class="chips"><label class="chip"><input type="radio" name="pm-img" value="a4" checked><span>${s.iA4}</span></label><label class="chip"><input type="radio" name="pm-img" value="letter"><span>${s.iLetter}</span></label><label class="chip"><input type="radio" name="pm-img" value="fit"><span>${s.iFit}</span></label></div></div>
      <div class="opt"><label class="check"><input type="checkbox" id="pm-bm"> ${s.bm}</label><label class="check"><input type="checkbox" id="pm-num"> ${s.numbers}</label></div>
      <div class="opt" id="pm-numopts" hidden>
        <div class="chips"><label class="chip"><input type="radio" name="pm-npos" value="left"><span>${s.nL}</span></label><label class="chip"><input type="radio" name="pm-npos" value="center" checked><span>${s.nC}</span></label><label class="chip"><input type="radio" name="pm-npos" value="right"><span>${s.nR}</span></label></div>
        <div class="chips"><label class="chip"><input type="radio" name="pm-nfmt" value="plain" checked><span>${s.nPlain}</span></label><label class="chip"><input type="radio" name="pm-nfmt" value="of"><span>${s.nOf}</span></label></div>
      </div>
    </div>
  </div>

  <div class="actions"><button class="btn lg" id="pm-go">${s.merge}</button><span class="muted" id="pm-total"></span></div>
  <div class="pm-order small muted" id="pm-order"></div>
  <div id="pm-task"></div>
  <div id="pm-result"></div>
</div>`,
};
