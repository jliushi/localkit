import { html } from '../../build/html.mjs';

export const SUB_LANGS = {
  en: { en: 'English', zh: 'Chinese', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', ru: 'Russian', it: 'Italian', vi: 'Vietnamese', id: 'Indonesian', ar: 'Arabic', ko: 'Korean' },
  zh: { en: '英语', zh: '中文', es: '西班牙语', fr: '法语', de: '德语', ja: '日语', ru: '俄语', it: '意大利语', vi: '越南语', id: '印尼语', ar: '阿拉伯语', ko: '韩语' },
};

export default {
  id: 'translate-subtitles',
  category: 'video',
  iconName: 'languages',
  color: '#0ea5e9',
  related: ['ai-subtitle-generator', 'compare-text', 'video-to-mp3'],
  strings: {
    en: {
      name: 'Translate Subtitles',
      short: 'Translate SRT/VTT subtitles with on-device AI, or make bilingual subtitles.',
      keywords: ['srt translator', 'subtitle translator', 'translate srt', 'bilingual subtitles', 'dual subtitles', 'vtt translate'],
      title: 'Subtitle Translator — SRT & VTT Files Free with AI (No Upload)',
      desc: 'Translate SRT and VTT subtitles between 12 languages with on-device AI. Timings kept, translated-only or bilingual output, every line editable. Free, no upload.',
      h1: 'Translate subtitles (SRT & VTT)',
      sub: 'Drop an SRT or VTT file and an AI translation model running in your browser translates every line while keeping the original timings. Choose translated-only or bilingual subtitles, fix any line, and download.',
      features: [
        ['languages', '12 languages', 'English ↔ Chinese, Spanish, French, German, Japanese, Russian, Italian, Vietnamese, Indonesian and Arabic, plus Korean → English; other pairs go via English. Open OPUS-MT models.'],
        ['subtitles', 'Bilingual subtitles', 'Put the original and the translation on two lines of the same subtitle — great for language learning and international audiences.'],
        ['shield-check', 'Private and free', 'The model runs on your device; your subtitles are never sent to a translation server, and there are no character limits.'],
      ],
      howToTitle: 'How to translate a subtitle file',
      steps: [
        'Drop an .srt or .vtt file (or paste subtitle text).',
        'Check the detected source language, pick the target language and whether you want bilingual output.',
        'Press Translate. The model downloads once (about 110 MB per language pair) and then runs offline. Review the lines and download SRT or VTT.',
      ],
      guide: [
        ['How good is the translation?', 'OPUS-MT models translate short, everyday sentences well and run fast on ordinary computers. Idioms, slang, names and technical terms can come out literal, so read through the result — every line is editable before you download. Pairs that don\'t involve English (for example Chinese → Spanish) are translated through English, which can lose some nuance.'],
        ['No subtitles yet?', 'Use the AI Subtitle Generator to transcribe your video first; it has the same Translate button built in.'],
      ],
      faq: [
        ['How do I translate an SRT file?', 'Drop the .srt file, choose the target language and press Translate. Download the translated .srt when it finishes; the timings are unchanged.'],
        ['Can I make bilingual (dual-language) subtitles?', 'Yes. Choose "Bilingual" and each subtitle shows the original line with the translation underneath.'],
        ['Is there a length limit?', 'No. Long subtitle files take longer but have no character or file-size limit.'],
        ['Which languages are supported?', 'English ↔ Chinese, Spanish, French, German, Japanese, Russian, Italian, Vietnamese, Indonesian and Arabic, plus Korean → English. Other combinations (for example Chinese → Spanish) are translated via English, which can lose some nuance.'],
        ['Are my subtitles uploaded?', 'No. Translation runs in your browser; only the model files are downloaded.'],
      ],
      ui: {
        drop: 'Drop an SRT or VTT subtitle file', dropHint: '.srt, .vtt · or paste below · stays on your device', paste: 'Or paste subtitle text', pasteBtn: 'Use pasted text',
        from: 'From', to: 'To', mode: 'Output', mOnly: 'Translation only', mBi: 'Bilingual (original + translation)', translate: 'Translate',
        loadingModel: 'Downloading the translation model (first time only) · $1 / $2', translating: 'Translating…', done: 'Translated $1 subtitles.', badFile: 'No subtitles found. Is this an SRT or VTT file?',
        same: 'Source and target language are the same.', noRoute: 'This language pair is not available.', original: 'Original', translation: 'Translation',
        dlSrt: 'Download SRT', dlVtt: 'Download VTT', count: '$1 subtitles · detected $2', another: 'Translate another file',
      },
    },
    zh: {
      name: '字幕翻译',
      short: '用本地 AI 翻译 SRT/VTT 字幕，或生成双语字幕。',
      keywords: ['字幕翻译', 'srt 翻译', '双语字幕', '中英字幕', '英文字幕翻译成中文', 'vtt 翻译'],
      title: '字幕翻译 — 在线免费用 AI 翻译 SRT、VTT 字幕，支持双语字幕（不上传）',
      desc: '用在浏览器本地运行的 AI，把 SRT、VTT 字幕在中文、英语、日语、西班牙语、法语、德语等之间互译。保留时间轴，可生成中英双语字幕，可逐句修改后下载。免费、免注册、不上传。',
      h1: '字幕翻译（SRT / VTT）',
      sub: '拖入 SRT 或 VTT 字幕文件，在浏览器里运行的 AI 翻译模型会逐句翻译，并保留原来的时间轴。可以只要译文，也可以生成双语字幕，每一句都能修改后再下载。',
      features: [
        ['languages', '12 种语言', '英语与中文、西班牙语、法语、德语、日语、俄语、意大利语、越南语、印尼语、阿拉伯语互译，另有韩语译英语；其余组合经英语中转。使用开源的 OPUS-MT 模型。'],
        ['subtitles', '双语字幕', '原文和译文显示在同一条字幕的上下两行 —— 学外语、面向海外观众都很合适。'],
        ['shield-check', '私密且免费', '模型在你的设备上运行，字幕不会发送到任何翻译服务器，也没有字数限制。'],
      ],
      howToTitle: '如何翻译字幕文件',
      steps: [
        '拖入 .srt 或 .vtt 文件（也可以直接粘贴字幕文本）。',
        '确认自动识别的原文语言，选择目标语言以及是否输出双语字幕。',
        '点击「翻译」。模型只需下载一次（每个语言对约 110 MB），之后可离线运行。检查译文后下载 SRT 或 VTT。',
      ],
      guide: [
        ['翻译质量怎么样？', 'OPUS-MT 模型对简短的日常句子翻译得不错，普通电脑上也跑得很快。俗语、网络用语、人名和专业术语可能会直译，建议通读一遍 —— 下载前每一句都可以修改。不涉及英语的语言对（例如中文译西班牙语）会经过英语中转，可能损失一些细节。'],
        ['还没有字幕？', '先用「AI 字幕生成」把视频转成字幕，它的编辑器里同样内置了翻译按钮。'],
      ],
      faq: [
        ['怎么翻译 SRT 字幕文件？', '拖入 .srt 文件，选择目标语言，点击「翻译」，完成后下载翻译好的 .srt，时间轴保持不变。'],
        ['能做中英双语字幕吗？', '能。选择「双语」，每条字幕会显示原文，下面一行是译文。'],
        ['有长度限制吗？', '没有。字幕越长翻译时间越长，但没有字数或文件大小限制。'],
        ['支持哪些语言？', '英语与中文、西班牙语、法语、德语、日语、俄语、意大利语、越南语、印尼语、阿拉伯语互译，以及韩语译英语。其他组合会经过英语中转。'],
        ['字幕会被上传吗？', '不会。翻译在你的浏览器中完成，只会下载模型文件。'],
      ],
      ui: {
        drop: '拖入 SRT 或 VTT 字幕文件', dropHint: '.srt、.vtt · 也可以在下方粘贴 · 文件不离开你的设备', paste: '或粘贴字幕文本', pasteBtn: '使用粘贴的文本',
        from: '原文', to: '译为', mode: '输出', mOnly: '只要译文', mBi: '双语（原文 + 译文）', translate: '翻译',
        loadingModel: '正在下载翻译模型（仅首次）· $1 / $2', translating: '正在翻译…', done: '已翻译 $1 条字幕。', badFile: '没有找到字幕，这是 SRT 或 VTT 文件吗？',
        same: '原文和目标语言相同。', noRoute: '暂不支持这个语言组合。', original: '原文', translation: '译文',
        dlSrt: '下载 SRT', dlVtt: '下载 VTT', count: '共 $1 条字幕 · 识别为$2', another: '翻译另一个文件',
      },
    },
  },
  ui: (s, c, lang) => html`
<div id="ts-pick"></div>
<details class="more" id="ts-paste-box"><summary>${s.paste}</summary><div class="panel"><textarea id="ts-paste" rows="6" placeholder="1&#10;00:00:01,000 --> 00:00:03,000&#10;Hello world"></textarea><div><button class="btn ghost sm" id="ts-paste-go">${s.pasteBtn}</button></div></div></details>
<div id="ts-work" class="panel" hidden>
  <div id="ts-file"></div>
  <div class="opts">
    <label class="field opt"><span>${s.from}</span><select id="ts-from">${Object.entries(SUB_LANGS[lang]).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></label>
    <label class="field opt"><span>${s.to}</span><select id="ts-to">${Object.entries(SUB_LANGS[lang]).map(([k, v]) => html`<option value="${k}"${k === (lang === 'zh' ? 'zh' : 'en') ? ' selected' : ''}>${v}</option>`)}</select></label>
    <div class="opt"><span class="field-label">${s.mode}</span><div class="chips"><label class="chip"><input type="radio" name="ts-mode" value="only" checked><span>${s.mOnly}</span></label><label class="chip"><input type="radio" name="ts-mode" value="bi"><span>${s.mBi}</span></label></div></div>
  </div>
  <div id="ts-alert"></div>
  <div class="actions"><button class="btn lg" id="ts-go">${s.translate}</button></div>
  <div id="ts-task"></div>
  <div id="ts-result"></div>
</div>`,
};
