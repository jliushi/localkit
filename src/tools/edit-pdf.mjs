import { html } from '../../build/html.mjs';

const TOOLS = [
  ['select', 'tSelect'], ['edit', 'tEdit'], ['text', 'tText'], null,
  ['hl', 'tHl'], ['ul', 'tUl'], ['st', 'tSt'], ['pen', 'tPen'], ['note', 'tNote'], null,
  ['rect', 'tRect'], ['ell', 'tEll'], ['line', 'tLine'], ['arrow', 'tArrow'], null,
  ['sign', 'tSign'], ['date', 'tDate'], ['check', 'tCheck'], ['image', 'tImage'], ['white', 'tWhite'],
];

export default {
  id: 'edit-pdf',
  category: 'pdf',
  iconName: 'file-pen-line',
  color: '#2563eb',
  related: ['organize-pdf', 'merge-pdf', 'compress-pdf'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Edit & Sign PDF',
      short: 'Change existing text, add text and images, highlight, draw, fill forms, sign and manage pages.',
      keywords: ['edit pdf', 'pdf editor', 'edit pdf text', 'sign pdf', 'fill pdf form', 'annotate pdf', 'highlight pdf', 'add text to pdf', 'whiteout pdf'],
      title: 'Edit PDF Online Free: Change Text, Fill Forms, Sign',
      desc: 'Free PDF editor: change existing text, add text and images, highlight, draw, fill forms, sign and manage pages. Runs in your browser, nothing is uploaded.',
      h1: 'Edit PDF online: change text, fill forms, annotate and sign',
      sub: 'A free PDF editor that works like a word processor. Click any line of text to rewrite it, add new text boxes, highlight, draw shapes, fill in form fields, sign, and reorder or rotate pages. English and Chinese both work, and your file never leaves your device.',
      features: [
        ['text-cursor-input', 'Edit the text already in the PDF', 'Click a line to rewrite it in place. The new text keeps the size and colour of the original and is saved as real, selectable text. Fonts are substituted, see the notes below.'],
        ['highlighter', 'Annotate, draw and fill forms', 'Highlight, underline and strike through text, draw with a pen, add shapes, arrows and sticky notes, and fill in fillable form fields directly on the page.'],
        ['layout-grid', 'Sign and manage pages', 'Draw, type or upload a signature and keep it for next time. Add, delete, duplicate, rotate and reorder pages from the thumbnail panel.'],
      ],
      howToTitle: 'How to edit a PDF online',
      steps: [
        'Drop the PDF on the box. Its pages appear with a thumbnail panel on the left.',
        'Pick Edit text and click a line to change it, or choose another tool (text, highlight, pen, shapes, signature) and click or drag on the page. Fillable form fields can be typed into right away.',
        'Press Save PDF to download the edited document. Your original file is not changed.',
      ],
      guide: [
        ['How editing existing text works', 'PDFs do not keep paragraphs, only individual lines of positioned letters. When you edit a line, LocalKit covers the original line with the page background colour (and removes the original text from the file when the PDF structure allows it), then writes your text at the same position, size and colour. It is saved as real text: Helvetica, Times or Courier for Latin letters, and an embedded Noto Sans SC subset for Chinese. The original font itself is not available, so the new text uses the closest of these fonts; letter shapes can differ slightly.'],
        ['Limits to know about', { list: ['Only the line you click is changed. Text does not reflow into the next line or paragraph.', 'Scanned PDFs are pictures of text and have nothing to edit. Run them through OCR first, or cover the area and type over it.', 'Rotated, vertical and curved text cannot be edited in place. Use White-out and add new text instead.', 'Edited Chinese text uses a regular-weight Noto Sans SC; bold and italic apply to Latin letters only.', 'If the original text could not be removed from the file structure, it stays hidden under the cover and could still be found by copy and paste. For sensitive content, flatten the result with PDF to JPG and JPG to PDF.'] }],
        ['Signing a contract', { list: ['Choose Sign, draw, type or upload your signature and click the signature line. Saved signatures are reused next time.', 'Use Add text or Date for your name and the date, and Check to tick boxes.', 'Save and send the downloaded PDF.'] }],
      ],
      faq: [
        ['Can I edit the existing text in a PDF?', 'Yes. Choose Edit text and click a line. You can change the words, font family, size, colour, bold and italic. The line is rewritten in place, in a substitute font that is closest to the original, and stays selectable text. It changes one line at a time and does not reflow paragraphs.'],
        ['Does it work with Chinese text?', 'Yes. You can edit existing Chinese lines and type new Chinese text. Chinese is saved as real text with an embedded Noto Sans SC subset, which is downloaded only when your text needs it. Fonts differ from the original, so the glyph shapes may change a little.'],
        ['Why can I not click some text?', 'Scanned pages and images of text contain no text data, so there is nothing to select. Rotated or vertical text is also not supported yet. Use OCR for scans, or White-out and Add text.'],
        ['How do I fill in a PDF form?', 'If the PDF has fillable fields, they appear as input boxes on the page: type in text fields, tick checkboxes and radio buttons, and pick from drop-downs. Tick Flatten form on save if you want the answers to become fixed page content.'],
        ['Is a drawn signature legally valid?', 'In many countries a simple electronic signature like this is accepted for everyday agreements, but some documents require a certified digital signature. Check what your recipient requires.'],
        ['Is my PDF uploaded?', 'No. Editing, fonts and saving all run in your browser, and the file never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a PDF to edit or sign', dropHint: 'Stays on your device',
        tSelect: 'Select', tEdit: 'Edit text', tText: 'Add text', tHl: 'Highlight', tUl: 'Underline', tSt: 'Strikeout', tPen: 'Pen', tNote: 'Note', tRect: 'Rectangle', tEll: 'Ellipse', tLine: 'Line', tArrow: 'Arrow',
        tSign: 'Sign', tDate: 'Date', tCheck: 'Check', tImage: 'Image', tWhite: 'White-out',
        font: 'Font', fSans: 'Sans-serif', fSerif: 'Serif', fMono: 'Monospace', fCjk: 'Chinese / Unicode', size: 'Size', color: 'Colour', width: 'Stroke', bold: 'Bold', italic: 'Italic', alignL: 'Align left', alignC: 'Align centre', alignR: 'Align right',
        undo: 'Undo', redo: 'Redo', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fitWidth: 'Fit width', panel: 'Pages', save: 'Save PDF', saving: 'Saving…', dup: 'Duplicate', delSel: 'Delete selected',
        addPage: 'Add blank page', rotate: 'Rotate page', dupPage: 'Duplicate page', moveUp: 'Move up', moveDown: 'Move down', delPage: 'Delete page', pageCount: 'Pages: $1',
        hintSelect: 'Click an item to select it; Shift-click to select several, drag an empty area to select many. Drag to move, use the corner handle to resize, arrow keys to nudge.',
        hintEdit: 'Click a line of text in the PDF to edit it in place. Fonts are replaced by the closest standard font. Scanned pages cannot be edited.',
        hintText: 'Click on the page to add a text box. Drag its right-hand handle to set the width and wrap lines.',
        hintHl: 'Drag across text to mark it, or click a line to mark the whole line.',
        hintPen: 'Draw freehand on the page.', hintShape: 'Drag on the page to draw.', hintNote: 'Click where the sticky note should go, then type the comment.',
        hintPlace: 'Click on the page to place it.', hintDate: 'Click on the page to stamp today\'s date.', hintCheck: 'Click on a page to add a checkmark.', hintWhite: 'Click on a page to add a white box, then move and resize it.',
        typeHere: 'Type here', notePh: 'Write a comment…', del: 'Delete',
        sigTitle: 'Your signature', draw: 'Draw', typeTab: 'Type', upload: 'Upload', clear: 'Clear', use: 'Use signature', cancel: 'Cancel', savedSigs: 'Saved on this device:', saveSig: 'Remember this signature on this device',
        typePh: 'Type your name', uploadHint: 'Choose a photo or scan of your signature (a white background works best).',
        formFound: 'This PDF has $1 fillable fields. Type directly into the highlighted boxes on the page.', flatten: 'Flatten form on save',
        noText: 'This page has no selectable text, so it is probably a scan. You can still add text, annotations and signatures, or run OCR first.',
        empty: 'Nothing changed yet. Edit text, add something, fill a field or change the pages first.', done: 'Saved · $1', download: 'Download again', loading: 'Loading pages…',
        fontNote: 'Edited text was written in substitute fonts (Helvetica, Times, Courier or Noto Sans SC), so letter shapes can differ slightly from the original.',
      },
    },
    zh: {
      name: 'PDF 编辑与签名',
      short: '修改 PDF 原有文字，添加文字与图片，高亮、手绘、填表、签名，并管理页面。',
      keywords: ['pdf 编辑', 'pdf 编辑器', '修改 pdf 文字', 'pdf 签名', 'pdf 填表', 'pdf 批注', 'pdf 高亮', 'pdf 添加文字', 'pdf 涂白'],
      title: '在线编辑 PDF：修改原文字、填表、签名，免费不上传',
      desc: '免费在线 PDF 编辑器：直接修改 PDF 里的原有文字，添加文字与图片，高亮、批注、手绘，填写表单、手写签名，管理页面。全程在浏览器本地完成，文件不上传。',
      h1: '在线编辑 PDF：改文字、填表、批注、签名',
      sub: '一个用起来像 Word 的免费 PDF 编辑器：点击任意一行文字就能改写，还能添加文本框、高亮、画图形、填写表单、签名，以及调整页面顺序和方向。中英文都支持，文件不会离开你的设备。',
      features: [
        ['text-cursor-input', '直接修改 PDF 里已有的文字', '点击一行文字即可就地改写，新文字沿用原来的字号和颜色，保存为可选中的真实文本。字体会被替换，详见下方说明。'],
        ['highlighter', '批注、手绘、填写表单', '高亮、下划线、删除线，画笔、图形、箭头和便签，还能直接在页面上填写可填写的表单字段。'],
        ['layout-grid', '签名与页面管理', '手写、输入或上传签名，并保存在本机下次直接用。在缩略图面板里添加、删除、复制、旋转和拖动排序页面。'],
      ],
      howToTitle: '如何在线编辑 PDF',
      steps: [
        '把 PDF 拖到框里，页面显示在右侧，左侧是缩略图面板。',
        '选择「编辑原文」并点击一行文字进行修改，或选择其他工具（文字、高亮、画笔、图形、签名）后在页面上点击或拖动。可填写的表单字段可以直接输入。',
        '点击「保存 PDF」下载编辑后的文档，原文件不会被修改。',
      ],
      guide: [
        ['修改原有文字是怎么做到的', 'PDF 里没有「段落」，只有一行行摆放好的文字。编辑某一行时，LocalKit 会用页面背景色盖住原来的这一行（PDF 结构允许时还会把原文字从文件中移除），再在同样的位置按原来的字号和颜色写入新文字。新文字保存为真实文本：英文字母用 Helvetica、Times 或 Courier，中文使用内嵌的思源黑体（Noto Sans SC）子集。原字体本身无法使用，所以新文字会选用最接近的字体，字形可能略有差别。'],
        ['需要了解的限制', { list: ['只会修改你点击的那一行，文字不会自动换行到下一行或重排整个段落。', '扫描版 PDF 本质是文字的图片，没有可编辑的文字。请先做 OCR，或者用涂白盖住再重新输入。', '旋转、竖排、弯曲的文字无法就地编辑，请用「涂白」再添加新文字。', '编辑后的中文使用常规字重的思源黑体，粗体和斜体只对英文字母生效。', '如果原文字无法从文件结构里移除，它只是被盖住，仍可能被复制出来。涉及敏感内容时，请再用「PDF 转图片」和「图片转 PDF」处理成纯图片。'] }],
        ['签署合同', { list: ['选择「签名」，手写、输入或上传签名，然后点击签名处。保存过的签名下次可直接使用。', '用「添加文字」和「日期」写上姓名和日期，用「勾选」在方框里打勾。', '保存后发送下载的 PDF。'] }],
      ],
      faq: [
        ['能修改 PDF 里原有的文字吗？', '可以。选择「编辑原文」并点击一行文字，就能改文字、字体类型、字号、颜色、粗体和斜体。该行会在原位置改写，使用最接近原字体的替代字体，保存后仍是可选中的文本。一次只改一行，不会重排整个段落。'],
        ['支持中文吗？', '支持。可以修改已有的中文，也可以输入新的中文。中文以真实文本保存，使用内嵌的思源黑体子集，只在你的文字需要时才会下载字体。字体与原文不同，字形可能略有变化。'],
        ['为什么有些文字点不了？', '扫描页和文字图片里没有文字数据，所以没有可选中的内容；旋转或竖排的文字目前也不支持。扫描件请先 OCR，或用「涂白」加「添加文字」。'],
        ['怎么填写 PDF 表单？', '如果 PDF 带有可填写字段，它们会以输入框的形式显示在页面上：文本框直接输入，勾选框和单选按钮点击，下拉框选择。若希望答案变成固定的页面内容，保存前勾选「保存时合并表单」。'],
        ['手写签名有法律效力吗？', '在很多国家，这种简单的电子签名可用于日常协议，但有些文件要求使用经过认证的数字签名，请先确认对方的要求。'],
        ['PDF 会被上传吗？', '不会。编辑、字体和保存都在你的浏览器中完成，文件不会离开你的设备。'],
      ],
      ui: {
        drop: '拖入要编辑或签名的 PDF', dropHint: '文件不离开你的设备',
        tSelect: '选择', tEdit: '编辑原文', tText: '添加文字', tHl: '高亮', tUl: '下划线', tSt: '删除线', tPen: '画笔', tNote: '便签', tRect: '矩形', tEll: '椭圆', tLine: '直线', tArrow: '箭头',
        tSign: '签名', tDate: '日期', tCheck: '勾选', tImage: '图片', tWhite: '涂白',
        font: '字体', fSans: '无衬线体', fSerif: '衬线体', fMono: '等宽体', fCjk: '中文 / Unicode', size: '字号', color: '颜色', width: '线宽', bold: '粗体', italic: '斜体', alignL: '左对齐', alignC: '居中', alignR: '右对齐',
        undo: '撤销', redo: '重做', zoomIn: '放大', zoomOut: '缩小', fitWidth: '适合宽度', panel: '页面', save: '保存 PDF', saving: '正在保存…', dup: '复制', delSel: '删除所选',
        addPage: '添加空白页', rotate: '旋转页面', dupPage: '复制页面', moveUp: '上移', moveDown: '下移', delPage: '删除页面', pageCount: '共 $1 页',
        hintSelect: '点击项目即可选中，按住 Shift 点击可多选，在空白处拖动可框选。拖动移动，拉动角上的手柄调整大小，方向键微调位置。',
        hintEdit: '点击 PDF 中的一行文字即可就地编辑。字体会换成最接近的标准字体。扫描页无法编辑。',
        hintText: '在页面上点击添加文本框，拖动右侧手柄可设置宽度并自动换行。',
        hintHl: '在文字上拖动即可标记，单击一行则标记整行。',
        hintPen: '在页面上自由绘制。', hintShape: '在页面上拖动来绘制。', hintNote: '点击要放置便签的位置，然后输入批注内容。',
        hintPlace: '在页面上点击以放置。', hintDate: '在页面上点击即可盖上今天的日期。', hintCheck: '在页面上点击添加勾选标记。', hintWhite: '在页面上点击添加白色方块，然后移动并调整大小。',
        typeHere: '在此输入', notePh: '写下批注…', del: '删除',
        sigTitle: '你的签名', draw: '手写', typeTab: '输入', upload: '上传', clear: '清除', use: '使用签名', cancel: '取消', savedSigs: '已保存在本机：', saveSig: '把这个签名记住在本机',
        typePh: '输入你的名字', uploadHint: '选择签名的照片或扫描件（白色背景效果最好）。',
        formFound: '这个 PDF 有 $1 个可填写字段，直接在页面上高亮的框里输入即可。', flatten: '保存时合并表单',
        noText: '这一页没有可选中的文字，很可能是扫描件。你仍然可以添加文字、批注和签名，也可以先做 OCR。',
        empty: '还没有任何改动。请先编辑文字、添加内容、填写字段或调整页面。', done: '已保存 · $1', download: '再次下载', loading: '正在加载页面…',
        fontNote: '被编辑的文字使用了替代字体（Helvetica、Times、Courier 或思源黑体），字形可能与原文略有差别。',
      },
    },
  },
  ui: (s) => html`
<div id="pe-pick"></div>
<div id="pe-work" hidden>
  <div class="pe-top">
    <div class="pe-tools" id="pe-tools" role="toolbar" aria-label="${s.tSelect}">
      ${TOOLS.map((x) => (x ? html`<button type="button" class="pt" data-tool="${x[0]}" aria-pressed="false" title="${s[x[1]]}"><span data-ic="${x[0]}"></span><span class="lb">${s[x[1]]}</span></button>` : html`<span class="sep"></span>`))}
    </div>
    <div class="pe-props">
      <span class="grp" id="pe-g-text"><select id="pe-font" aria-label="${s.font}"><option value="sans">${s.fSans}</option><option value="serif">${s.fSerif}</option><option value="mono">${s.fMono}</option><option value="cjk">${s.fCjk}</option></select>
        <button type="button" class="ib" id="pe-bold" aria-pressed="false" title="${s.bold}" aria-label="${s.bold}"><span data-ic="bold"></span></button><button type="button" class="ib" id="pe-italic" aria-pressed="false" title="${s.italic}" aria-label="${s.italic}"><span data-ic="italic"></span></button>
        <button type="button" class="ib" data-align="left" aria-pressed="true" title="${s.alignL}" aria-label="${s.alignL}"><span data-ic="al"></span></button><button type="button" class="ib" data-align="center" aria-pressed="false" title="${s.alignC}" aria-label="${s.alignC}"><span data-ic="ac"></span></button><button type="button" class="ib" data-align="right" aria-pressed="false" title="${s.alignR}" aria-label="${s.alignR}"><span data-ic="ar"></span></button></span>
      <label class="grp small" id="pe-g-size">${s.size}<input type="number" id="pe-size" min="4" max="200" step="0.5" value="14"></label>
      <label class="grp small" id="pe-g-width" hidden>${s.width}<input type="number" id="pe-width" min="0.5" max="40" step="0.5" value="2"></label>
      <label class="grp small" id="pe-g-color">${s.color}<input type="color" id="pe-color" value="#111111"></label>
      <span class="grp"><button type="button" class="ib" id="pe-dup" title="${s.dup}" aria-label="${s.dup}" disabled><span data-ic="copy"></span></button><button type="button" class="ib" id="pe-del" title="${s.delSel}" aria-label="${s.delSel}" disabled><span data-ic="trash"></span></button></span>
      <span class="grp"><button type="button" class="ib" id="pe-undo" title="${s.undo} (Ctrl+Z)" aria-label="${s.undo}" disabled><span data-ic="undo"></span></button><button type="button" class="ib" id="pe-redo" title="${s.redo} (Ctrl+Y)" aria-label="${s.redo}" disabled><span data-ic="redo"></span></button></span>
      <span class="grp"><button type="button" class="ib" id="pe-zout" title="${s.zoomOut}" aria-label="${s.zoomOut}"><span data-ic="zout"></span></button><span class="small muted zlabel" id="pe-zoom">100%</span><button type="button" class="ib" id="pe-zin" title="${s.zoomIn}" aria-label="${s.zoomIn}"><span data-ic="zin"></span></button><button type="button" class="ib" id="pe-fit" title="${s.fitWidth}" aria-label="${s.fitWidth}"><span data-ic="fit"></span></button></span>
      <button type="button" class="ib pe-panelbtn" id="pe-panel" title="${s.panel}" aria-label="${s.panel}"><span data-ic="panel"></span></button>
      <span class="grow"></span>
      <button class="btn" id="pe-save">${s.save}</button>
    </div>
  </div>
  <p class="note" id="pe-hint"></p>
  <div class="pe-formbar" id="pe-formbar" hidden><span id="pe-formmsg"></span><label class="small"><input type="checkbox" id="pe-flatten"> ${s.flatten}</label></div>
  <div id="pe-alert"></div>
  <div id="pe-task"></div>
  <div id="pe-result"></div>
  <div class="pe-body">
    <aside class="pe-side" id="pe-side">
      <div class="pe-thumbs" id="pe-thumbs"></div>
      <button type="button" class="btn ghost sm" id="pe-addpage"><span data-ic="addpage"></span> ${s.addPage}</button>
      <div class="small muted" id="pe-pagecount"></div>
    </aside>
    <main class="pe-main" id="pe-main"><div class="ed-pages" id="pe-pages"></div></main>
  </div>
</div>
<input type="file" id="pe-img" accept="image/*" hidden>
<dialog id="pe-sig">
  <h3>${s.sigTitle}</h3>
  <div class="pe-saved" id="pe-saved" hidden></div>
  <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="draw" aria-selected="true">${s.draw}</button><button type="button" role="tab" data-tab="type" aria-selected="false">${s.typeTab}</button><button type="button" role="tab" data-tab="upload" aria-selected="false">${s.upload}</button></div>
  <div data-pane="draw"><canvas class="sig-pad" id="pe-pad" width="1100" height="400"></canvas></div>
  <div data-pane="type" hidden><input type="text" id="pe-sigtext" placeholder="${s.typePh}" style="font-size:1.2rem"><canvas id="pe-sigprev" width="1100" height="300" class="sig-pad" style="margin-top:10px;height:150px"></canvas></div>
  <div data-pane="upload" hidden><p class="note">${s.uploadHint}</p><input type="file" id="pe-sigfile" accept="image/*"></div>
  <label class="small" style="display:block;margin-top:10px"><input type="checkbox" id="pe-sig-save" checked> ${s.saveSig}</label>
  <div class="actions" style="margin-top:14px"><button class="btn" id="pe-sig-use">${s.use}</button><button class="btn ghost" id="pe-sig-clear">${s.clear}</button><button class="btn ghost" id="pe-sig-cancel">${s.cancel}</button></div>
</dialog>`,
};
