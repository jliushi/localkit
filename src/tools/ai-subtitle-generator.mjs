import { html } from '../../build/html.mjs';
import { SUB_LANGS } from './translate-subtitles.mjs';

const LANGS = [
  ['', 'auto'], ['chinese', 'zh'], ['english', 'en'], ['cantonese', 'yue'], ['japanese', 'ja'], ['korean', 'ko'], ['spanish', 'es'], ['french', 'fr'],
  ['german', 'de'], ['russian', 'ru'], ['portuguese', 'pt'], ['italian', 'it'], ['vietnamese', 'vi'], ['thai', 'th'], ['indonesian', 'id'],
  ['arabic', 'ar'], ['hindi', 'hi'], ['turkish', 'tr'], ['dutch', 'nl'], ['polish', 'pl'], ['malay', 'ms'], ['ukrainian', 'uk'],
];
const LANG_NAMES = {
  en: { auto: 'Detect automatically', zh: 'Chinese (Mandarin)', en: 'English', yue: 'Cantonese', ja: 'Japanese', ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', pt: 'Portuguese', it: 'Italian', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', nl: 'Dutch', pl: 'Polish', ms: 'Malay', uk: 'Ukrainian' },
  zh: { auto: '自动识别', zh: '中文（普通话）', en: '英语', yue: '粤语', ja: '日语', ko: '韩语', es: '西班牙语', fr: '法语', de: '德语', ru: '俄语', pt: '葡萄牙语', it: '意大利语', vi: '越南语', th: '泰语', id: '印尼语', ar: '阿拉伯语', hi: '印地语', tr: '土耳其语', nl: '荷兰语', pl: '波兰语', ms: '马来语', uk: '乌克兰语' },
};

