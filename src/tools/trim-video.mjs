import { html } from '../../build/html.mjs';

export default {
  id: 'trim-video',
  category: 'video',
  iconName: 'scissors',
  color: '#7c3aed',
  related: ['compress-video', 'video-to-gif', 'video-to-mp3'],
  strings: {
    en: {
      name: 'Trim Video',
      short: 'Cut the start and end off a video, instantly and without quality loss.',
      keywords: ['cut video', 'video cutter', 'clip', 'shorten', 'mp4 trimmer'],
      title: 'Trim Video Online Free — Cut MP4, MOV & WebM Clips Instantly, No Upload',
      desc: 'Cut a video to the part you need: drag the handles on the filmstrip, preview, and save in seconds without re-encoding or quality loss. MP4, MOV, MKV, WebM. Free, private, no watermark.',
      h1: 'Trim video — cut out the part you want',
      sub: 'Drag the yellow handles on the filmstrip, play the selection to check it, and save. The clip is cut without re-encoding, so it takes a second and looks exactly like the original.',
      features: [
        ['film', 'Visual filmstrip', 'See thumbnails of the whole video and drag the start and end handles. The preview jumps to the exact frame under the handle.'],
        ['zap', 'Instant and lossless', 'The video stream is copied, not re-encoded, so even a long recording is trimmed in seconds with no loss of quality.'],
        ['keyboard', 'Precise controls', 'Type exact times, nudge handles with the arrow keys (Shift for 1 s), and press I / O to set start and end at the playhead.'],
      ],
      howToTitle: 'How to trim a video',
      steps: [
        'Drop a video file on the box (or tap to pick one on your phone).',
        'Drag the yellow handles to the start and end you want — or play the video and press "Set to playhead".',
        'Press "Play selection" to check, then "Trim video" and download the clip.',
      ],
      guide: [
        ['Keyboard shortcuts', { table: [['Key', 'Action'], ['Space', 'Play / pause'], ['I', 'Set start at the playhead'], ['O', 'Set end at the playhead'], ['← / →', 'Nudge the focused handle by 0.1 s'], ['Shift + ← / →', 'Nudge by 1 s']] }],
        ['Lossless vs. re-encoded trimming', 'By default LocalKit cuts without re-encoding: the original video data is kept, so quality is identical and trimming is near-instant. A few very old players ignore the cut information and may show a fraction of a second before your start point; if that matters, open "More options" and choose "Re-encode for maximum compatibility".'],
        ['Need a smaller file too?', 'After trimming, open the Compress Video tool to fit the clip under an upload limit, or turn it into a GIF or MP3 with the related tools below.'],
      ],
      faq: [
        ['How do I cut the beginning and end of a video?', 'Drop the video, drag the left handle to where the clip should start and the right handle to where it should end, then press Trim video.'],
        ['Does trimming reduce quality?', 'No. In the default mode the video is not re-encoded at all, so the clip is bit-for-bit the same quality as the original.'],
        ['Is there a length or size limit?', 'No fixed limit. Because nothing is uploaded and nothing is re-encoded, even recordings of an hour or more trim quickly.'],
        ['Can I trim videos on iPhone or Android?', 'Yes. Open this page in Safari or Chrome, pick the video from your gallery, and drag the handles with your finger.'],
        ['Which formats can I trim?', 'MP4, MOV, M4V, MKV and WebM are trimmed losslessly into the same format. AVI, FLV and WMV are converted to MP4 with the compatibility engine.'],
        ['Is my video uploaded?', 'No. The video is read and cut in your browser and never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a video here', dropHint: 'MP4, MOV, MKV, WebM, AVI · stays on your device',
        more: 'More options', removeAudio: 'Remove audio', reencode: 'Re-encode for maximum compatibility (slower)',
        trim: 'Trim video', trimming: 'Trimming…', preparing: 'Reading video…', done: 'Your $1 clip is ready.',
        download: 'Download clip', again: 'Adjust and trim again', another: 'Trim another video', legacy: 'This format is converted to MP4 with the compatibility engine, which is slower.',
        clipInfo: 'Clip: $1 → $2',
      },
    },
    zh: {
      name: '视频剪切',
      short: '剪掉视频的开头和结尾，秒出结果，画质无损。',
      keywords: ['剪辑视频', '截取视频', '视频裁剪', '视频片段', 'mp4 剪切'],
      title: '在线视频剪切 — 免费截取 MP4、MOV、WebM 片段，秒出结果不上传',
      desc: '把视频剪成需要的片段：在缩略图时间轴上拖动手柄、预览，几秒钟保存，不重新编码、画质无损。支持 MP4、MOV、MKV、WebM。免费、私密、无水印。',
      h1: '视频剪切：截取你想要的片段',
      sub: '在缩略图时间轴上拖动黄色手柄，播放选中片段确认无误后保存。片段不经过重新编码，一秒钟完成，画质和原视频完全一样。',
      features: [
        ['film', '可视化时间轴', '整段视频的缩略图一目了然，拖动开始和结束手柄，预览画面会跳到手柄所在的那一帧。'],
        ['zap', '秒剪且无损', '直接复制视频数据而不重新编码，即使很长的录像也能几秒剪完，画质没有任何损失。'],
        ['keyboard', '精确控制', '可以直接输入精确时间，用方向键微调手柄（按住 Shift 每次 1 秒），按 I / O 把开始和结束设为当前播放位置。'],
      ],
      howToTitle: '如何剪切视频',
      steps: [
        '把视频文件拖到框里（手机上点击即可从相册选择）。',
        '拖动黄色手柄到想要的开始和结束位置 —— 也可以播放视频，在合适时点击「设为播放位置」。',
        '点击「播放选中片段」确认，然后点击「剪切视频」并下载片段。',
      ],
      guide: [
        ['快捷键', { table: [['按键', '作用'], ['空格', '播放 / 暂停'], ['I', '把开始设为当前播放位置'], ['O', '把结束设为当前播放位置'], ['← / →', '把选中的手柄移动 0.1 秒'], ['Shift + ← / →', '移动 1 秒']] }],
        ['无损剪切与重新编码', 'LocalKit 默认不重新编码：保留原始视频数据，所以画质完全一致，剪切几乎瞬间完成。少数很老的播放器会忽略剪切信息，可能多显示开始点之前零点几秒的画面；如果介意，打开「更多选项」，选择「重新编码以获得最佳兼容性」。'],
        ['还需要更小的文件？', '剪切完成后，可以用「视频压缩」把片段压到上传限制以内，或用下方的相关工具把它转成 GIF 或 MP3。'],
      ],
      faq: [
        ['怎么剪掉视频的开头和结尾？', '拖入视频，把左边的手柄拖到片段开始的位置，右边的手柄拖到结束的位置，然后点击「剪切视频」。'],
        ['剪切会降低画质吗？', '不会。默认模式完全不重新编码，片段的画质和原视频一模一样。'],
        ['有时长或大小限制吗？', '没有固定限制。因为不上传也不重新编码，即使一小时以上的录像也能很快剪完。'],
        ['能在 iPhone 或安卓手机上剪视频吗？', '可以。用 Safari 或 Chrome 打开本页，从相册选择视频，用手指拖动手柄即可。'],
        ['支持哪些格式？', 'MP4、MOV、M4V、MKV、WebM 会无损剪切并保持原格式；AVI、FLV、WMV 会通过兼容引擎转换为 MP4。'],
        ['视频会被上传吗？', '不会。视频在你的浏览器中读取和剪切，不会离开你的设备。'],
      ],
      ui: {
        drop: '把视频拖到这里', dropHint: 'MP4、MOV、MKV、WebM、AVI · 文件不离开你的设备',
        more: '更多选项', removeAudio: '去除音频', reencode: '重新编码以获得最佳兼容性（较慢）',
        trim: '剪切视频', trimming: '正在剪切…', preparing: '正在读取视频…', done: '$1 的片段已经剪好。',
        download: '下载片段', again: '调整后重新剪切', another: '剪切另一个视频', legacy: '该格式会通过兼容引擎转换为 MP4，速度较慢。',
        clipInfo: '片段：$1 → $2',
      },
    },
  },
  ui: (s) => html`
<div id="tv-pick"></div>
<div id="tv-work" class="panel" hidden>
  <div id="tv-file"></div>
  <div id="tv-player" class="player-fit"></div>
  <div id="tv-tl"></div>
  <details class="more"><summary>${s.more}</summary><div class="opts">
    <label class="check"><input type="checkbox" id="tv-mute"> ${s.removeAudio}</label>
    <label class="check"><input type="checkbox" id="tv-reencode"> ${s.reencode}</label>
  </div></details>
  <div id="tv-alert"></div>
  <div class="actions"><button class="btn lg" id="tv-go">${s.trim}</button></div>
  <div id="tv-task"></div>
  <div id="tv-result"></div>
</div>`,
};
