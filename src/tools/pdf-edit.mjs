import { html } from '../../build/html.mjs';

export default {
  id: 'pdf-edit',
  category: 'pdf',
  icon: '✎',
  color: '#2563eb',
  strings: {
    en: {
      name: 'PDF Editor — Add Text & Signature',
      title: 'Edit PDF Online Free — Add Text, Signature, Images & White-out',
      desc: 'Fill in and sign PDF forms: add text in any language, draw or upload a signature, insert images and cover content with white-out. Free, no upload, no watermark.',
      h1: 'Edit a PDF: add text, signature, images and white-out',
      lead: 'Fill in forms, sign contracts, add notes or hide information — directly on the page. Chinese, Japanese and every other language work. The PDF never leaves your browser.',
      steps: [
        'Drop a PDF on the box. The pages appear below.',
        'Pick a tool — Text, Signature, Image or White-out — and click on the page where it should go. Drag items to move them; drag the corner to resize.',
        'Click Save PDF to download the edited document.',
      ],
      faq: [
        ['How do I sign a PDF?', 'Click Signature, draw your signature with the mouse or your finger (or upload a photo of it), then click on the page where it belongs. Drag the corner to resize it.'],
        ['Can I edit existing text?', 'Not directly — PDFs don\'t store text in editable paragraphs. Cover the old text with White-out and type the new text on top.'],
        ['Will the added text work in Chinese?', 'Yes. Added text is drawn in high resolution, so any language and emoji work, without needing special fonts in the PDF.'],
        ['Does White-out really remove the content?', 'It covers the content visually. The original text can still exist underneath in the file, so for truly sensitive data, convert the result with "PDF to images" and back with "Images to PDF".'],
        ['Is my PDF uploaded?', 'No. Editing and saving happen in your browser.'],
      ],
      ui: {
        drop: 'Drop a PDF here or click to choose', text: 'T  Text', signature: '✍ Signature', image: '🖼 Image', whiteout: '▭ White-out', select: '↖ Select',
        size: 'Size', color: 'Colour', save: 'Save PDF', saving: 'Saving…', done: 'Saved.', placeHint: 'Click on a page to place it.',
        typeHere: 'Type here', sigTitle: 'Draw your signature', sigClear: 'Clear', sigUse: 'Use signature', sigUpload: 'Upload image instead', cancel: 'Cancel',
        empty: 'Nothing added yet — pick a tool and click on a page.', loading: 'Loading pages…', del: 'Delete',
      },
    },
    zh: {
      name: 'PDF 编辑 — 添加文字和签名',
      title: '在线编辑 PDF — 添加文字、签名、图片、涂白遮盖，免费',
      desc: '填写并签署 PDF 表格：添加任意语言的文字、手写或上传签名、插入图片、用涂白遮盖内容。免费、不上传、无水印。',
      h1: '编辑 PDF：添加文字、签名、图片和涂白',
      lead: '直接在页面上填写表格、签署合同、添加备注或遮盖信息。中文、日文等所有语言都可以使用。PDF 不会离开你的浏览器。',
      steps: [
        '把 PDF 拖到框里，页面会显示在下方。',
        '选择工具（文字、签名、图片或涂白），在页面上点击要放置的位置。拖动可移动，拖动右下角可调整大小。',
        '点击「保存 PDF」下载编辑后的文件。',
      ],
      faq: [
        ['怎么在 PDF 上签名？', '点击「签名」，用鼠标或手指写下签名（也可以上传签名照片），然后在页面上点击要放置的位置，拖动右下角调整大小。'],
        ['可以修改 PDF 里原有的文字吗？', '不能直接修改，因为 PDF 并不以可编辑段落的形式保存文字。可以先用「涂白」盖住旧文字，再在上面输入新文字。'],
        ['添加的中文能正常显示吗？', '可以。添加的文字会以高分辨率绘制，任何语言和表情符号都能显示，不需要 PDF 内置特殊字体。'],
        ['涂白能真正删除内容吗？', '涂白只是在视觉上遮盖内容，原文字可能仍然保存在文件中。如果是敏感信息，请把结果用「PDF 转图片」转换后，再用「图片转 PDF」合成。'],
        ['PDF 会被上传吗？', '不会，编辑和保存都在你的浏览器中完成。'],
      ],
      ui: {
        drop: '把 PDF 拖到这里，或点击选择', text: 'T  文字', signature: '✍ 签名', image: '🖼 图片', whiteout: '▭ 涂白', select: '↖ 选择',
        size: '字号', color: '颜色', save: '保存 PDF', saving: '正在保存…', done: '已保存。', placeHint: '在页面上点击以放置。',
        typeHere: '在此输入', sigTitle: '写下你的签名', sigClear: '清除', sigUse: '使用签名', sigUpload: '改为上传图片', cancel: '取消',
        empty: '还没有添加任何内容 —— 先选择工具，再点击页面。', loading: '正在加载页面…', del: '删除',
      },
    },
  },
  ui: (s, c, lang) => html`
<div class="dropzone" id="pe-drop"><strong>${s.drop}</strong></div>
<div id="pe-work" hidden>
  <div class="sticky-bar">
    <div class="row" style="margin-top:0">
      <div class="seg" role="radiogroup">
        <label><input type="radio" name="pe-tool" value="select"> ${s.select}</label>
        <label><input type="radio" name="pe-tool" value="text" checked> ${s.text}</label>
        <label><input type="radio" name="pe-tool" value="signature"> ${s.signature}</label>
        <label><input type="radio" name="pe-tool" value="image"> ${s.image}</label>
        <label><input type="radio" name="pe-tool" value="whiteout"> ${s.whiteout}</label>
      </div>
      <label class="check">${s.size} <input type="number" id="pe-size" min="6" max="96" value="14" style="width:5em"></label>
      <label class="check">${s.color} <input type="color" id="pe-color" value="#000000"></label>
      <button class="btn" id="pe-save">${s.save}</button>
      <button class="btn ghost" id="pe-reset">${lang === 'zh' ? '选择其他 PDF' : 'Open another PDF'}</button>
    </div>
    <div class="muted small" id="pe-hint"></div>
  </div>
  <div class="editor-pages" id="pe-pages"></div>
</div>
<div class="status" id="pe-status" hidden></div>
<input type="file" id="pe-imgfile" accept="image/png,image/jpeg,image/webp" hidden>
<dialog id="pe-sig">
  <h3 style="margin-top:0">${s.sigTitle}</h3>
  <canvas class="sig-pad" id="pe-pad" width="1040" height="360"></canvas>
  <div class="row"><button class="btn" id="pe-sig-use">${s.sigUse}</button><button class="btn ghost" id="pe-sig-clear">${s.sigClear}</button><button class="btn ghost" id="pe-sig-upload">${s.sigUpload}</button><button class="btn ghost" id="pe-sig-cancel">${s.cancel}</button></div>
</dialog>`,
};
