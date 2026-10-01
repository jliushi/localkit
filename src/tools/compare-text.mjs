import { html } from '../../build/html.mjs';

export default {
  id: 'compare-text',
  category: 'docs',
  iconName: 'diff',
  color: '#0891b2',
  related: ['base64', 'resume-builder', 'edit-pdf'],
  appCategory: 'DeveloperApplication',
  strings: {
    en: {
      name: 'Compare Text (Diff)',
      short: 'Find every difference between two texts, highlighted word by word.',
      keywords: ['diff checker', 'text compare', 'compare two texts', 'find differences', 'code diff', 'diffchecker alternative', 'text difference', 'online diff'],
      title: 'Compare Text Online — Free Diff Checker, No Upload',
      desc: 'Paste two texts and see every added, removed and changed line, with the exact words highlighted. Side-by-side or inline view, ignore case and whitespace.',
      h1: 'Compare two texts and highlight the differences',
      sub: 'Compare Text is a free online diff checker: paste the original and the changed version and every difference appears instantly as you type — line by line, with the changed words marked. Works for documents, contracts, code and Chinese text.',
      features: [
        ['zap', 'Live as you type', 'No compare button needed: the result updates instantly, even for texts with tens of thousands of lines.'],
        ['highlighter', 'Word-level highlights', 'Changed lines show exactly which words (or Chinese characters) were added or removed.'],
        ['fold-vertical', 'Focus on changes', 'Long unchanged stretches are folded away; expand them with a click. Copy the result as a standard unified diff.'],
      ],
      howToTitle: 'How to compare two texts',
      steps: ['Paste the original text on the left and the changed text on the right.', 'Read the differences: red was removed, green was added.', 'Switch between side-by-side and inline view, or ignore case and whitespace.'],
      guide: [
        ['Typical uses', { list: ['Check what changed between two versions of a contract, essay or policy.', 'Compare configuration files, CSV exports or code snippets.', 'Verify that a translation or edit didn\'t drop a paragraph.', 'Spot hidden changes in spacing with "Ignore whitespace" turned off.'] }],
      ],
      faq: [
        ['How do I find the differences between two texts?', 'Paste one version in each box. The differences are highlighted immediately — red for removed, green for added.'],
        ['Can I compare Word or PDF documents?', 'Copy the text out of the documents and paste it here. Plain-text files (txt, md, csv, json, code) can be dropped straight onto the boxes.'],
        ['Does it work for Chinese?', 'Yes. Word-level highlighting splits Chinese into characters, so changes are marked precisely.'],
        ['Is there a size limit?', 'No fixed limit; large texts take a moment because everything runs on your device.'],
        ['Is my text sent anywhere?', 'No. The comparison happens in your browser and nothing is stored.'],
      ],
      ui: {
        original: 'Original', changed: 'Changed', phA: 'Paste the original text, or drop a text file…', phB: 'Paste the changed text, or drop a text file…',
        split: 'Side by side', inline: 'Inline', ignoreCase: 'Ignore case', ignoreWs: 'Ignore whitespace', swap: 'Swap', clear: 'Clear', copyDiff: 'Copy as unified diff',
        identical: 'The two texts are identical.', stats: '$1 added · $2 removed · $3 unchanged lines', unchanged: 'Show $1 unchanged lines', removed: 'Removed', added: 'Added', empty: 'Paste text into both boxes to compare.',
      },
    },
    zh: {
      name: '文本对比',
      short: '找出两段文本的所有差异，逐词高亮显示。',
      keywords: ['文本对比', 'diff', '比较两段文字', '找不同', '代码对比', '文档对比'],
      title: '在线文本对比 — 找出两段文字的差异（Diff 工具）',
      desc: '粘贴两段文本，立即看到所有新增、删除和修改的行，并精确高亮改动的词语。支持并排或行内视图、忽略大小写和空白、折叠未改动的行。免费、私密，不上传任何内容。',
      h1: '对比两段文本，高亮显示差异',
      sub: '文本对比是一个免费的在线 Diff 工具：粘贴原文和修改后的版本，差异随输入即时出现，逐行显示并精确标出改动的词。适用于文档、合同、代码和中文文本，内容不离开浏览器。',
      features: [
        ['zap', '边输入边对比', '不用点「对比」按钮：结果即时更新，几万行的文本也没问题。'],
        ['highlighter', '逐词高亮', '修改过的行会精确标出新增或删除了哪些词（中文按单字）。'],
        ['fold-vertical', '只看改动', '大段未改动的内容会自动折叠，点击即可展开；结果可以复制为标准的 unified diff。'],
      ],
      howToTitle: '如何对比两段文本',
      steps: ['在左边粘贴原文，右边粘贴修改后的文本。', '查看差异：红色为删除，绿色为新增。', '可以切换并排或行内视图，或忽略大小写和空白。'],
      guide: [
        ['常见用途', { list: ['检查合同、论文或制度两个版本之间改了什么。', '对比配置文件、CSV 导出或代码片段。', '确认翻译或修改没有漏掉段落。', '关闭「忽略空白」可以发现隐藏的空格变化。'] }],
      ],
      faq: [
        ['怎么找出两段文本的不同？', '在两个框里各粘贴一个版本，差异会立即高亮 —— 红色是删除，绿色是新增。'],
        ['能对比 Word 或 PDF 文档吗？', '把文档里的文字复制出来粘贴到这里即可。纯文本文件（txt、md、csv、json、代码）可以直接拖到输入框里。'],
        ['支持中文吗？', '支持。逐词高亮会把中文拆成单字，改动位置标得很精确。'],
        ['有大小限制吗？', '没有固定限制；文本很大时需要稍等片刻，因为全部在你的设备上计算。'],
        ['文本会被发送出去吗？', '不会。对比在你的浏览器中完成，不保存任何内容。'],
      ],
      ui: {
        original: '原文', changed: '修改后', phA: '粘贴原文，或拖入文本文件…', phB: '粘贴修改后的文本，或拖入文本文件…',
        split: '并排', inline: '行内', ignoreCase: '忽略大小写', ignoreWs: '忽略空白', swap: '交换', clear: '清空', copyDiff: '复制为 unified diff',
        identical: '两段文本完全相同。', stats: '新增 $1 行 · 删除 $2 行 · 未改动 $3 行', unchanged: '显示 $1 行未改动内容', removed: '删除', added: '新增', empty: '在两个框里都粘贴文本后即可对比。',
      },
    },
  },
  ui: (s) => html`
<div class="split2">
  <div class="pane"><div class="pane-head"><span class="field-label">${s.original}</span><span class="muted small" id="dt-ca"></span></div><textarea id="dt-a" rows="12" spellcheck="false" placeholder="${s.phA}"></textarea></div>
  <div class="pane"><div class="pane-head"><span class="field-label">${s.changed}</span><span class="muted small" id="dt-cb"></span></div><textarea id="dt-b" rows="12" spellcheck="false" placeholder="${s.phB}"></textarea></div>
</div>
<div class="actions" style="margin:14px 0">
  <div class="chips"><label class="chip"><input type="radio" name="dt-view" value="split" checked><span>${s.split}</span></label><label class="chip"><input type="radio" name="dt-view" value="inline"><span>${s.inline}</span></label></div>
  <label class="check"><input type="checkbox" id="dt-case"> ${s.ignoreCase}</label>
  <label class="check"><input type="checkbox" id="dt-ws"> ${s.ignoreWs}</label>
  <span style="flex:1"></span>
  <button class="btn ghost sm" id="dt-swap">${s.swap}</button><button class="btn ghost sm" id="dt-copy">${s.copyDiff}</button><button class="btn ghost sm" id="dt-clear">${s.clear}</button>
</div>
<div class="legend" id="dt-legend"><span id="dt-stats"></span><span><i style="background:var(--del-strong)"></i>${s.removed}</span><span><i style="background:var(--add-strong)"></i>${s.added}</span></div>
<div id="dt-out"></div>`,
};
