import { html } from '../../build/html.mjs';

export default {
  id: 'image-to-text', category: 'image', iconName: 'scan-text', color: '#0d9488',
  related: ['scan-to-pdf', 'compare-text', 'remove-background'], appCategory: 'ProductivityApplication',
  strings: {
    en: {
      name: 'Image to Text', short: 'Extract editable English and Chinese text from screenshots and photos, privately.',
      keywords: ['image to text', 'OCR online', 'extract text from image', 'screenshot to text', 'Chinese OCR', 'copy text from image'],
      title: 'Image to Text — Free English & Chinese OCR Online',
      desc: 'Extract English and Chinese text from images with free browser OCR. Paste screenshots, process a batch, edit the result and copy or download text privately.',
      h1: 'Image to text', sub: 'Paste a screenshot or drop photos, choose the text language, and extract editable text. Your images stay on your device.',
      features: [
        ['clipboard-paste', 'Paste a screenshot', 'Use Ctrl+V or ⌘V to add an image from your clipboard, or drop several files at once.'],
        ['languages', 'English and Chinese', 'Recognize English, simplified Chinese or traditional Chinese. Chinese modes also recognize English.'],
        ['shield-check', 'Local processing', 'Tesseract runs in a browser worker. The recognition engine and language files are served by this site; images are never uploaded.'],
      ],
      howToTitle: 'How to extract text from an image',
      steps: ['Drop images or paste a screenshot. Choose the language used in the image.', 'Select Extract text. The first run downloads the OCR engine and the selected language data, then processes the batch.', 'Check the highlighted lines against the editable text. Copy or download individual results, or use the combined batch text.'],
      guide: [
        ['Choose the right language', 'Use English for Latin text. Choose simplified or traditional Chinese for Chinese screenshots; both modes include English. Matching the language improves accuracy.'],
        ['Get more accurate results', 'Use sharp, upright images with dark text on a light background. Small type, handwriting, curved text, complicated tables and low contrast reduce accuracy. Crop unnecessary margins before recognition. Images over 4096 pixels on the long edge are resized.'],
        ['Read the highlighted preview', 'Teal rectangles show detected text lines. The output is plain text, so columns and tables may need manual rearrangement. Review names, dates and numbers before reusing the text.'],
      ],
      faq: [
        ['Is this OCR tool free?', 'Yes. No account, watermark or usage quota is required. Processing speed depends on your device.'],
        ['Are my screenshots uploaded?', 'No. Only the OCR program and language data are downloaded from this website. Recognition happens in a local browser worker.'],
        ['Does it work in mainland China?', 'The worker, WebAssembly engine and English and Chinese language data are hosted alongside this site. OCR has no dependency on Google, jsDelivr or an overseas model CDN; you still need access to this website.'],
        ['Can I recognize handwriting or PDFs?', 'This tool works best with printed text in images. Handwriting is unreliable. For PDFs, first export pages with PDF to JPG and add the images here.'],
        ['Why is the first run slower?', 'The browser loads the WebAssembly engine and selected language files. Language data is cached when browser storage is available. You can cancel processing and retry.'],
        ['Can I edit and combine results?', 'Yes. Each image has an editable text area and individual copy and TXT controls. For multiple images, the combined text area contains filenames and their recognized text.'],
      ],
      ui: { drop: 'Drop images or paste a screenshot', dropHint: 'JPG, PNG, WebP, HEIC · Ctrl+V / ⌘V · batch supported', add: 'Add more images', language: 'Text language', english: 'English', simplified: 'Simplified Chinese + English', traditional: 'Traditional Chinese + English', go: 'Extract text', loading: 'Loading the OCR engine and language data…', recognizing: 'Recognizing text…', pending: 'Ready to extract text', textLabel: 'Recognized text: $1', recognized: '$1 text lines detected · review and edit below', empty: 'No text detected. Try a sharper, upright image or another language.', copy: 'Copy text', txt: 'Download TXT', combined: 'Combined text', copyAll: 'Copy combined text', downloadAll: 'Download combined TXT', clear: 'Clear all', hint: 'First use downloads the OCR engine and selected language data. Everything runs on this device; you can cancel at any time.' },
    },
    zh: {
      name: '图片转文字', short: '识别截图、照片中的简繁中文和英文，编辑、复制或下载文本，不上传图片。',
      keywords: ['图片转文字', '图片文字识别', '截图识别文字', '在线 OCR', '提取图片文字', '繁体中文识别'],
      title: '图片转文字 — 免费在线 OCR，识别中英文截图',
      desc: '免费在线图片转文字工具，在浏览器本地识别截图、照片和扫描件中的简体中文、繁体中文与英文。支持粘贴截图、批量识别、检测框预览、编辑结果、复制文字和下载 TXT，图片无需上传。',
      h1: '图片转文字', sub: '粘贴截图或拖入照片，选择文字语言，即可提取可编辑文本。图片始终留在你的设备上。',
      features: [
        ['clipboard-paste', '直接粘贴截图', '使用 Ctrl+V 或 ⌘V 粘贴剪贴板图片，也可以一次拖入多张图片。'],
        ['languages', '简繁中文与英文', '支持英文、简体中文和繁体中文；中文模式也能同时识别英文。'],
        ['shield-check', '本地识别，不上传', 'Tesseract 在浏览器工作线程中运行。识别引擎和语言文件由本站提供，图片不会上传。'],
      ],
      howToTitle: '如何提取图片中的文字',
      steps: ['拖入图片或粘贴截图，选择图片中使用的文字语言。', '点击「提取文字」。首次使用会下载识别引擎和所选语言数据，随后依次处理图片。', '对照标出的文字行检查并编辑识别结果，可逐张复制或下载，也能使用批量合并文本。'],
      guide: [
        ['选择正确的识别语言', '纯英文图片请选择英文。中文截图请选择简体中文或繁体中文，两种中文模式都包含英文。语言匹配有助于提高准确率。'],
        ['怎样提高准确率', '尽量使用清晰、方向端正、浅底深色文字的图片。字号太小、手写字、弯曲文字、复杂表格和低对比度都会影响识别。可以先裁掉无关边缘。长边超过 4096 像素的图片会被缩小。'],
        ['查看检测框和文本', '青绿色方框标出检测到的文字行。导出的是纯文本，多栏内容和表格可能需要手动调整顺序。姓名、日期和数字请在使用前核对。'],
      ],
      faq: [
        ['图片转文字需要付费吗？', '免费使用，无需账号，没有水印或使用次数配额。识别速度取决于设备性能。'],
        ['截图会被上传吗？', '不会。浏览器只从本站下载识别程序和语言数据，识别在本机工作线程中完成。'],
        ['在中国大陆可以使用吗？', '工作线程、WebAssembly 引擎及中英文语言数据随本站一起托管，不依赖 Google、jsDelivr 或境外模型 CDN。只要能够访问本站并加载资源即可使用。'],
        ['能识别手写字和 PDF 吗？', '本工具更适合图片中的印刷文字，手写识别不稳定。PDF 可以先用「PDF 转图片」导出页面，再到这里识别。'],
        ['为什么首次识别较慢？', '浏览器需要加载 WebAssembly 引擎和所选语言文件。浏览器存储可用时会缓存语言数据。处理过程中可以取消并重试。'],
        ['结果可以编辑和批量合并吗？', '可以。每张图片都有可编辑文本框，支持单独复制和下载 TXT。多张图片识别完成后还会显示包含文件名的合并文本。'],
      ],
      ui: { drop: '拖入图片，或直接粘贴截图', dropHint: 'JPG、PNG、WebP、HEIC · Ctrl+V / ⌘V · 支持批量', add: '继续添加图片', language: '文字语言', english: '英文', simplified: '简体中文 + 英文', traditional: '繁体中文 + 英文', go: '提取文字', loading: '正在加载 OCR 引擎和语言数据…', recognizing: '正在识别文字…', pending: '等待提取文字', textLabel: '识别文本：$1', recognized: '检测到 $1 行文字 · 请核对并编辑结果', empty: '未检测到文字，请尝试更清晰、方向端正的图片或切换语言。', copy: '复制文字', txt: '下载 TXT', combined: '合并文本', copyAll: '复制合并文本', downloadAll: '下载合并 TXT', clear: '全部清除', hint: '首次使用会下载 OCR 引擎和所选语言数据。所有识别均在本机进行，可以随时取消。' },
    },
  },
  ui: (s, c, lang) => html`
<div class="panel"><div class="opts"><label class="field opt"><span>${s.language}</span><select id="ocr-lang"><option value="eng" ${lang === 'en' ? 'selected' : ''}>${s.english}</option><option value="chi_sim+eng" ${lang === 'zh' ? 'selected' : ''}>${s.simplified}</option><option value="chi_tra+eng">${s.traditional}</option><option value="fra">Français</option><option value="deu">Deutsch</option><option value="spa">Español</option></select></label></div><p class="hint">${s.hint}</p><div id="ocr-pick"></div></div>
<div id="ocr-alert"></div><div id="ocr-work" class="panel" hidden><div class="actions"><button class="btn lg" id="ocr-go">${s.go}</button><button class="btn ghost" id="ocr-clear">${s.clear}</button></div><div id="ocr-task"></div><div id="ocr-list"></div><section id="ocr-combined" hidden><h2>${s.combined}</h2><textarea id="ocr-all" class="ocr-text" aria-label="${s.combined}"></textarea><div class="actions"><button class="btn" id="ocr-download-all">${s.downloadAll}</button><button class="btn ghost" id="ocr-copy-all">${s.copyAll}</button></div></section><div id="ocr-more"></div></div>`,
};