export default {
  id: 'ai-subtitle-generator',
  category: 'video',
  iconName: 'captions',
  color: '#16a34a',
  related: ['video-to-mp3', 'trim-video', 'compress-video'],
  appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'AI Subtitle Generator',
      short: 'Auto-generate subtitles with Whisper AI, edit them, export SRT or burn them in.',
      keywords: ['auto subtitles', 'caption generator', 'speech to text', 'transcribe', 'srt', 'whisper', 'add subtitles to video'],
      title: 'AI Subtitle Generator — Auto Subtitles, SRT Download, No Upload',
      desc: 'Auto-generate subtitles with Whisper AI in 99 languages. Edit, translate (bilingual too), download SRT/VTT or burn subtitles in. Free, private, no upload.',
      h1: 'AI subtitle generator — automatic subtitles for your video',
      sub: 'Drop a video and the Whisper speech-recognition AI writes timed subtitles in about 99 languages. Fix any word in the editor, translate the subtitles with one click (or keep both languages for bilingual subtitles), then download an SRT file or a video with the subtitles burned in. The AI runs on your own device: your video is never uploaded.',
      features: [
        ['sparkles', 'Accurate Whisper AI', 'OpenAI\'s open-source Whisper model recognises speech in 99 languages and can translate any of them into English subtitles.'],
        ['pencil-line', 'A real subtitle editor', 'See each subtitle on the video, edit text and timings, split or merge lines, and shift all timings at once.'],
        ['languages', 'One-click translation', 'Translate the finished subtitles into any of 12 languages with on-device OPUS-MT models, and keep the original for bilingual subtitles.'],
        ['clapperboard', 'SRT, VTT or burned in', 'Download SRT/VTT for YouTube, CapCut or Premiere — or render an MP4 with styled subtitles using your hardware encoder.'],
      ],
      howToTitle: 'How to add subtitles to a video automatically',
      steps: [
        'Drop a video or audio file (MP4, MOV, MKV, MP3, M4A, WAV…).',
        'Choose the spoken language and the accuracy, then press Generate subtitles. The AI model downloads once and is cached.',
        'Check the subtitles while the video plays and correct any mistakes. Optionally press Translate to get another language or bilingual subtitles.',
        'Download SRT or VTT, or press "Burn into video" to get an MP4 with subtitles.',
      ],
      guide: [
        ['Which accuracy should I pick?', { table: [['Setting', 'Model', 'One-time download', 'Best for'], ['Fast', 'Whisper tiny', '≈ 40 MB', 'Clear speech, quick drafts, phones'], ['Balanced', 'Whisper base', '≈ 80 MB', 'Most videos (default)'], ['Best', 'Whisper small', '≈ 250 MB', 'Accents, background noise, Chinese and other non-English languages']] }, 'The model is stored in your browser cache after the first use, so later videos start immediately — even offline.'],
        ['How fast is it?', 'In Chrome or Edge with a graphics card (WebGPU), a 10-minute video is usually transcribed in one to three minutes. Without GPU support it runs on the processor; "Fast" is then roughly real time. Keep the tab open while it works.'],
        ['Where to use the subtitle files', { list: ['YouTube Studio → Subtitles → Upload file → "With timing" (SRT).', 'CapCut, Premiere Pro, DaVinci Resolve and Final Cut: import the SRT as a caption track.', 'VLC and most players: keep the SRT next to the video with the same name.', 'Bilibili and Douyin: burn the subtitles into the video for the most reliable result.'] }],
        ['How do the two translate options differ?', '"Translate to English" is Whisper\'s own task: it turns speech in any language directly into English subtitles. The Translate panel in the editor is a second, separate step: OPUS-MT machine-translation models translate the finished text into 11 other languages, with an optional bilingual mode that shows the original and the translation on two lines. Quality is fine for everyday content, but read through it before publishing.'],
      ],
      faq: [
        ['Is this AI subtitle generator really free?', 'Yes. There is no sign-up, no watermark and no time limit, because the AI runs on your device instead of a paid server.'],
        ['Is my video uploaded to the cloud?', 'No. Only the AI model files are downloaded (from Hugging Face or its mirror). Your audio and video stay on your device.'],
        ['Which languages are supported?', 'Whisper recognises about 99 languages, including English, Chinese (Mandarin and Cantonese), Spanish, Japanese, Korean, French, German, Russian, Portuguese, Arabic, Hindi and Vietnamese.'],
        ['Can it translate subtitles?', 'Two ways. Before generating, "Translate to English" turns speech in any language into English subtitles. After generating, the editor\'s Translate panel translates the subtitles into 12 languages with on-device OPUS-MT models — check "Keep original" for bilingual subtitles.'],
        ['Can I add my own SRT file to a video?', 'Yes. Click "Import an SRT/VTT file" after choosing the video, edit if needed, and burn it into the video.'],
        ['Why are some Chinese subtitles in Traditional characters?', 'Whisper sometimes writes Mandarin in Traditional Chinese. LocalKit converts the result to Simplified Chinese automatically; choose Traditional under "More options" if you prefer it.'],
      ],
      ui: {
        drop: 'Drop a video or audio file', dropHint: 'MP4, MOV, MKV, WebM, MP3, M4A, WAV · stays on your device',
        language: 'Spoken language', accuracy: 'Accuracy', aFast: 'Fast', aFastSub: '40 MB', aBal: 'Balanced', aBalSub: '80 MB', aBest: 'Best', aBestSub: '250 MB',
        translate: 'Translate to English', more: 'More options', engine: 'Engine', eAuto: 'Automatic (graphics card when available)', eCpu: 'Processor only',
        script: 'Chinese characters', simp: 'Simplified', trad: 'Traditional (as recognised)',
        generate: 'Generate subtitles', importSrt: 'Import an SRT/VTT file instead', reading: 'Reading the audio…', connecting: 'Connecting to the model server…',
        downloading: 'Downloading the AI model (first time only)', loadingModel: 'Starting the AI model…', transcribing: 'Recognising speech…', fallback: 'No usable graphics card — using the processor (slower).',
        noSpeech: 'No speech was found in this file.', doneGen: '$1 subtitles generated in $2 ($3).', live: 'Live transcript',
        editorTitle: 'Subtitles', shift: 'Shift all', shiftApply: 'Apply', seconds: 's', add: 'Add subtitle', del: 'Delete', merge: 'Merge with next', split: 'Split at cursor',
        exportTitle: 'Download subtitles', srt: 'SRT', vtt: 'VTT', txt: 'Text',
        burnTitle: 'Burn subtitles into the video', size: 'Text size', sizeS: 'Small', sizeM: 'Medium', sizeL: 'Large', style: 'Style', styleOutline: 'Outline', styleBox: 'Box', position: 'Position', posBottom: 'Bottom', posTop: 'Top',
        burn: 'Burn into video (MP4)', burning: 'Rendering the video with subtitles…', burned: 'Video with subtitles is ready · $1', downloadVideo: 'Download video', audioOnly: 'This is an audio file, so subtitles can\'t be burned in. Download the SRT instead.',
        trTitle: 'Translate', trTo: 'Translate to', trBi: 'Keep original (bilingual)', trGo: 'Translate subtitles', trLoading: 'Downloading the translation model (first time only) · $1 / $2', trWorking: 'Translating…', trDone: 'Subtitles translated.', trSame: 'The subtitles are already in that language.',
        badSrt: 'That file doesn\'t look like SRT or VTT subtitles.', imported: '$1 subtitles imported.', another: 'Use another file', newText: 'New subtitle',
      },
    },
    zh: {
      name: 'AI 字幕生成',
      short: '用 Whisper AI 自动生成字幕，可编辑，导出 SRT 或直接压制进视频。',
      keywords: ['自动字幕', '视频加字幕', '语音转文字', '字幕提取', 'srt', 'whisper', '字幕生成器'],
      title: 'AI 字幕生成 — 视频自动生成字幕，免费 SRT，不上传',
      desc: '用 Whisper AI 为视频或音频自动生成字幕，支持中文、英文等 99 种语言。可编辑、可一键翻译（含双语字幕），下载 SRT/VTT 或压制进视频。免费、不上传、无水印。',
      h1: 'AI 字幕生成：视频自动加字幕',
      sub: '拖入视频，Whisper 语音识别 AI 就会写出带时间轴的字幕，支持约 99 种语言。在编辑器里改好错字，可一键把字幕翻译成 12 种语言（还能做双语字幕），然后下载 SRT 字幕文件，或得到压制了字幕的视频。AI 在你自己的设备上运行，视频绝不上传。',
      features: [
        ['sparkles', '准确的 Whisper AI', '使用 OpenAI 开源的 Whisper 模型，识别 99 种语言，还能把任何一种语言直接翻译成英文字幕。'],
        ['pencil-line', '真正好用的字幕编辑器', '字幕直接显示在视频上，可以修改文字和时间，拆分或合并字幕，一键整体平移时间轴。'],
        ['languages', '可一键翻译', '生成的字幕可一键翻译成 12 种语言，用在你设备上运行的 OPUS-MT 模型，保留原文就是双语字幕。'],
        ['clapperboard', 'SRT、VTT 或压制进视频', '下载 SRT/VTT 用于 B 站、剪映、Premiere —— 或用硬件编码器生成带样式字幕的 MP4。'],
      ],
      howToTitle: '如何给视频自动加字幕',
      steps: [
        '拖入视频或音频文件（MP4、MOV、MKV、MP3、M4A、WAV 等）。',
        '选择说话的语言和准确度，点击「生成字幕」。AI 模型只需下载一次，之后会被缓存。',
        '一边播放视频一边检查字幕，修正识别错误。需要的话点「翻译」，可以得到另一种语言或双语字幕。',
        '下载 SRT 或 VTT，或点击「压制进视频」得到带字幕的 MP4。',
      ],
      guide: [
        ['准确度怎么选？', { table: [['选项', '模型', '首次下载', '适合'], ['快速', 'Whisper tiny', '约 40 MB', '清晰的讲话、快速出草稿、手机'], ['均衡', 'Whisper base', '约 80 MB', '大多数视频（默认）'], ['最佳', 'Whisper small', '约 250 MB', '口音、背景噪音、中文等非英语内容']] }, '模型首次使用后会保存在浏览器缓存里，之后处理视频可以立即开始 —— 断网也能用。'],
        ['速度有多快？', '在有显卡的 Chrome 或 Edge 中（WebGPU），10 分钟的视频通常 1–3 分钟就能识别完。没有显卡加速时用处理器运行，「快速」模式大约与视频时长相当。处理期间请保持页面打开。'],
        ['字幕文件怎么用', { list: ['B 站：投稿时在「字幕」中上传 SRT。', '剪映、Premiere、达芬奇、Final Cut：把 SRT 导入为字幕轨道。', 'VLC 等播放器：把 SRT 和视频放在一起并使用相同文件名。', '抖音、视频号：把字幕压制进视频最稳妥。'] }],
        ['两个「翻译」有什么区别？', '「翻译成英文」是 Whisper 自带的功能：把任何语言的讲话直接识别为英文字幕。编辑器里的「翻译」面板是第二步：用 OPUS-MT 机器翻译模型把做好的字幕翻译成另外 11 种语言，可选双语模式让原文和译文分两行显示。日常内容的翻译质量不错，发布前建议通读一遍。'],
      ],
      faq: [
        ['这个 AI 字幕工具真的免费吗？', '是的。无需注册、没有水印、不限时长，因为 AI 在你的设备上运行，而不是付费的服务器。'],
        ['视频会被上传到云端吗？', '不会。只会从 Hugging Face（或其国内镜像）下载 AI 模型文件，你的音频和视频都留在你的设备上。'],
        ['支持哪些语言？', 'Whisper 可识别约 99 种语言，包括中文（普通话、粤语）、英语、日语、韩语、西班牙语、法语、德语、俄语、葡萄牙语、阿拉伯语、印地语、越南语等。'],
        ['能翻译字幕吗？', '能，有两种方式。生成前勾选「翻译成英文」，可把任何语言的讲话直接识别成英文字幕；生成后编辑器里的「翻译」面板可用 OPUS-MT 模型把字幕翻译成 12 种语言，勾选「保留原文」就是双语字幕。'],
        ['能把我已有的 SRT 字幕加到视频上吗？', '可以。选好视频后点击「导入 SRT/VTT 文件」，需要的话修改一下，然后压制进视频。'],
        ['为什么有些中文字幕是繁体？', 'Whisper 有时会用繁体字写普通话。LocalKit 会自动把结果转换为简体中文；如果需要繁体，可以在「更多选项」中切换。'],
      ],
      ui: {
        drop: '拖入视频或音频文件', dropHint: 'MP4、MOV、MKV、WebM、MP3、M4A、WAV · 文件不离开你的设备',
        language: '说话的语言', accuracy: '准确度', aFast: '快速', aFastSub: '40 MB', aBal: '均衡', aBalSub: '80 MB', aBest: '最佳', aBestSub: '250 MB',
        translate: '翻译成英文', more: '更多选项', engine: '计算方式', eAuto: '自动（有显卡时使用显卡）', eCpu: '仅用处理器',
        script: '中文字形', simp: '简体', trad: '繁体（按识别结果）',
        generate: '生成字幕', importSrt: '改为导入 SRT/VTT 字幕文件', reading: '正在读取音频…', connecting: '正在连接模型服务器…',
        downloading: '正在下载 AI 模型（仅首次）', loadingModel: '正在启动 AI 模型…', transcribing: '正在识别语音…', fallback: '没有可用的显卡，改用处理器（较慢）。',
        noSpeech: '这个文件中没有识别到语音。', doneGen: '已生成 $1 条字幕，用时 $2（$3）。', live: '实时识别',
        editorTitle: '字幕', shift: '整体平移', shiftApply: '应用', seconds: '秒', add: '添加字幕', del: '删除', merge: '与下一条合并', split: '在光标处拆分',
        exportTitle: '下载字幕', srt: 'SRT', vtt: 'VTT', txt: '纯文本',
        burnTitle: '把字幕压制进视频', size: '字号', sizeS: '小', sizeM: '中', sizeL: '大', style: '样式', styleOutline: '描边', styleBox: '底框', position: '位置', posBottom: '底部', posTop: '顶部',
        burn: '压制进视频（MP4）', burning: '正在生成带字幕的视频…', burned: '带字幕的视频已生成 · $1', downloadVideo: '下载视频', audioOnly: '这是音频文件，无法压制字幕，请下载 SRT。',
        trTitle: '翻译', trTo: '翻译成', trBi: '保留原文（双语字幕）', trGo: '翻译字幕', trLoading: '正在下载翻译模型（仅首次）· $1 / $2', trWorking: '正在翻译…', trDone: '字幕已翻译。', trSame: '字幕已经是这种语言了。',
        badSrt: '这个文件看起来不是 SRT 或 VTT 字幕。', imported: '已导入 $1 条字幕。', another: '换一个文件', newText: '新字幕',
      },
    },
  },
  ui: (s, c, lang) => html`
<div id="as-pick"></div>
<div id="as-work" class="panel" hidden>
  <div id="as-file"></div>
  <div id="as-setup" class="panel">
    <div class="opts">
      <label class="field"><span>${s.language}</span><select id="as-lang">${LANGS.map(([v, k]) => html`<option value="${v}"${(lang === 'zh' ? k === 'zh' : k === 'auto') ? ' selected' : ''}>${LANG_NAMES[lang][k]}</option>`)}</select></label>
      <div class="opt"><span class="field-label">${s.accuracy}</span><div class="chips" role="radiogroup" aria-label="${s.accuracy}">
        <label class="chip"><input type="radio" name="as-model" value="onnx-community/whisper-tiny"><span>${s.aFast} <small>${s.aFastSub}</small></span></label>
        <label class="chip"><input type="radio" name="as-model" value="onnx-community/whisper-base" checked><span>${s.aBal} <small>${s.aBalSub}</small></span></label>
        <label class="chip"><input type="radio" name="as-model" value="onnx-community/whisper-small"><span>${s.aBest} <small>${s.aBestSub}</small></span></label>
      </div></div>
    </div>
    <label class="check"><input type="checkbox" id="as-translate"> ${s.translate}</label>
    <details class="more"><summary>${s.more}</summary><div class="opts">
      <label class="field"><span>${s.engine}</span><select id="as-engine"><option value="auto">${s.eAuto}</option><option value="wasm">${s.eCpu}</option></select></label>
      <label class="field"><span>${s.script}</span><select id="as-script"><option value="simp">${s.simp}</option><option value="trad">${s.trad}</option></select></label>
    </div></details>
    <div class="actions"><button class="btn lg" id="as-go">${s.generate}</button><button class="btn ghost" id="as-import">${s.importSrt}</button><input type="file" id="as-srtfile" accept=".srt,.vtt,text/vtt" hidden></div>
  </div>
  <div id="as-alert"></div>
  <div id="as-task"></div>
  <div class="live" id="as-live" hidden></div>
  <div id="as-editor" class="panel" hidden>
    <div class="sub-editor">
      <div class="panel">
        <div class="player" id="as-player"></div>
        <div class="panel">
          <h3 style="margin:0">${s.exportTitle}</h3>
          <div class="actions"><button class="btn" id="as-srt">${s.srt}</button><button class="btn soft" id="as-vtt">${s.vtt}</button><button class="btn soft" id="as-txt">${s.txt}</button></div>
        </div>
        <div class="panel">
          <h3 style="margin:0">${s.trTitle}</h3>
          <div class="actions"><label class="inline-num">${s.trTo}<select id="as-trto" style="width:auto">${Object.entries(SUB_LANGS[lang]).filter(([k]) => k !== 'ko').map(([k, v]) => html`<option value="${k}"${k === (lang === 'zh' ? 'en' : 'zh') ? ' selected' : ''}>${v}</option>`)}</select></label>
            <label class="check small"><input type="checkbox" id="as-trbi" checked> ${s.trBi}</label><button class="btn soft" id="as-trgo">${s.trGo}</button></div>
          <div id="as-tr-task"></div>
        </div>
        <div class="panel" id="as-burnbox">
          <h3 style="margin:0">${s.burnTitle}</h3>
          <div class="opts">
            <div class="opt"><span class="field-label">${s.size}</span><div class="chips"><label class="chip"><input type="radio" name="as-size" value="0.8"><span>${s.sizeS}</span></label><label class="chip"><input type="radio" name="as-size" value="1" checked><span>${s.sizeM}</span></label><label class="chip"><input type="radio" name="as-size" value="1.3"><span>${s.sizeL}</span></label></div></div>
            <div class="opt"><span class="field-label">${s.style}</span><div class="chips"><label class="chip"><input type="radio" name="as-style" value="outline" checked><span>${s.styleOutline}</span></label><label class="chip"><input type="radio" name="as-style" value="box"><span>${s.styleBox}</span></label></div></div>
            <div class="opt"><span class="field-label">${s.position}</span><div class="chips"><label class="chip"><input type="radio" name="as-pos" value="bottom" checked><span>${s.posBottom}</span></label><label class="chip"><input type="radio" name="as-pos" value="top"><span>${s.posTop}</span></label></div></div>
          </div>
          <div class="actions"><button class="btn" id="as-burn">${s.burn}</button></div>
          <div id="as-burn-task"></div>
          <div id="as-burned"></div>
        </div>
      </div>
      <div class="panel">
        <div class="actions" style="justify-content:space-between"><h3 style="margin:0">${s.editorTitle} <span class="muted" id="as-count"></span></h3>
          <span class="inline-num"><span class="small muted">${s.shift}</span><input type="number" id="as-shift" step="0.1" value="0" style="width:5.5em" aria-label="${s.shift}">${s.seconds}<button class="btn ghost sm" id="as-shift-go">${s.shiftApply}</button></span></div>
        <div class="sub-list" id="as-list"></div>
        <div class="actions"><button class="btn ghost sm" id="as-add">+ ${s.add}</button><button class="btn ghost sm" id="as-another">${s.another}</button></div>
      </div>
    </div>
  </div>
</div>`,
};
