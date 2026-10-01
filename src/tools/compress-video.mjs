import { html } from '../../build/html.mjs';

export default {
  id: 'compress-video',
  category: 'video',
  iconName: 'shrink',
  color: '#4f46e5',
  related: ['trim-video', 'convert-video', 'video-to-mp3'],
  strings: {
    en: {
      name: 'Compress Video',
      short: 'Shrink MP4, MOV and other videos to a target size, keeping good quality.',
      keywords: ['reduce video size', 'video compressor', 'mp4', 'mov', 'smaller', 'email', 'discord', 'whatsapp', 'make video smaller', 'compress mp4'],
      title: 'Compress Video Online Free — MP4/MOV to 10/25 MB, No Upload',
      desc: 'Free video compressor: target a size like 10 MB or 25 MB, keep the best quality that fits. MP4, MOV, MKV, WebM — fast hardware encoding in the browser. No upload, no watermark.',
      h1: 'Compress video to a smaller file size',
      sub: 'Compress Video is a free online video compressor: drop an MP4 or MOV, choose a target size like 10 MB for Discord or 25 MB for e-mail, and get the sharpest video that fits. It runs with hardware encoding on your own device — fast, and nothing is uploaded.',
      features: [
        ['target', 'Hit an exact size', 'Pick a preset or type any size in MB. The bitrate and resolution are calculated so the result lands just under your limit.'],
        ['zap', 'Hardware-fast', 'Uses your graphics chip\'s H.264 encoder through WebCodecs. A one-minute 1080p phone video usually compresses in under a minute.'],
        ['shield-check', 'Private and unlimited', 'The video never leaves your device. No sign-up, no watermark, no daily limit, no file-size cap.'],
      ],
      howToTitle: 'How to compress a video',
      steps: [
        'Drop a video (MP4, MOV, MKV, WebM…) onto the box, or tap to choose one from your phone.',
        'Choose a target size. "Recommended" keeps excellent quality; 25 MB or 10 MB guarantee the file fits common limits.',
        'Press Compress. When it finishes, compare the sizes, preview the result and download the MP4.',
      ],
      guide: [
        ['What size limits do popular apps have?', 'Common upload limits worth knowing:', { table: [['Where', 'Limit', 'Pick'], ['Gmail / Outlook attachment', '25 MB / 20 MB', '20 MB'], ['Discord (free)', '10 MB', '10 MB'], ['WhatsApp (as video)', '16 MB', '16 MB (custom)'], ['Most web forms', '5–50 MB', 'Custom']] }, 'Limits change from time to time — if an upload still fails, choose a slightly smaller target.'],
        ['How the compressor chooses quality', 'Video size is roughly bitrate × duration. LocalKit works out the highest bitrate that fits your target (minus the audio), then lowers the resolution only when needed so the picture stays sharp instead of blocky. A 3-minute video squeezed into 10 MB is shown at 480p rather than as a blurry 1080p.'],
        ['Tips for the best result', { list: ['Trim away parts you don\'t need first with the Trim Video tool — a shorter video can keep a much higher quality at the same size.', 'Screen recordings and slides compress extremely well; fast action, rain or confetti need more bits.', 'If the result must play everywhere, keep the default MP4 (H.264 + AAC) output.'] }],
      ],
      faq: [
        ['How do I compress a video without losing quality?', 'Choose "Recommended". It lowers the bitrate to a level where most people can\'t see a difference, typically saving 50–80% on phone videos. Only choose a small fixed size when you need to fit a limit.'],
        ['How can I reduce a video to under 25 MB (or 10 MB)?', 'Drop the video, choose the 25 MB or 10 MB preset and press Compress. The result is calculated to land just under that size.'],
        ['Is this video compressor really free?', 'Yes — no sign-up, no watermark, no limits. Your own device does the work, so there is no server cost.'],
        ['Is my video uploaded to a server?', 'No. The video is read and encoded inside your browser. You can even disconnect from the internet after the page has loaded.'],
        ['Which formats are supported?', 'MP4, MOV (iPhone), M4V, MKV, WebM and 3GP are compressed with fast hardware encoding. AVI, FLV and WMV also work using a slower compatibility engine. The output is MP4 (H.264 video, AAC audio), which plays everywhere.'],
        ['Why is the result a little different from the target size?', 'Encoders control size approximately. LocalKit aims slightly below the target so the file still fits; very short or very simple videos may come out smaller than requested.'],
      ],
      ui: {
        drop: 'Drop a video here', dropHint: 'MP4, MOV, MKV, WebM, AVI · stays on your device',
        target: 'Target size', recommended: 'Recommended', recSub: '≈ $1', custom: 'Custom', mb: 'MB',
        resolution: 'Resolution', resAuto: 'Automatic (best for the size)', resOriginal: 'Original ($1)',
        more: 'More options', removeAudio: 'Remove audio', estimate: 'Output: about <b>$1</b> · $2 · $3 video bitrate',
        compress: 'Compress video', compressing: 'Compressing…', preparing: 'Reading video…', legacy: 'This format uses the compatibility engine, which is slower than usual.',
        done: 'Done! Your video is $1 smaller.', notSmaller: 'The original is already very efficient — the compressed file is not smaller. Try a lower target size or resolution.',
        tooSmall: 'That target is too small for a video this long. Try at least $1.', alreadySmall: 'This video is already smaller than $1.',
        before: 'Before', after: 'After', saved: 'Saved', downloadMp4: 'Download MP4', tryOther: 'Compress another video', retune: 'Change settings',
      },
    },
    zh: {
      name: '视频压缩',
      short: '把 MP4、MOV 等视频压缩到指定大小，画质依然清晰。',
      keywords: ['压缩视频', '视频压缩软件', '视频变小', '减小视频大小', 'mp4 压缩', 'mov', '微信', '邮件', '视频太大怎么压缩', '在线压缩视频'],
      title: '视频压缩 — 在线压缩 MP4/MOV 到 10MB、25MB，免费不上传',
      desc: '免费在线视频压缩：选择目标大小（如 10MB、25MB），自动得到能放下的最好画质。支持 MP4、MOV、MKV、WebM。硬件加速，在浏览器本地压缩，不上传、无水印。',
      h1: '在线压缩视频，指定文件大小',
      sub: '视频压缩是一个免费的在线压缩工具：拖入 MP4 或 MOV，选择一个目标大小 —— 比如发邮件 25MB、发 Discord 10MB —— 就能得到放得下的最清晰的视频。压缩在你的设备上用硬件编码完成，速度快，也不会上传任何内容。',
      features: [
        ['target', '精准控制大小', '选择预设或输入任意 MB 数，自动计算码率和分辨率，让结果刚好低于你的限制。'],
        ['zap', '硬件加速，速度快', '通过 WebCodecs 调用显卡的 H.264 编码器。手机拍的一分钟 1080p 视频通常不到一分钟就能压缩完。'],
        ['shield-check', '私密且不限量', '视频不会离开你的设备。无需注册、没有水印、不限次数、不限文件大小。'],
      ],
      howToTitle: '如何压缩视频',
      steps: [
        '把视频（MP4、MOV、MKV、WebM 等）拖到框里，手机上点击即可从相册选择。',
        '选择目标大小。「推荐」能保持很好的画质；25MB 或 10MB 可以确保符合常见的上传限制。',
        '点击「压缩视频」。完成后对比大小、预览效果并下载 MP4。',
      ],
      guide: [
        ['常见平台的大小限制', '上传前可以参考这些常见限制：', { table: [['平台', '限制', '建议选择'], ['Gmail / Outlook 附件', '25MB / 20MB', '20MB'], ['Discord（免费）', '10MB', '10MB'], ['WhatsApp（作为视频发送）', '16MB', '自定义 16MB'], ['大多数网页表单', '5–50MB', '自定义']] }, '各平台的限制可能会调整 —— 如果上传仍然失败，选一个稍小一点的目标即可。'],
        ['压缩器如何选择画质', '视频大小约等于「码率 × 时长」。LocalKit 会先算出在目标大小内（扣除音频）能用的最高码率，只在必要时才降低分辨率，让画面保持清晰而不是满屏马赛克。比如把 3 分钟视频压到 10MB，会输出 480p，而不是模糊的 1080p。'],
        ['获得最佳效果的小技巧', { list: ['先用「视频剪切」去掉不需要的部分 —— 视频越短，同样大小下画质越高。', '录屏和幻灯片类视频非常好压缩；快速运动、下雨、彩带等画面需要更多码率。', '如果需要在所有设备上播放，保持默认的 MP4（H.264 + AAC）输出即可。'] }],
      ],
      faq: [
        ['怎样压缩视频又不损失画质？', '选择「推荐」。它把码率降到大多数人看不出差别的水平，手机拍的视频通常能减小 50–80%。只有需要满足大小限制时，才选择固定的小尺寸。'],
        ['怎么把视频压缩到 25MB（或 10MB）以内？', '拖入视频，选择 25MB 或 10MB 预设，点击「压缩视频」，结果会刚好低于这个大小。'],
        ['这个视频压缩工具真的免费吗？', '是的 —— 无需注册、没有水印、不限次数。处理由你自己的设备完成，没有服务器成本。'],
        ['视频会被上传到服务器吗？', '不会。视频在你的浏览器内读取和编码。页面加载完成后，即使断开网络也能使用。'],
        ['支持哪些格式？', 'MP4、MOV（iPhone）、M4V、MKV、WebM、3GP 使用快速的硬件编码压缩；AVI、FLV、WMV 也能处理，但会使用较慢的兼容引擎。输出为 MP4（H.264 视频 + AAC 音频），所有设备都能播放。'],
        ['为什么结果和目标大小略有差别？', '编码器对大小的控制是近似的。LocalKit 会略低于目标值，确保文件能放下；很短或画面很简单的视频，结果可能比要求的更小。'],
      ],
      ui: {
        drop: '把视频拖到这里', dropHint: 'MP4、MOV、MKV、WebM、AVI · 文件不离开你的设备',
        target: '目标大小', recommended: '推荐', recSub: '约 $1', custom: '自定义', mb: 'MB',
        resolution: '分辨率', resAuto: '自动（按大小选择最佳）', resOriginal: '原始（$1）',
        more: '更多选项', removeAudio: '去除音频', estimate: '输出：约 <b>$1</b> · $2 · 视频码率 $3',
        compress: '压缩视频', compressing: '正在压缩…', preparing: '正在读取视频…', legacy: '该格式使用兼容引擎处理，速度会比平时慢。',
        done: '完成！视频缩小了 $1。', notSmaller: '原视频的编码已经很高效，压缩后并没有变小。可以试试更小的目标大小或分辨率。',
        tooSmall: '对这么长的视频来说目标太小了，请至少选择 $1。', alreadySmall: '这个视频本来就小于 $1。',
        before: '压缩前', after: '压缩后', saved: '节省', downloadMp4: '下载 MP4', tryOther: '压缩另一个视频', retune: '修改设置',
      },
    },
  },
  ui: (s) => html`
<div id="cv-pick"></div>
<div id="cv-work" class="panel" hidden>
  <div id="cv-file"></div>
  <div class="opts">
    <div class="opt">
      <span class="field-label">${s.target}</span>
      <div class="chips" id="cv-targets" role="radiogroup" aria-label="${s.target}"></div>
      <label class="inline-num" id="cv-custom-wrap" hidden><input type="number" id="cv-custom" min="1" step="1" inputmode="decimal" aria-label="${s.custom}"> ${s.mb}</label>
    </div>
    <label class="field opt"><span>${s.resolution}</span><select id="cv-res"></select></label>
  </div>
  <details class="more"><summary>${s.more}</summary><div><label class="check"><input type="checkbox" id="cv-mute"> ${s.removeAudio}</label></div></details>
  <div class="estimate" id="cv-est"></div>
  <div id="cv-alert"></div>
  <div class="actions"><button class="btn lg" id="cv-go">${s.compress}</button></div>
  <div id="cv-task"></div>
  <div id="cv-result"></div>
</div>`,
};
