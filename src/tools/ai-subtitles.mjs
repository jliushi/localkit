import { html } from '../../build/html.mjs';

const LANGS = [
  ['', 'auto'], ['chinese', 'zh'], ['english', 'en'], ['cantonese', 'yue'], ['japanese', 'ja'], ['korean', 'ko'], ['spanish', 'es'], ['french', 'fr'],
  ['german', 'de'], ['russian', 'ru'], ['portuguese', 'pt'], ['italian', 'it'], ['vietnamese', 'vi'], ['thai', 'th'], ['indonesian', 'id'],
  ['arabic', 'ar'], ['hindi', 'hi'], ['turkish', 'tr'], ['dutch', 'nl'], ['polish', 'pl'],
];
const LANG_NAMES = {
  en: { auto: 'Detect automatically', zh: 'Chinese (Mandarin)', en: 'English', yue: 'Cantonese', ja: 'Japanese', ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', pt: 'Portuguese', it: 'Italian', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', nl: 'Dutch', pl: 'Polish' },
  zh: { auto: '自动识别', zh: '中文（普通话）', en: '英语', yue: '粤语', ja: '日语', ko: '韩语', es: '西班牙语', fr: '法语', de: '德语', ru: '俄语', pt: '葡萄牙语', it: '意大利语', vi: '越南语', th: '泰语', id: '印尼语', ar: '阿拉伯语', hi: '印地语', tr: '土耳其语', nl: '荷兰语', pl: '波兰语' },
};

