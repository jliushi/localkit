import { html } from '../../build/html.mjs';

export default {
  id: 'base64',
  category: 'docs',
  iconName: 'binary',
  color: '#7c3aed',
  related: ['compare-text', 'convert-image', 'compress-image'],
  appCategory: 'DeveloperApplication',
  strings: {
    en: {
      name: 'Base64 Encode & Decode',
      short: 'Convert text or files to Base64 and back — live, both directions.',
      keywords: ['base64 decoder', 'base64 encoder', 'base64 to image', 'image to base64', 'data uri', 'base64 to file'],
      title: 'Base64 Encode & Decode Online — Text, Files & Images (Live, Private)',
      desc: 'Encode text or files to Base64 and decode Base64 back to text, images or downloadable files — live as you type, in both directions. UTF-8, URL-safe Base64 and data URIs. Free and private: runs in your browser.',
      h1: 'Base64 encoder and decoder',
      sub: 'Type in either box and the other updates instantly: text becomes Base64, Base64 becomes text. Drop a file to get its Base64 or data URI, or paste Base64 to preview and download the file inside it.',
      features: [
        ['arrow-left-right', 'Live in both directions', 'Edit the text or the Base64 — the other side updates as you type. Full UTF-8 support for Chinese and emoji.'],
        ['file-code', 'Files and images', 'Drop any file to encode it, or paste Base64 / a data URI to preview images and download the decoded file.'],
        ['link', 'URL-safe and data URIs', 'Switch to URL-safe Base64 (- and _) or wrap the result as a data: URI for HTML and CSS.'],
      ],
      howToTitle: 'How to encode or decode Base64',
      steps: ['To encode, type or paste text in the left box (or drop a file on it).', 'To decode, paste Base64 in the right box — text appears on the left; binary data can be previewed and downloaded.', 'Use Copy to copy either side.'],
      guide: [
        ['What is Base64?', 'Base64 writes binary data with 64 safe characters (A–Z, a–z, 0–9, + and /), so it can travel inside text: JSON, e-mail, URLs, HTML and CSS. It makes data about 33% larger and is not encryption — anyone can decode it.'],
        ['Common uses', { list: ['Embedding small images in HTML or CSS as data: URIs.', 'Reading the payload of JWT tokens and API responses (use URL-safe mode).', 'Sending files inside JSON or configuration files.', 'Decoding e-mail attachments or Basic-Auth headers.'] }],
      ],
      faq: [
        ['How do I decode Base64 to text?', 'Paste the Base64 into the right box; the decoded text appears on the left immediately.'],
        ['How do I convert Base64 to an image?', 'Paste the Base64 or data:image URI in the right box. LocalKit detects the image, shows a preview and lets you download it.'],
        ['How do I convert an image to Base64?', 'Drop the image on the left box. Turn on "Data URI" to get a string you can use directly in <img src="…">.'],
        ['Is Base64 encryption?', 'No — it is only an encoding. Never use it to protect passwords or secrets.'],
        ['Is my data sent anywhere?', 'No. Encoding and decoding happen in your browser.'],
      ],
      ui: {
        text: 'Text', b64: 'Base64', phText: 'Type or paste text, or drop a file here…', phB64: 'Paste Base64 or a data: URI…', urlSafe: 'URL-safe', dataUri: 'Data URI', copy: 'Copy', clear: 'Clear',
        invalid: 'This is not valid Base64.', binary: 'Binary data: $1 · $2', download: 'Download file', fileEncoded: '$1 · $2 encoded', chars: '$1 characters', bytes: '$1 bytes',
      },
    },
    zh: {
      name: 'Base64 编码解码',
      short: '文本或文件与 Base64 互转 —— 双向实时转换。',
      keywords: ['base64 解码', 'base64 编码', 'base64 转图片', '图片转 base64', 'data uri', 'base64 转文件'],
      title: 'Base64 在线编码解码 — 文本、文件、图片互转（实时、私密）',
      desc: '把文本或文件编码为 Base64，或把 Base64 解码回文本、图片或可下载的文件 —— 输入时双向实时转换。支持 UTF-8、URL 安全 Base64 和 data URI。免费、私密，在浏览器中运行。',
      h1: 'Base64 编码 / 解码工具',
      sub: '在任意一个框里输入，另一个会立即更新：文本变成 Base64，Base64 变回文本。拖入文件可得到它的 Base64 或 data URI，粘贴 Base64 可以预览并下载其中的文件。',
      features: [
        ['arrow-left-right', '双向实时转换', '编辑文本或 Base64，另一边都会随输入更新。完整支持中文和表情符号（UTF-8）。'],
        ['file-code', '文件和图片', '拖入任意文件即可编码；粘贴 Base64 或 data URI 可以预览图片、下载解码后的文件。'],
        ['link', 'URL 安全与 data URI', '可切换为 URL 安全的 Base64（- 和 _），或把结果包装成用于 HTML、CSS 的 data: URI。'],
      ],
      howToTitle: '如何进行 Base64 编码和解码',
      steps: ['编码：在左边的框里输入或粘贴文本（也可以拖入文件）。', '解码：在右边的框里粘贴 Base64 —— 左边显示文本；二进制数据可以预览和下载。', '用「复制」按钮复制任意一边。'],
      guide: [
        ['什么是 Base64？', 'Base64 用 64 个安全字符（A–Z、a–z、0–9、+ 和 /）表示二进制数据，让它可以放进文本里传输：JSON、邮件、网址、HTML 和 CSS。数据会变大约 33%，而且不是加密 —— 任何人都能解码。'],
        ['常见用途', { list: ['把小图片作为 data: URI 嵌入 HTML 或 CSS。', '查看 JWT 令牌和 API 返回数据的内容（使用 URL 安全模式）。', '在 JSON 或配置文件中传递文件。', '解码邮件附件或 Basic-Auth 请求头。'] }],
      ],
      faq: [
        ['怎么把 Base64 解码成文本？', '把 Base64 粘贴到右边的框里，解码后的文本会立即出现在左边。'],
        ['怎么把 Base64 转成图片？', '把 Base64 或 data:image URI 粘贴到右边。LocalKit 会识别出图片，显示预览并提供下载。'],
        ['怎么把图片转成 Base64？', '把图片拖到左边的框里。打开「Data URI」可以得到能直接用于 <img src="…"> 的字符串。'],
        ['Base64 是加密吗？', '不是，它只是一种编码。千万不要用它保护密码或机密信息。'],
        ['数据会被发送出去吗？', '不会。编码和解码都在你的浏览器中完成。'],
      ],
      ui: {
        text: '文本', b64: 'Base64', phText: '输入或粘贴文本，也可以把文件拖到这里…', phB64: '粘贴 Base64 或 data: URI…', urlSafe: 'URL 安全', dataUri: 'Data URI', copy: '复制', clear: '清空',
        invalid: '这不是有效的 Base64。', binary: '二进制数据：$1 · $2', download: '下载文件', fileEncoded: '已编码 $1 · $2', chars: '$1 个字符', bytes: '$1 字节',
      },
    },
  },
  ui: (s) => html`
<div class="actions" style="margin-bottom:12px"><label class="check"><input type="checkbox" id="b6-url"> ${s.urlSafe}</label><label class="check"><input type="checkbox" id="b6-uri"> ${s.dataUri}</label><span style="flex:1"></span><button class="btn ghost sm" id="b6-clear">${s.clear}</button></div>
<div class="split2">
  <div class="pane">
    <div class="pane-head"><span class="field-label">${s.text}</span><span class="muted small" id="b6-tc"></span><button class="btn ghost sm" id="b6-copyt">${s.copy}</button></div>
    <textarea id="b6-text" rows="12" spellcheck="false" placeholder="${s.phText}"></textarea>
    <div id="b6-file"></div>
  </div>
  <div class="pane">
    <div class="pane-head"><span class="field-label">${s.b64}</span><span class="muted small" id="b6-bc"></span><button class="btn ghost sm" id="b6-copyb">${s.copy}</button></div>
    <textarea id="b6-b64" rows="12" spellcheck="false" placeholder="${s.phB64}"></textarea>
    <div id="b6-bin"></div>
  </div>
</div>`,
};
