import { html } from '../../build/html.mjs';

export default {
  id: 'remove-background',
  category: 'image',
  iconName: 'eraser',
  color: '#0d9488',
  related: ['compress-image', 'convert-image', 'image-to-text'],
  appCategory: 'DesignApplication',
  strings: {
    en: {
      name: 'Remove Background',
      short: 'Cut out people, products and pets with on-device AI — transparent PNG or a new colour.',
      keywords: ['remove background', 'background remover', 'transparent background', 'cut out image', 'remove bg', 'id photo background', 'change background color', 'png transparent', 'photo cutout'],
      title: 'Remove Background from Image — Free AI, No Upload',
      desc: 'Remove the background from photos with AI that runs in your browser: transparent PNG, or white, blue and red ID-photo backgrounds. Batch, ZIP, no upload, no watermark.',
      h1: 'Remove the background from an image',
      sub: 'Drop a photo and an open-source AI model cuts out the subject — a person, product, pet or object — right in your browser. Download a transparent PNG, or fill the background with white, blue, red or any colour for ID photos. Your pictures are never uploaded, and nothing is watermarked.',
      features: [
        ['sparkles', 'Real AI, on your device', 'An open segmentation model runs on your GPU (WebGPU) or CPU. It detects prominent subjects; hair, transparent materials and fine edges may need manual touch-up.'],
        ['images', 'Transparent or any colour', 'Get a transparent PNG, or fill the background with white, ID-photo blue, red or a custom colour and save it as PNG or JPG.'],
        ['shield-check', 'Private, no watermark', 'Photos are processed locally and never leave your device. The first use downloads the model once; after that it works from the browser cache.'],
      ],
      howToTitle: 'How to remove the background from a photo',
      steps: ['Drop one or more photos (JPG, PNG, WebP, HEIC), or paste them from the clipboard.', 'The first time, the AI model is downloaded and cached — a progress bar shows how much is left. Processing time depends on your device.', 'Drag the slider on a result to compare before and after. Pick a background colour if you need one, then download each image or all of them as a ZIP.'],
      guide: [
        ['Which model should I choose?', { table: [['Model', 'Best for', 'Download', 'Licence'], ['Any subject (U²-Net small)', 'People, products and animals with clear outlines', 'about 4.6 MB', 'Apache-2.0'], ['Portrait, fast (MODNet)', 'Photos of people only; quick and light', 'about 7 MB on CPU, about 26 MB with WebGPU', 'Apache-2.0']] },
          'The browser can cache model files to speed up later visits. Without WebGPU the CPU build is used, which is slower: expect several seconds to a minute per photo for the larger model, depending on your device.'],
        ['Making an ID or passport photo background', 'Many application forms want a plain white, blue or red background. Cut out the portrait, choose "Blue" or "Red" (or a custom colour that matches your requirement) and download as JPG or PNG. LocalKit does not crop to an official photo size or check compliance, so confirm the colour value and dimensions your authority asks for.'],
        ['Getting a cleaner cut-out', 'Use a photo where the subject is in focus and clearly separated from the background. Very busy scenes, glass, smoke and subjects that blend into their surroundings are hard for any model. Photos larger than 4096 px on the long side are scaled down first.'],
      ],
      faq: [
        ['How do I remove the background from a picture for free?', 'Drop the photo onto this page. The AI model cuts out the subject automatically and you can download a transparent PNG. There is no sign-up, no watermark and no limit on the number of photos.'],
        ['Are my photos uploaded to a server?', 'No. The picture is processed by a model running in your browser. Only model files are downloaded: the small general model comes from this site, and the portrait model from Hugging Face or its mirror; your photos stay on your device.'],
        ['Why does the first photo take so long?', 'The first run downloads the AI model: roughly 4.6 MB for "Any subject", and a few megabytes for "Portrait, fast". It is cached afterwards, so later photos start right away. The CPU path is slower than WebGPU.'],
        ['Which models and licences are used?', 'U²-Net small (Apache-2.0 licence) for any subject and MODNet (Apache-2.0) for portraits, both loaded through transformers.js. Both model licences permit commercial use; check your rights in the original image.'],
        ['Can I change the background to white, blue or red?', 'Yes. Pick a colour under "Background" — white, ID-photo blue, red or any custom colour — and download as PNG or JPG. Choose "Transparent" to keep the alpha channel.'],
        ['The cut-out has rough or missing parts. What can I do?', 'Try "Portrait, fast" for photos of people. The general model is lightweight and can miss fine details. Photos with low contrast between subject and background are difficult; a sharper, better-lit original gives a better result. AI cut-outs are never perfect, so check edges before you use them.'],
        ['Does it work on my phone?', 'Modern browsers with WebAssembly are supported. WebGPU accelerates compatible devices; otherwise processing uses the CPU. Limited memory, very large photos or unsupported image formats can still cause failures on phones.'],
      ],
      ui: {
        drop: 'Drop photos to remove the background', dropHint: 'JPG, PNG, WebP, HEIC · or paste · batch · stays on your device', add: 'Add more photos',
        model: 'Model', mBirefnet: 'Any subject (small model)', mModnet: 'Portrait, fast (small)', mHint: 'Any subject: Apache-2.0 licence, about 4.6 MB. Portrait: Apache-2.0, about 7–26 MB. Downloaded once, then cached.',
        bg: 'Background', bNone: 'Transparent', bWhite: 'White', bBlue: 'Blue', bRed: 'Red', bCustom: 'Custom', format: 'Save as', engine: 'Engine', eAuto: 'Auto (WebGPU if available)', eCpu: 'CPU only',
        connecting: 'Connecting…', loadingModel: 'Loading the AI model…', downloading: 'Downloading the AI model (first use only)', working: 'Removing background $1 of $2…', slowHint: 'On CPU this can take several seconds to a minute per photo.',
        fallback: 'WebGPU is not available here, switching to CPU.', processing: 'Processing…', queued: 'Waiting…',
        before: 'Original', after: 'Cut-out', compare: 'Compare', summary: '$1 of $2 done', done: 'Done: $1 photo(s) in $2 using $3.',
        zip: 'Download all (ZIP)', clear: 'Clear all', retry: 'Retry unfinished images',
      },
    },
    zh: {
      name: '图片抠图',
      short: '用本地 AI 一键去除背景，导出透明 PNG，或换成证件照底色。',
      keywords: ['抠图', '去除背景', '去背景', '透明背景', '证件照换底色', '在线抠图', '一键抠图', '图片去底', 'ai 抠图', 'png 透明'],
      title: '在线抠图去背景 — AI 一键去除图片背景，不上传',
      desc: '免费在线抠图：AI 在浏览器本地识别人像、商品、宠物并去除背景，导出透明 PNG，或换成白、蓝、红证件照底色。支持批量与 ZIP，不上传、无水印。',
      h1: '在线抠图：一键去除图片背景',
      sub: '拖入照片，开源 AI 模型会在你的浏览器里把人物、商品、宠物或物体抠出来。可以下载透明背景 PNG，也能换成白色、蓝色、红色或任意颜色，用于证件照换底色。图片不会上传，也没有水印。',
      features: [
        ['sparkles', '真正的 AI，本地运行', '开源分割模型在你的显卡（WebGPU）或 CPU 上运行，自动识别突出主体，发丝、透明材质和细小边缘可能需要进一步手工修整。'],
        ['images', '透明或任意底色', '导出透明 PNG，或把背景换成白色、证件照蓝色、红色及自定义颜色，并保存为 PNG 或 JPG。'],
        ['shield-check', '私密、无水印', '照片只在本机处理，不会离开你的设备。首次使用需下载一次模型，之后直接使用浏览器缓存。'],
      ],
      howToTitle: '如何给照片抠图去背景',
      steps: ['拖入一张或多张照片（JPG、PNG、WebP、HEIC），也可以从剪贴板粘贴。', '第一次使用会下载并缓存 AI 模型，进度条会显示剩余进度；每张照片的处理时间取决于设备性能。', '拖动结果上的滑块对比抠图前后；需要的话选择背景颜色，然后逐张下载或打包成 ZIP。'],
      guide: [
        ['该选哪个模型？', { table: [['模型', '适合', '下载大小', '许可证'], ['任意主体（U²-Net small）', '轮廓清楚的人物、商品和动物', '约 4.6 MB', 'Apache-2.0'], ['人像·快速（MODNet）', '只适合人像，速度快、体积小', 'CPU 约 7 MB，WebGPU 约 26 MB', 'Apache-2.0']] },
          '浏览器会尽量缓存模型文件，以加快后续访问。没有 WebGPU 时会用 CPU 版本，速度较慢：大模型每张照片可能需要几秒到一分钟，取决于你的设备。'],
        ['证件照换底色', '很多报名系统要求白底、蓝底或红底。先抠出人像，选择「蓝色」或「红色」（也可以用自定义颜色匹配具体色值），再保存为 JPG 或 PNG。LocalKit 不会裁剪成标准证件照尺寸，也不会检查是否合规，请自行确认主管部门要求的颜色值和尺寸。'],
        ['怎样抠得更干净', '尽量使用主体清晰、与背景区分明显的照片。背景很杂乱、玻璃、烟雾，或主体与背景颜色接近时，任何模型都比较难处理。长边超过 4096 像素的照片会先被缩小。'],
      ],
      faq: [
        ['怎样免费去除图片背景？', '把照片拖到本页面，AI 会自动抠出主体，你可以下载透明背景的 PNG。无需注册、没有水印，也不限制张数。'],
        ['我的照片会被上传到服务器吗？', '不会。图片由运行在浏览器里的模型处理。只会下载模型文件：通用轻量模型随本站提供，人像模型从 Hugging Face 或镜像站加载，你的照片始终留在本机。'],
        ['为什么第一张照片特别慢？', '首次使用要下载 AI 模型：「任意主体」约 4.6 MB，「人像·快速」只有几 MB。下载后会缓存，之后的照片可以立即处理；CPU 比 WebGPU 慢。'],
        ['用了哪些模型？许可证是什么？', '「任意主体」使用 U²-Net small（Apache-2.0 许可），「人像·快速」使用 MODNet（Apache-2.0 许可），都是通过 transformers.js 加载的开源模型。两个模型的许可证均允许商业使用；使用时仍需确认原图的相关权利。'],
        ['可以把背景换成白色、蓝色或红色吗？', '可以。在「背景」中选择白色、证件照蓝色、红色或自定义颜色，再保存为 PNG 或 JPG。选择「透明」则保留透明通道。'],
        ['抠出来的边缘粗糙或缺了一块，怎么办？', '人物照片可以试试「人像·快速」。通用模型体积较小，可能丢失细节。主体与背景对比度低的照片很难处理；原图越清晰、光线越好，结果越好。AI 抠图不可能百分之百完美，使用前请检查边缘。'],
        ['手机上能用吗？', '支持具备 WebAssembly 的现代浏览器。兼容设备可以使用 WebGPU，否则用 CPU 处理。手机内存不足、照片太大或图片格式不兼容时仍可能失败。'],
      ],
      ui: {
        drop: '拖入要抠图的照片', dropHint: 'JPG、PNG、WebP、HEIC · 也可粘贴 · 支持批量 · 文件不离开你的设备', add: '继续添加照片',
        model: '模型', mBirefnet: '任意主体（轻量模型）', mModnet: '人像·快速（体积小）', mHint: '任意主体：Apache-2.0 许可，约 4.6 MB。人像：Apache-2.0，约 7–26 MB。只下载一次，之后使用缓存。',
        bg: '背景', bNone: '透明', bWhite: '白色', bBlue: '蓝色', bRed: '红色', bCustom: '自定义', format: '保存为', engine: '运行方式', eAuto: '自动（有 WebGPU 就用）', eCpu: '仅 CPU',
        connecting: '正在连接…', loadingModel: '正在加载 AI 模型…', downloading: '正在下载 AI 模型（仅首次使用）', working: '正在抠图：第 $1 张，共 $2 张…', slowHint: '使用 CPU 时，每张照片可能需要几秒到一分钟。',
        fallback: '此设备不支持 WebGPU，已切换为 CPU。', processing: '处理中…', queued: '等待中…',
        before: '原图', after: '抠图', compare: '对比', summary: '已完成 $1 / $2 张', done: '完成：$1 张照片，用时 $2，使用 $3。',
        zip: '全部下载（ZIP）', clear: '全部清除', retry: '重试未完成图片',
      },
    },
  },
  ui: (s) => html`
<div id="rb-pick"></div>
<div id="rb-work" class="panel" hidden>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.model}</span><div class="chips">
      <label class="chip"><input type="radio" name="rb-m" value="u2netp" checked><span>${s.mBirefnet}</span></label>
      <label class="chip"><input type="radio" name="rb-m" value="modnet"><span>${s.mModnet}</span></label>
    </div><small class="hint">${s.mHint}</small></div>
    <div class="opt"><span class="field-label">${s.bg}</span><div class="chips">
      <label class="chip"><input type="radio" name="rb-bg" value="none" checked><span>${s.bNone}</span></label>
      <label class="chip"><input type="radio" name="rb-bg" value="#ffffff"><span><i class="sw" style="background:#fff"></i>${s.bWhite}</span></label>
      <label class="chip"><input type="radio" name="rb-bg" value="#438edb"><span><i class="sw" style="background:#438edb"></i>${s.bBlue}</span></label>
      <label class="chip"><input type="radio" name="rb-bg" value="#d9242b"><span><i class="sw" style="background:#d9242b"></i>${s.bRed}</span></label>
      <label class="chip"><input type="radio" name="rb-bg" value="custom"><span>${s.bCustom}</span></label>
    </div><label class="inline-num" id="rb-color-wrap" hidden><input type="color" id="rb-color" value="#e8f1ff" aria-label="${s.bCustom}"></label></div>
    <div class="opt" id="rb-fmt" hidden><span class="field-label">${s.format}</span><div class="chips">
      <label class="chip"><input type="radio" name="rb-f" value="png" checked><span>PNG</span></label>
      <label class="chip"><input type="radio" name="rb-f" value="jpg"><span>JPG</span></label>
    </div></div>
    <label class="field opt"><span>${s.engine}</span><select id="rb-engine"><option value="auto">${s.eAuto}</option><option value="cpu">${s.eCpu}</option></select></label>
  </div>
  <div id="rb-task"></div>
  <div id="rb-alert"></div>
  <div class="actions"><span class="estimate" id="rb-summary"></span><span style="flex:1"></span><button class="btn" id="rb-retry" hidden>${s.retry}</button><button class="btn" id="rb-zip" hidden>${s.zip}</button><button class="btn ghost sm" id="rb-clear">${s.clear}</button></div>
  <div class="out-grid rb-grid" id="rb-grid"></div>
  <div id="rb-more"></div>
</div>`,
};
