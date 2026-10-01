import { html } from '../../build/html.mjs';

export default {
  id: 'base64',
  category: 'text',
  icon: 'B64',
  color: '#7c3aed',
  strings: {
    en: {
      name: 'Base64 Encode / Decode',
      title: 'Base64 Encode & Decode Online — Text and Files, Free',
      desc: 'Encode text or files to Base64 and decode Base64 back to text or a file. Supports UTF-8, URL-safe Base64 and data URIs. Runs in your browser — nothing is uploaded.',
      h1: 'Base64 encoder and decoder',
      lead: 'Convert text or any file to Base64, or decode Base64 back to text or a downloadable file. Full UTF-8 support (Chinese, emoji), URL-safe mode and data URIs.',
      steps: [
        'Type or paste text in the left box, or drop a file on the file area.',
        'Choose Encode or Decode. The result appears instantly.',
        'Copy the result, or download it as a file when decoding binary data.',
      ],
      faq: [
        ['What is Base64?', 'Base64 represents binary data with 64 printable characters (A–Z, a–z, 0–9, + and /). It is used to embed images in HTML or CSS, send attachments in e-mail, and put binary data in JSON or URLs.'],
        ['Does Base64 encrypt my data?', 'No. Base64 is an encoding, not encryption — anyone can decode it. Do not use it to protect secrets.'],
        ['What is URL-safe Base64?', 'A variant that uses - and _ instead of + and / and usually drops the = padding, so the text can be used in URLs and file names. Turn on "URL-safe" to produce it; decoding accepts both variants automatically.'],
        ['Is my file uploaded?', 'No. Encoding and decoding happen in your browser with JavaScript; the file never leaves your device.'],
      ],
      ui: {
        input: 'Input', output: 'Output', encode: 'Encode →', decode: '← Decode', urlSafe: 'URL-safe', dataUri: 'As data URI',
        fileArea: 'Or drop a file to encode it', fileEncoded: 'Encoded $1 ($2)', invalid: 'This is not valid Base64.',
        decodedBinary: 'The decoded data is binary ($1). Download it as a file:', saveAs: 'Download file', placeholderIn: 'Text or Base64…',
        swap: 'Swap', chars: '$1 characters',
      },
    },
    zh: {
      name: 'Base64 编码 / 解码',
      title: 'Base64 在线编码解码 — 文本和文件互转，免费',
      desc: '把文本或文件编码为 Base64，或把 Base64 解码回文本或文件。支持 UTF-8 中文、URL 安全 Base64 和 data URI。在浏览器本地运行，不上传任何内容。',
      h1: 'Base64 编码 / 解码工具',
      lead: '把文本或任意文件转换成 Base64，或把 Base64 还原为文本或可下载的文件。完整支持 UTF-8（中文、表情符号），支持 URL 安全模式和 data URI。',
      steps: [
        '在左侧输入框输入或粘贴文本，或把文件拖到文件区域。',
        '点击「编码」或「解码」，结果立即显示。',
        '复制结果；如果解码出的是二进制数据，可以直接下载为文件。',
      ],
      faq: [
        ['什么是 Base64？', 'Base64 用 64 个可打印字符（A–Z、a–z、0–9、+ 和 /）表示二进制数据，常用于在 HTML/CSS 中内嵌图片、电子邮件附件，以及在 JSON 或 URL 中传递二进制数据。'],
        ['Base64 能加密数据吗？', '不能。Base64 只是编码，不是加密，任何人都能解码，不要用它保护敏感信息。'],
        ['什么是 URL 安全的 Base64？', '它用 - 和 _ 代替 + 和 /，并通常去掉末尾的 = 填充，因此可以直接放进网址和文件名。勾选「URL 安全」即可生成；解码时两种格式都能自动识别。'],
        ['文件会被上传吗？', '不会。编码和解码都在你的浏览器中用 JavaScript 完成，文件不会离开你的设备。'],
      ],
      ui: {
        input: '输入', output: '输出', encode: '编码 →', decode: '← 解码', urlSafe: 'URL 安全', dataUri: '输出为 data URI',
        fileArea: '或者拖入文件进行编码', fileEncoded: '已编码 $1（$2）', invalid: '这不是有效的 Base64。',
        decodedBinary: '解码结果是二进制数据（$1），可以下载为文件：', saveAs: '下载文件', placeholderIn: '文本或 Base64…',
        swap: '交换', chars: '$1 个字符',
      },
    },
  },
  ui: (s, c) => html`
<div class="b64">
  <div class="pane">
    <label for="b64-in">${s.input}</label>
    <textarea id="b64-in" rows="10" spellcheck="false" placeholder="${s.placeholderIn}"></textarea>
    <div class="dropzone small" id="b64-drop">${s.fileArea}</div>
  </div>
  <div class="mid">
    <button class="btn" id="b64-enc">${s.encode}</button>
    <button class="btn secondary" id="b64-dec">${s.decode}</button>
    <label class="check"><input type="checkbox" id="b64-url"> ${s.urlSafe}</label>
    <label class="check"><input type="checkbox" id="b64-uri"> ${s.dataUri}</label>
  </div>
  <div class="pane">
    <label for="b64-out">${s.output}</label>
    <textarea id="b64-out" rows="10" spellcheck="false" readonly></textarea>
    <div class="row"><button class="btn ghost" id="b64-copy">${c.copy}</button><button class="btn ghost" id="b64-swap">${s.swap}</button><span class="muted small" id="b64-count"></span></div>
  </div>
</div>
<div class="status" id="b64-status" hidden></div>`,
};
