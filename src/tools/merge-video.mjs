import { html } from '../../build/html.mjs';

export default {
  id: 'merge-video',
  category: 'video',
  iconName: 'layers-2',
  color: '#0d9488',
  related: ['trim-video', 'compress-video', 'convert-video'],
  appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Merge Videos',
      short: 'Join multiple clips into one MP4, in the order you choose.',
      keywords: ['merge video', 'combine videos', 'join clips', 'video merger', 'video joiner'],
      title: 'Merge Videos Online Free — Join MP4 & MOV Clips Into One (No Upload)',
      desc: 'Combine several video clips into one MP4: drag to reorder, different resolutions and aspect ratios are fitted automatically with black bars. Progress, cancel, instant download. Free, private, no watermark.',
      h1: 'Merge videos into one clip',
      sub: 'Drop your clips, put them in order and press Merge. Clips of different sizes and orientations are fitted into one frame without stretching, and video without sound keeps its place silently. Nothing is uploaded.',
      features: [
        ['grip-vertical', 'Drag to reorder', 'Every clip shows a thumbnail, its duration and resolution. Drag cards, use the arrows, or remove clips until the order is exactly right.'],
        ['film', 'Mixed sizes just work', 'Portrait phone clips, landscape screen recordings and old 4:3 footage are combined into one output with black bars — never stretched or cropped.'],
        ['lock', 'Private and watermark-free', 'Everything is decoded and encoded inside your browser with your device\'s hardware, so even personal clips never leave your device.'],
      ],
      howToTitle: 'How to merge videos',
      steps: [
        'Drop two or more video files on the box (or pick them from your gallery).',
        'Drag the clips into the order you want — add or remove clips any time.',
        'Choose the output size and press Merge videos, then download the combined MP4.',
      ],
      guide: [
        ['Different resolutions and aspect ratios', 'A merged file has a single frame size, so clips that don\'t match it are fitted inside with black bars (letterbox or pillarbox), exactly like TV does with widescreen films. Nothing is stretched: a 9:16 phone clip inside a 16:9 frame gets bars on the left and right; a 4:3 clip gets bars on the sides. Pick "Same as first clip" to keep the first video\'s size, or 1080p / 720p for a standard size — smaller clips are then shown at their original sharpness, larger ones are scaled down.'],
        ['Audio keeps its sync', 'The audio track is rebuilt for the whole timeline: a clip with sound plays its audio in its segment, and a clip without an audio track (for example a silent screen recording) simply contributes silence. The picture and the sound therefore stay aligned from the first second to the last.'],
        ['Quality and speed', 'Merging re-encodes every clip, because the frame sizes, codecs and frame rates have to be unified. The tool uses your device\'s hardware encoder when available, so a few short clips usually merge in seconds. Expect roughly the time it takes to play the videos, depending on your device.'],
      ],
      faq: [
        ['How do I join multiple videos into one?', 'Drop the clips on this page, drag them into the order you want, pick an output size and press Merge videos. The combined MP4 downloads when it\'s ready.'],
        ['My clips have different resolutions — will one be stretched?', 'No. Each clip is scaled to fit the chosen output frame while keeping its aspect ratio, and the remaining space is filled with black bars. Nothing is stretched or cropped.'],
        ['What happens to clips that have no sound?', 'They are merged normally — their segment is silent, and the audio of the clips before and after plays exactly where it should. Audio stays in sync for the whole result.'],
        ['Which formats can I merge?', 'Anything your browser can decode: MP4, MOV, WebM, MKV, M4V and 3GP are typical. The result is always a single MP4 file.'],
        ['Is there a limit on length or number of clips?', 'No fixed limit. Because merging re-encodes video, the practical limit is your device\'s memory and patience — a few minutes of total footage is comfortable on most phones.'],
        ['Can I merge videos on iPhone or Android?', 'Yes. Open this page in Safari or Chrome, pick the clips from your gallery, reorder them by dragging, and download the result.'],
        ['Is it really free, and are my videos uploaded?', 'Yes, it\'s free with no watermark, and no — the videos are processed entirely inside your browser and never leave your device.'],
      ],
      ui: {
        drop: 'Drop videos here', dropHint: 'Add two or more · stays on your device', add: 'Add more videos',
        merge: 'Merge videos', merging: 'Merging…', reading: 'Reading…',
        needTwo: 'Add at least one more video to merge.', noVideo: 'This clip has no readable video track and was skipped.',
        total: '$1 clips · $2 total', clipMeta: '$1 · $2 × $3', up: 'Move up', down: 'Move down',
        size: 'Output size', sizeFirst: 'Same as first clip', size1080: '1080p (1920 × 1080)', size720: '720p (1280 × 720)',
        sizeNote: 'Clips that don\'t match are fitted with black bars — nothing is stretched.',
        done: 'Merged $1 clips into one MP4 · $2', download: 'Download MP4', outName: 'merged.mp4',
        clipN: 'Clip $1', canceledNote: 'Merge canceled.',
        noWebCodecs: 'Merging videos needs WebCodecs, which this browser does not support. Try Chrome, Edge, Safari or a recent Firefox.',
        noEncoder: 'This browser cannot encode video, so merging is not possible here.',
      },
    },
    zh: {
      name: '视频合并',
      short: '把多个视频片段按顺序合并成一个 MP4。',
      keywords: ['合并视频', '视频拼接', '多段视频合成', '视频合并工具', 'mp4 合并'],
      title: '视频合并 — 在线免费把多个视频拼接成一个 MP4（不上传）',
      desc: '把多段视频合并成一个 MP4：拖动排序，不同分辨率和横竖屏会自动加黑边适配，绝不拉伸。有进度、可取消、直接下载。免费、私密、无水印。',
      h1: '把多个视频合并成一个',
      sub: '拖入视频片段，调整好顺序，点击合并。不同尺寸、不同横竖屏的片段会自动适配到同一个画面，绝不拉伸变形；没有声音的片段会保持静音。整个过程不上传任何文件。',
      features: [
        ['grip-vertical', '拖动排序', '每个片段都显示缩略图、时长和分辨率，拖动卡片或使用箭头调整顺序，不满意随时删除或继续添加。'],
        ['film', '不同尺寸也能合并', '竖屏手机视频、横屏录屏、老式 4:3 素材都能合并到同一个画面里，不匹配的部分自动加黑边，绝不拉伸或裁剪。'],
        ['lock', '私密且无水印', '解码和编码全部在你的浏览器里用设备硬件完成，即使是私人视频也不会离开你的设备。'],
      ],
      howToTitle: '如何合并视频',
      steps: [
        '把两个或更多视频文件拖到框里（手机上从相册选择）。',
        '拖动片段调整顺序 —— 随时可以继续添加或删除片段。',
        '选择输出尺寸，点击「合并视频」，然后下载合并后的 MP4。',
      ],
      guide: [
        ['分辨率和横竖屏不一致怎么办', '合并后的文件只有一个画面尺寸，和它不一致的片段会加黑边（上下或左右）后放入画面，就像电视台播放宽银幕电影一样，绝不拉伸：16:9 画面里的 9:16 竖屏视频左右会留黑边，4:3 片段两侧会留黑边。选择「与第一个视频相同」可以保持第一个片段的尺寸，选择 1080p / 720p 则输出标准尺寸 —— 比它小的片段保持原清晰度，比它大的片段会缩小。'],
        ['音频始终保持同步', '音轨会按整条时间线重新生成：有声音的片段在自己的时间段播放声音，没有音轨的片段（例如无声录屏）在这一段保持静音。因此从第一秒到最后一秒，画面和声音都是对齐的。'],
        ['画质与速度', '合并必须对每个片段重新编码，因为画面尺寸、编码格式和帧率需要统一。工具会优先使用设备的硬件编码器，几个短片段通常几秒钟就能合并完成。总体耗时大约等于播放一遍这些视频，具体取决于设备性能。'],
      ],
      faq: [
        ['怎么把多个视频合成一个？', '把片段拖到本页，调整好顺序，选择输出尺寸，点击「合并视频」，合并完成后即可下载 MP4。'],
        ['几个视频分辨率不一样，会被拉伸吗？', '不会。每个片段都会在保持比例的前提下缩放到输出画面内，空出的部分用黑边填充，绝不拉伸或裁剪。'],
        ['没有声音的视频怎么处理？', '正常合并 —— 它所在的时间段是静音的，前后片段的声音会出现在正确的位置。整条结果的音画始终同步。'],
        ['支持哪些格式？', '只要是浏览器能解码的都可以：MP4、MOV、WebM、MKV、M4V、3GP 都很常见。输出始终是单个 MP4 文件。'],
        ['有时长或片段数量限制吗？', '没有固定限制。由于合并需要重新编码，实际限制是设备的内存和耐心 —— 总时长几分钟在多数手机上都没问题。'],
        ['能在 iPhone 或安卓手机上合并视频吗？', '能。用 Safari 或 Chrome 打开本页，从相册选择片段，拖动调整顺序，然后下载结果。'],
        ['真的免费吗？视频会被上传吗？', '免费且无水印；视频完全在你的浏览器中处理，不会离开你的设备。'],
      ],
      ui: {
        drop: '把视频拖到这里', dropHint: '添加两个或更多 · 文件不离开你的设备', add: '继续添加视频',
        merge: '合并视频', merging: '正在合并…', reading: '正在读取…',
        needTwo: '请再添加至少一个视频。', noVideo: '这个片段没有可读取的视频轨道，已被跳过。',
        total: '$1 个片段 · 共 $2', clipMeta: '$1 · $2 × $3', up: '上移', down: '下移',
        size: '输出尺寸', sizeFirst: '与第一个视频相同', size1080: '1080p（1920 × 1080）', size720: '720p（1280 × 720）',
        sizeNote: '尺寸不匹配的片段会自动加黑边，不会拉伸。',
        done: '已把 $1 个片段合并为一个 MP4 · $2', download: '下载 MP4', outName: '合并视频.mp4',
        clipN: '片段 $1', canceledNote: '已取消合并。',
        noWebCodecs: '合并视频需要 WebCodecs，当前浏览器不支持。请使用 Chrome、Edge、Safari 或较新的 Firefox。',
        noEncoder: '当前浏览器无法编码视频，因此不能在这里合并。',
      },
    },
  },
  ui: (s) => html`
<div id="mv-pick"></div>
<div id="mv-work" class="panel" hidden>
  <ul class="flist" id="mv-list"></ul>
  <div id="mv-more"></div>
  <div class="opts">
    <div class="opt">
      <label for="mv-size">${s.size}</label>
      <select id="mv-size">
        <option value="first" selected>${s.sizeFirst}</option>
        <option value="1920x1080">${s.size1080}</option>
        <option value="1280x720">${s.size720}</option>
      </select>
    </div>
  </div>
  <p class="hint" id="mv-size-note">${s.sizeNote}</p>
  <div class="actions"><button class="btn lg" id="mv-go">${s.merge}</button><span class="muted" id="mv-total"></span></div>
  <div id="mv-alert"></div>
  <div id="mv-task"></div>
  <div id="mv-result"></div>
</div>`,
};