export default {
  id: 'ai-subtitles',
  category: 'ai',
  icon: 'CC',
  color: '#16a34a',
  strings: {
    en: {
      name: 'AI Subtitle Generator',
      title: 'AI Subtitle Generator — Auto Subtitles for Video, SRT Download, Free & Private',
      desc: 'Automatically generate subtitles for any video or audio with AI speech recognition (Whisper). 99 languages, edit and download SRT or VTT, or burn subtitles into the video. Runs in your browser — no upload.',
      h1: 'AI subtitle generator: automatic subtitles for videos',
      lead: 'Drop a video or audio file and AI speech recognition (OpenAI Whisper) writes timed subtitles in about 99 languages. Edit them, then download SRT/VTT or burn them into the video. The AI runs on your own device — your video is never uploaded.',
      steps: [
        'Drop a video or audio file (MP4, MOV, MKV, MP3, M4A, WAV…).',
        'Pick the spoken language (or auto-detect) and a model: Fast, Balanced or Accurate.',
        'Click Generate subtitles. The first run downloads the AI model once (40–250 MB), then it is cached.',
        'Fix any mistakes in the list, then download SRT / VTT / TXT, or click "Burn into video" to get an MP4 with subtitles.',
      ],
      faq: [
        ['Is it really free and private?', 'Yes. The Whisper model runs inside your browser using WebAssembly or your graphics card (WebGPU). Your audio is never sent anywhere; only the model files are downloaded from Hugging Face.'],
        ['How accurate is it?', 'Accuracy depends on the audio quality and model. "Balanced" works well for clear speech; "Accurate" handles accents, noise and Chinese better but is slower and downloads more. Always proofread names and numbers.'],
        ['How long does it take?', 'With a graphics card (Chrome/Edge with WebGPU) a 10-minute video usually takes 1–3 minutes. On CPU only, expect roughly real time with "Fast" and slower with larger models. Keep the tab open while it works.'],
        ['Can it translate subtitles into English?', 'Yes. Choose "Translate to English" and Whisper writes English subtitles for speech in any supported language.'],
        ['What is an SRT file?', 'SRT is the most common subtitle format. YouTube, Bilibili, Premiere Pro, Final Cut, CapCut, VLC and most players accept it. VTT is the web version of the same thing.'],
        ['Chinese subtitles come out in Traditional characters?', 'Whisper sometimes writes Mandarin in Traditional Chinese. Keep "Simplified Chinese output" checked and the subtitles are converted to Simplified characters.'],
      ],
      ui: {
        drop: 'Drop a video or audio file here or click to choose', dropSub: 'MP4, MOV, MKV, WebM, MP3, M4A, WAV… · files never leave your device',
        language: 'Spoken language', task: 'Output', transcribe: 'Subtitles in the spoken language', translate: 'Translate to English',
        model: 'AI model', mFast: 'Fast (≈40 MB download)', mBalanced: 'Balanced (≈80 MB)', mAccurate: 'Accurate (≈250 MB)',
        engine: 'Engine', eAuto: 'Auto (graphics card if available)', eCpu: 'CPU only', simplified: 'Simplified Chinese output',
        generate: 'Generate subtitles', decoding: 'Reading the audio track…', checkingHost: 'Connecting to the model server…',
        downloading: 'Downloading the AI model (first time only): $1 of $2', loadingModel: 'Starting the AI model…',
        transcribing: 'Recognising speech… $1', done: '$1 subtitles generated in $2.', fallback: 'No usable graphics card — using the CPU (slower).',
        noSpeech: 'No speech was recognised in this file.', segments: 'Subtitles (click a time to jump there; edit text directly)',
        dlSrt: '⬇ SRT', dlVtt: '⬇ VTT', dlTxt: '⬇ TXT', burn: 'Burn into video (MP4)', burnSize: 'Text size', burnPos: 'Position', posBottom: 'Bottom', posTop: 'Top',
        burnLoading: 'Loading the video engine…', burning: 'Rendering video with subtitles… $1', burnDone: 'Video with subtitles is ready ($1).', audioOnly: 'Burning subtitles needs a video file.',
        tooLong: 'This file is longer than 3 hours; please split it first.', engineInfo: 'Engine: $1', live: 'Live transcript:',
      },
    },
    zh: {
      name: 'AI 字幕生成',
      title: 'AI 自动生成字幕 — 视频语音转字幕，SRT 下载，免费且不上传',
      desc: '用 AI 语音识别（Whisper）自动为视频或音频生成字幕，支持中文、英文等 99 种语言，可编辑并下载 SRT、VTT，或把字幕压制进视频。在浏览器本地运行，不上传。',
      h1: 'AI 字幕生成：视频自动加字幕',
      lead: '拖入视频或音频，AI 语音识别（OpenAI Whisper）自动写出带时间轴的字幕，支持约 99 种语言。可以逐句修改，下载 SRT/VTT，或直接压制进视频。AI 在你自己的设备上运行，视频绝不上传。',
      steps: [
        '拖入视频或音频文件（MP4、MOV、MKV、MP3、M4A、WAV 等）。',
        '选择说话的语言（或自动识别）和模型：快速、均衡或精准。',
        '点击「生成字幕」。首次使用会下载一次 AI 模型（40–250 MB），之后会被缓存。',
        '在列表中修正错误，然后下载 SRT / VTT / TXT，或点击「压制进视频」得到带字幕的 MP4。',
      ],
      faq: [
        ['真的免费、不上传吗？', '是的。Whisper 模型通过 WebAssembly 或显卡（WebGPU）在你的浏览器里运行，音频不会发送到任何地方，只会从 Hugging Face 下载模型文件。'],
        ['识别准确吗？', '准确度取决于音质和模型。「均衡」适合清晰的讲话；「精准」对口音、噪音和中文效果更好，但更慢、下载更大。人名和数字建议人工校对。'],
        ['需要多长时间？', '有显卡时（Chrome/Edge 支持 WebGPU），10 分钟的视频通常 1–3 分钟完成。只用 CPU 时，「快速」模型大约与视频时长相当，更大的模型会更慢。处理期间请保持页面打开。'],
        ['可以翻译成英文字幕吗？', '可以。选择「翻译成英文」，Whisper 会把任何支持语言的讲话直接写成英文字幕。'],
        ['什么是 SRT 文件？', 'SRT 是最通用的字幕格式，YouTube、B 站、剪映、Premiere、Final Cut、VLC 等几乎都支持。VTT 是网页上使用的同类格式。'],
        ['中文字幕出现繁体字怎么办？', 'Whisper 有时会用繁体字写普通话。保持勾选「输出简体中文」，字幕会自动转换为简体。'],
      ],
      ui: {
        drop: '把视频或音频文件拖到这里，或点击选择', dropSub: 'MP4、MOV、MKV、WebM、MP3、M4A、WAV… · 文件不会离开你的设备',
        language: '说话的语言', task: '输出', transcribe: '原语言字幕', translate: '翻译成英文',
        model: 'AI 模型', mFast: '快速（约 40 MB 下载）', mBalanced: '均衡（约 80 MB）', mAccurate: '精准（约 250 MB）',
        engine: '计算方式', eAuto: '自动（可用时使用显卡）', eCpu: '仅 CPU', simplified: '输出简体中文',
        generate: '生成字幕', decoding: '正在读取音轨…', checkingHost: '正在连接模型服务器…',
        downloading: '正在下载 AI 模型（仅首次）：$1 / $2', loadingModel: '正在启动 AI 模型…',
        transcribing: '正在识别语音… $1', done: '已生成 $1 条字幕，用时 $2。', fallback: '没有可用的显卡，改用 CPU（较慢）。',
        noSpeech: '这个文件中没有识别到语音。', segments: '字幕（点击时间可跳转，直接修改文字）',
        dlSrt: '⬇ SRT', dlVtt: '⬇ VTT', dlTxt: '⬇ TXT', burn: '压制进视频（MP4）', burnSize: '字号', burnPos: '位置', posBottom: '底部', posTop: '顶部',
        burnLoading: '正在加载视频引擎…', burning: '正在生成带字幕的视频… $1', burnDone: '带字幕的视频已生成（$1）。', audioOnly: '压制字幕需要视频文件。',
        tooLong: '文件超过 3 小时，请先分割。', engineInfo: '计算方式：$1', live: '实时识别：',
      },
    },
  },
  ui: (s, c, lang) => html`
<div class="dropzone" id="as-drop"><strong>${s.drop}</strong>${s.dropSub}</div>
<div class="media-box" id="as-preview" hidden><video id="as-video" controls playsinline crossorigin="anonymous"></video><div class="muted small" id="as-info"></div></div>
<div class="fields">
  <label class="field"><span>${s.language}</span><select id="as-lang">${LANGS.map(([v, k]) => html`<option value="${v}"${(lang === 'zh' ? k === 'zh' : k === 'auto') ? ' selected' : ''}>${LANG_NAMES[lang][k]}</option>`)}</select></label>
  <label class="field"><span>${s.task}</span><select id="as-task"><option value="transcribe">${s.transcribe}</option><option value="translate">${s.translate}</option></select></label>
  <label class="field"><span>${s.model}</span><select id="as-model"><option value="onnx-community/whisper-tiny">${s.mFast}</option><option value="onnx-community/whisper-base" selected>${s.mBalanced}</option><option value="onnx-community/whisper-small">${s.mAccurate}</option></select></label>
  <label class="field"><span>${s.engine}</span><select id="as-engine"><option value="auto">${s.eAuto}</option><option value="wasm">${s.eCpu}</option></select></label>
  <label class="check"><input type="checkbox" id="as-simp" checked> ${s.simplified}</label>
</div>
<div class="row"><button class="btn big" id="as-go" disabled>${s.generate}</button></div>
<div class="status" id="as-status" hidden></div>
<div class="progress" id="as-progress" hidden><span></span></div>
<p class="muted small" id="as-live" hidden></p>
<div id="as-out" hidden>
  <h3>${s.segments}</h3>
  <div class="segments" id="as-segs"></div>
  <div class="row"><button class="btn" id="as-srt">${s.dlSrt}</button><button class="btn secondary" id="as-vtt">${s.dlVtt}</button><button class="btn secondary" id="as-txt">${s.dlTxt}</button></div>
  <div class="fields" id="as-burn-opts">
    <label class="field"><span>${s.burnSize}</span><select id="as-bsize"><option value="0.8">S</option><option value="1" selected>M</option><option value="1.3">L</option></select></label>
    <label class="field"><span>${s.burnPos}</span><select id="as-bpos"><option value="bottom">${s.posBottom}</option><option value="top">${s.posTop}</option></select></label>
  </div>
  <div class="row"><button class="btn" id="as-burn">${s.burn}</button></div>
  <div class="media-box" id="as-burned"></div>
</div>`,
};
