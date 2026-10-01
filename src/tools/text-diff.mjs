import { html } from '../../build/html.mjs';

export default {
  id: 'text-diff',
  category: 'text',
  icon: '±',
  color: '#0891b2',
  strings: {
    en: {
      name: 'Text Compare (Diff)',
      title: 'Text Compare Online — Find Differences Between Two Texts (Diff)',
      desc: 'Compare two texts and highlight every added, removed and changed line, word or character. Side-by-side or inline view. Free, private, runs in your browser.',
      h1: 'Compare two texts and highlight the differences',
      lead: 'Paste two versions of a document, code or list. Changes are highlighted line by line, with the exact changed words marked inside each line.',
      steps: [
        'Paste the original text on the left and the changed text on the right (or drop .txt, .md, code files).',
        'Pick side-by-side or inline view, and whether to ignore case or whitespace.',
        'Read the highlighted result: red was removed, green was added.',
      ],
      faq: [
        ['Can I compare files?', 'Yes. Drop any text-based file (txt, md, csv, json, code) on either box. Word and PDF files must be copied as text first.'],
        ['Is there a size limit?', 'No fixed limit. Texts with tens of thousands of lines work; very large inputs take a few seconds because everything runs on your device.'],
        ['Does it work for Chinese?', 'Yes. Word mode splits Chinese text into characters so changes are highlighted precisely.'],
        ['Is my text sent anywhere?', 'No. The comparison runs in your browser; nothing is uploaded or stored.'],
      ],
      ui: {
        original: 'Original text', changed: 'Changed text', compare: 'Compare', sideBySide: 'Side by side', inline: 'Inline',
        ignoreCase: 'Ignore case', ignoreWs: 'Ignore whitespace', identical: 'The two texts are identical.',
        summary: '$1 lines added, $2 lines removed', swap: 'Swap', dropHint: 'Drop a text file here',
        placeholderA: 'Paste the original text…', placeholderB: 'Paste the changed text…',
      },
    },
    zh: {
      name: '文本对比（Diff）',
      title: '在线文本对比工具 — 找出两段文本的差异（Diff）',
      desc: '对比两段文本，高亮显示新增、删除和修改的行、词和字符。支持并排和行内视图。免费、私密，在浏览器本地运行。',
      h1: '在线文本对比，高亮显示差异',
      lead: '粘贴文档、代码或清单的两个版本，逐行高亮显示改动，并在每一行内标出具体改动的词语。',
      steps: [
        '左边粘贴原文，右边粘贴修改后的文本（也可以拖入 txt、md 或代码文件）。',
        '选择并排或行内视图，以及是否忽略大小写和空白。',
        '查看高亮结果：红色为删除，绿色为新增。',
      ],
      faq: [
        ['可以对比文件吗？', '可以。把任意文本类文件（txt、md、csv、json、代码）拖到任一输入框即可。Word 和 PDF 需要先复制出文字。'],
        ['有大小限制吗？', '没有固定限制。几万行的文本也可以对比；特别大的内容可能需要几秒钟，因为全部在你的设备上计算。'],
        ['支持中文吗？', '支持。按词对比时会把中文拆成单字，改动位置标得很精确。'],
        ['文本会被发送出去吗？', '不会。对比在你的浏览器中完成，不上传也不保存任何内容。'],
      ],
      ui: {
        original: '原文', changed: '修改后', compare: '开始对比', sideBySide: '并排', inline: '行内',
        ignoreCase: '忽略大小写', ignoreWs: '忽略空白', identical: '两段文本完全相同。',
        summary: '新增 $1 行，删除 $2 行', swap: '交换', dropHint: '把文本文件拖到这里',
        placeholderA: '粘贴原文…', placeholderB: '粘贴修改后的文本…',
      },
    },
  },
  ui: (s) => html`
<div class="diff-inputs">
  <div class="pane"><label for="d-a">${s.original}</label><textarea id="d-a" rows="12" spellcheck="false" placeholder="${s.placeholderA}"></textarea></div>
  <div class="pane"><label for="d-b">${s.changed}</label><textarea id="d-b" rows="12" spellcheck="false" placeholder="${s.placeholderB}"></textarea></div>
</div>
<div class="row toolbar">
  <button class="btn" id="d-go">${s.compare}</button>
  <div class="seg" role="radiogroup">
    <label><input type="radio" name="d-view" value="split" checked> ${s.sideBySide}</label>
    <label><input type="radio" name="d-view" value="inline"> ${s.inline}</label>
  </div>
  <label class="check"><input type="checkbox" id="d-case"> ${s.ignoreCase}</label>
  <label class="check"><input type="checkbox" id="d-ws"> ${s.ignoreWs}</label>
  <button class="btn ghost" id="d-swap">${s.swap}</button>
</div>
<div class="status" id="d-status" hidden></div>
<div id="d-out" class="diff-out"></div>`,
};
