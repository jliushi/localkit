import { html } from '../../build/html.mjs';

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
      short: 'Add text, signatures, checkmarks and images to a PDF, or white-out content.',
      keywords: ['sign pdf', 'fill pdf', 'add text to pdf', 'pdf editor', 'e-signature', 'whiteout pdf', 'pdf signature'],
      title: 'Edit PDF Online — Add Text & Sign PDF Free, No Upload',
      desc: 'Fill in and sign PDFs online: type text, upload or draw your signature, add checkmarks and images, white-out content. Free, no sign-up — the PDF never leaves your browser.',
      h1: 'Edit & sign PDF — add text, signature and more',
      sub: 'A free online PDF editor to fill in forms, sign contracts and add notes directly on the page. Draw, type or upload your signature, tick boxes, and white-out anything you need to hide — works in Chinese and every other language.',
      features: [
        ['signature', 'Sign in seconds', 'Draw your signature with a mouse or finger, type it in a handwriting style, or upload a photo of it. Place and resize it anywhere.'],
        ['type', 'Text in any language', 'Click to type. Change size and colour, drag to move. Chinese, Japanese, emoji — everything renders exactly as you see it.'],
        ['undo-2', 'Undo and fine control', 'Undo with Ctrl+Z, zoom in for precise placement, nudge items with arrow keys, delete with the Delete key.'],
      ],
      howToTitle: 'How to edit and sign a PDF',
      steps: [
        'Drop the PDF on the box. Its pages appear below the toolbar.',
        'Choose a tool — Text, Sign, Check, Image or White-out — and click the page where it should go. Drag to move, pull the corner to resize.',
        'Press Save PDF to download the edited document.',
      ],
      guide: [
        ['Signing a contract', { list: ['Choose Sign, draw your signature (or type it), then click the signature line on the page.', 'Use Text to add the date and your name, and Check to tick boxes.', 'Save, then send the downloaded PDF. Your original file is not changed.'] }],
        ['About white-out', 'White-out paints a white box over the page. It hides content visually, but the original text may still exist underneath in the file. For sensitive information, after saving, convert the PDF with PDF to JPG and back with JPG to PDF so only the pixels remain.'],
      ],
      faq: [
        ['How do I sign a PDF online for free?', 'Drop the PDF, choose Sign, draw or type your signature, click where it should go and press Save PDF. No account or payment is needed.'],
        ['Can I edit the existing text in a PDF?', 'PDFs don\'t store text as editable paragraphs. Cover the old text with White-out and type the new text on top — the result looks the same.'],
        ['Is a drawn signature legally valid?', 'In many countries a simple electronic signature like this is accepted for everyday agreements, but some documents require a certified digital signature. Check what your recipient requires.'],
        ['Does it work in Chinese?', 'Yes. Added text is drawn at high resolution, so any language and emoji appear exactly as typed.'],
        ['Is my PDF uploaded?', 'No. Editing and saving happen entirely in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF to edit or sign', dropHint: 'Stays on your device',
        tSelect: 'Select', tText: 'Text', tSign: 'Sign', tCheck: 'Check', tImage: 'Image', tWhite: 'White-out',
        size: 'Size', color: 'Colour', undo: 'Undo', zoomIn: 'Zoom in', zoomOut: 'Zoom out', save: 'Save PDF', saving: 'Saving…',
        hintText: 'Click on a page to add text.', hintPlace: 'Click on a page to place it.', hintWhite: 'Click on a page to add a white box, then resize it.', hintCheck: 'Click on a page to add a checkmark.', hintSelect: 'Click an item to select it. Drag to move, use the corner to resize.',
        typeHere: 'Type here', sigTitle: 'Your signature', draw: 'Draw', typeTab: 'Type', upload: 'Upload', clear: 'Clear', use: 'Use signature', cancel: 'Cancel',
        typePh: 'Type your name', uploadHint: 'Choose a photo or scan of your signature (a white background works best).',
        empty: 'Nothing added yet — choose a tool and click on a page.', done: 'Saved · $1', download: 'Download again', loading: 'Loading pages…', del: 'Delete',
      },
    },
    zh: {
      name: 'PDF 编辑与签名',
      short: '在 PDF 上添加文字、签名、勾选和图片，或用涂白遮盖内容。',
      keywords: ['pdf 签名', 'pdf 添加文字', 'pdf 编辑器', '电子签名', 'pdf 填写', 'pdf 涂白', '在线签字'],
      title: 'PDF 在线编辑 — 免费签名、添加文字、填表格（不上传）',
      desc: '在线填写并签署 PDF：输入任意语言的文字，手写、输入或上传签名，添加勾选和图片，用涂白遮盖内容。免费、免注册、无水印 —— PDF 不离开浏览器。',
      h1: '编辑并签署 PDF：添加文字、签名等',
      sub: '这是一个免费的在线 PDF 编辑器：在页面上填写表格、签署合同、添加备注，可手写、输入或上传签名，可打勾，可涂白遮盖内容。支持中文，全程在浏览器本地完成，不上传。',
      features: [
        ['signature', '几秒完成签名', '用鼠标或手指手写签名，或输入名字生成手写体，或上传签名照片，放在任意位置并调整大小。'],
        ['type', '任意语言的文字', '点击即可输入，可改字号和颜色，拖动移动。中文、日文、表情符号都按所见原样呈现。'],
        ['undo-2', '可撤销、可精细调整', 'Ctrl+Z 撤销，放大页面精确定位，方向键微调位置，Delete 键删除。'],
      ],
      howToTitle: '如何编辑并签署 PDF',
      steps: [
        '把 PDF 拖到框里，页面会显示在工具栏下方。',
        '选择工具（文字、签名、勾选、图片或涂白），在页面上点击要放置的位置。拖动可移动，拉动角落可调整大小。',
        '点击「保存 PDF」下载编辑好的文档。',
      ],
      guide: [
        ['签署合同', { list: ['选择「签名」，手写（或输入）签名，然后点击页面上的签名处。', '用「文字」添加日期和姓名，用「勾选」在方框里打勾。', '保存后发送下载的 PDF，原文件不会被修改。'] }],
        ['关于涂白', '涂白是在页面上画一个白色方块，视觉上遮住内容，但原文字可能仍然保存在文件中。如果是敏感信息，保存后请用「PDF 转图片」转换，再用「图片转 PDF」合成，这样只保留像素。'],
      ],
      faq: [
        ['怎样免费在线签署 PDF？', '拖入 PDF，选择「签名」，手写或输入签名，点击要放置的位置，然后点「保存 PDF」。无需账号，也不用付费。'],
        ['能修改 PDF 里原有的文字吗？', 'PDF 不以可编辑段落的形式保存文字。可以用「涂白」盖住旧文字，再在上面输入新文字，效果看起来一样。'],
        ['手写签名有法律效力吗？', '在很多国家，这种简单的电子签名可用于日常协议，但有些文件要求使用经过认证的数字签名，请先确认对方的要求。'],
        ['支持中文吗？', '支持。添加的文字以高分辨率绘制，任何语言和表情符号都会原样显示。'],
        ['PDF 会被上传吗？', '不会，编辑和保存都在你的浏览器中完成。'],
      ],
      ui: {
        drop: '拖入要编辑或签名的 PDF', dropHint: '文件不离开你的设备',
        tSelect: '选择', tText: '文字', tSign: '签名', tCheck: '勾选', tImage: '图片', tWhite: '涂白',
        size: '字号', color: '颜色', undo: '撤销', zoomIn: '放大', zoomOut: '缩小', save: '保存 PDF', saving: '正在保存…',
        hintText: '在页面上点击即可添加文字。', hintPlace: '在页面上点击以放置。', hintWhite: '在页面上点击添加白色方块，然后调整大小。', hintCheck: '在页面上点击添加勾选标记。', hintSelect: '点击项目即可选中，拖动移动，拉动角落调整大小。',
        typeHere: '在此输入', sigTitle: '你的签名', draw: '手写', typeTab: '输入', upload: '上传', clear: '清除', use: '使用签名', cancel: '取消',
        typePh: '输入你的名字', uploadHint: '选择签名的照片或扫描件（白色背景效果最好）。',
        empty: '还没有添加任何内容 —— 先选择工具，再点击页面。', done: '已保存 · $1', download: '再次下载', loading: '正在加载页面…', del: '删除',
      },
    },
  },
  ui: (s) => html`
<div id="pe-pick"></div>
<div id="pe-work" hidden>
  <div class="bar-sticky">
    <div class="tool-toggle" role="radiogroup">
      <label><input type="radio" name="pe-tool" value="select">${s.tSelect}</label>
      <label><input type="radio" name="pe-tool" value="text" checked>${s.tText}</label>
      <label><input type="radio" name="pe-tool" value="sign">${s.tSign}</label>
      <label><input type="radio" name="pe-tool" value="check">${s.tCheck}</label>
      <label><input type="radio" name="pe-tool" value="image">${s.tImage}</label>
      <label><input type="radio" name="pe-tool" value="white">${s.tWhite}</label>
    </div>
    <label class="inline-num small">${s.size}<input type="number" id="pe-size" min="6" max="96" value="14" style="width:4.5em"></label>
    <label class="inline-num small">${s.color}<input type="color" id="pe-color" value="#111111"></label>
    <button class="btn ghost sm" id="pe-undo" title="${s.undo} (Ctrl+Z)">${s.undo}</button>
    <button class="btn ghost sm" id="pe-zout" title="${s.zoomOut}" aria-label="${s.zoomOut}">−</button><span class="small muted" id="pe-zoom">100%</span><button class="btn ghost sm" id="pe-zin" title="${s.zoomIn}" aria-label="${s.zoomIn}">+</button>
    <span style="flex:1"></span>
    <button class="btn" id="pe-save">${s.save}</button>
  </div>
  <p class="note" id="pe-hint"></p>
  <div id="pe-alert"></div>
  <div id="pe-task"></div>
  <div id="pe-result"></div>
  <div class="ed-pages" id="pe-pages"></div>
</div>
<input type="file" id="pe-img" accept="image/*" hidden>
<dialog id="pe-sig">
  <h3>${s.sigTitle}</h3>
  <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="draw" aria-selected="true">${s.draw}</button><button type="button" role="tab" data-tab="type" aria-selected="false">${s.typeTab}</button><button type="button" role="tab" data-tab="upload" aria-selected="false">${s.upload}</button></div>
  <div data-pane="draw"><canvas class="sig-pad" id="pe-pad" width="1100" height="400"></canvas></div>
  <div data-pane="type" hidden><input type="text" id="pe-sigtext" placeholder="${s.typePh}" style="font-size:1.2rem"><canvas id="pe-sigprev" width="1100" height="300" class="sig-pad" style="margin-top:10px;height:150px"></canvas></div>
  <div data-pane="upload" hidden><p class="note">${s.uploadHint}</p><input type="file" id="pe-sigfile" accept="image/*"></div>
  <div class="actions" style="margin-top:14px"><button class="btn" id="pe-sig-use">${s.use}</button><button class="btn ghost" id="pe-sig-clear">${s.clear}</button><button class="btn ghost" id="pe-sig-cancel">${s.cancel}</button></div>
</dialog>`,
};
