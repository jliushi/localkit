import { html } from '../../build/html.mjs';

export default {
  id: 'remove-silence', category: 'video', iconName: 'audio-lines', color: '#7c3aed',
  related: ['noise-reduction', 'trim-video', 'video-to-mp3'], appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Remove Silence', short: 'Automatically cut long pauses from video and audio.',
      keywords: ['remove silence from video', 'jump cut', 'auto cut silence', 'podcast silence remover', 'remove pauses from audio'],
      title: 'Remove Silence from Video & Audio Online — Free',
      desc: 'Automatically remove silence from video or audio in your browser. Preview pauses on a waveform, adjust the threshold, and export MP4, WAV or MP3 privately.',
      h1: 'Remove silence from video & audio',
      sub: 'Find the quiet stretches, keep natural breathing room, and download a shorter recording. Your files stay on your device.',
      features: [['audio-lines', 'See every pause', 'A loudness waveform highlights the time that will be removed. Adjust the controls and see the new duration immediately.'], ['sliders-horizontal', 'Keep the rhythm', 'Start with an automatic threshold, then tune the minimum pause and the padding around speech.'], ['scissors', 'One continuous recording', 'Video and audio use the same cuts. Export a shorter MP4, an audio file, or a text cut list.']],
      howToTitle: 'How to remove silence',
      steps: ['Choose a video or audio recording, or try the sample.', 'Check the shaded pauses. Adjust the threshold, minimum silence and speech padding, then preview the cuts.', 'Choose the output format and click Remove silence. Preview and download the result.'],
      guide: [
        ['What counts as silence?', 'The tool measures audio energy in 20 ms windows. Auto estimates a threshold from quieter windows; it is a starting point, not speech recognition. Music and background noise can keep a window above the threshold.'],
        ['Natural cuts', 'A 0.6-second minimum leaves short conversational pauses alone. Padding keeps 0.12 seconds on either side of speech; increase it if the cuts feel abrupt. Higher thresholds remove more sound, so listen before exporting.'],
        ['Output and browser support', 'Video is decoded and re-encoded to MP4 for precise cuts; audio is exported at 48 kHz as WAV or MP3. Use a current Chrome or Edge with WebCodecs. Codec availability varies by device. The first audio/video tracks are used; subtitles and additional tracks are not included.'],
      ],
      faq: [
        ['Can I automatically remove silence from a video?', 'Yes. Open a video with an audio track, review the highlighted pauses and export. The same sections are removed from picture and sound.'],
        ['Does it recognize spoken words?', 'No. It detects low audio energy. Quiet speech can be mistaken for silence, and music may prevent a pause from being detected. Lower the threshold to protect quieter voices.'],
        ['Can I remove pauses from a podcast?', 'Yes. MP3, WAV, M4A and other browser-decodable audio formats are supported. Export WAV for further editing or MP3 for a smaller file.'],
        ['Will it reduce video quality?', 'Video is re-encoded to make accurate jump cuts, so a generation of quality loss is possible. The original file is unchanged.'],
        ['Are my recordings uploaded?', 'No. Decoding, analysis and export all happen locally in your browser.'],
        ['Can I process a long recording?', 'Memory and codec support set the practical limit. Decoded audio is limited to 512 MiB to avoid exhausting memory; split larger recordings first.'],
      ],
      ui: {
        drop: 'Drop a video or audio file', dropHint: 'MP4, MOV, WebM, MP3, WAV, M4A · processed locally',
        preparing: 'Reading audio…', analyzing: 'Analyzing pauses…', threshold: 'Silence threshold', auto: 'Auto', minimum: 'Minimum silence', padding: 'Speech padding', seconds: 'seconds',
        waveform: 'Audio loudness and proposed cuts', removedLegend: 'Shaded areas will be removed', summary: 'Removes $1 of $2 ($3%) · new duration $4',
        preview: 'Preview cuts', stop: 'Stop preview', previewHint: 'Preview skips the shaded sections of the original recording.',
        format: 'Output format', video: 'MP4 video', wav: 'WAV audio', mp3: 'MP3 audio', go: 'Remove silence', exporting: 'Removing silence…',
        done: 'Your shorter recording is ready', download: 'Download $1', cutlist: 'Download cut list', cutlistTitle: 'LocalKit silence removal — source time in seconds', keepLabel: 'KEEP', removeLabel: 'REMOVE',
        noCuts: 'No long pauses found. Raise the threshold or shorten the minimum silence to find more.', allSilent: 'The entire recording is below the threshold. Lower the threshold to keep some audio.',
        noAudio: 'No decodable audio track found. Try an MP4 with AAC audio, or a WAV/MP3 recording.', noEncoder: 'This browser cannot encode this video. Try current Chrome or Edge, or export audio only.',
        unsupported: 'This file or browser cannot decode the audio. Try current Chrome or Edge with MP4, WAV or MP3.', tooLarge: 'This recording needs more than 512 MiB of decoded audio. Split it into shorter files first.',
        another: 'Choose another file', adjust: 'Adjust the controls to create another version.',
      },
    },
    zh: {
      name: '去除静音', short: '自动剪掉视频和音频里的长停顿，让录音更紧凑。',
      keywords: ['去除视频静音', '自动剪掉停顿', '音频去静音', '播客剪辑', '跳剪', '自动剪辑静音'],
      title: '去除视频静音 — 自动剪掉音视频停顿，免费在线',
      desc: '免费自动去除视频和音频中的静音与长停顿。在波形上查看待删除片段，自由调整音量阈值、最短静音和语音留白，预览缩短后的时长，导出 MP4、WAV 或 MP3。全程本地处理，不上传文件，无需注册。',
      h1: '去除静音，自动剪掉长停顿',
      sub: '找出安静片段，保留自然的说话间隔，导出更紧凑的录音或视频。文件始终留在你的设备上。',
      features: [['audio-lines', '每段停顿都看得见', '音量波形标出准备删除的时间段。调整参数后，即时查看新的时长。'], ['sliders-horizontal', '保留说话节奏', '先用自动阈值，再微调最短停顿与语音两侧留白，让剪切听起来更自然。'], ['scissors', '音画同步拼接', '视频与音频使用完全相同的剪切区间，可导出 MP4、音频文件或文字剪切清单。']],
      howToTitle: '如何自动去除静音',
      steps: ['选择一个视频或音频文件，也可以先试用示例。', '检查波形中标出的停顿，调整阈值、最短静音与语音留白，试听剪切效果。', '选择输出格式，点击「去除静音」，预览并下载处理结果。'],
      guide: [
        ['如何判断静音？', '工具以 20 毫秒为窗口测量音频能量。自动阈值根据较安静的窗口估算，只是调节起点，并不识别说话内容。背景音乐和噪声可能让停顿高于阈值。'],
        ['让剪切更自然', '默认最短静音为 0.6 秒，会保留较短的交谈停顿；语音两侧各留 0.12 秒。如果剪切太急，可以增加留白。阈值越高，删除的声音越多，建议导出前试听。'],
        ['输出格式与浏览器', '视频会重新编码为 MP4，以便准确剪切；音频以 48 kHz 导出为 WAV 或 MP3。建议使用支持 WebCodecs 的新版 Chrome 或 Edge，具体编解码能力取决于设备。仅处理第一条视频与音频轨道，不保留字幕或其他轨道。'],
      ],
      faq: [
        ['可以自动去除视频里的静音吗？', '可以。打开含音轨的视频，检查高亮停顿后导出。画面和声音会删除相同区间，保持同步。'],
        ['会识别说话内容吗？', '不会。它检测低音量片段，轻声说话可能被当成静音，音乐则可能让停顿无法被识别。降低阈值可以保护较轻的声音。'],
        ['可以用来剪播客吗？', '可以。支持 MP3、WAV、M4A 等浏览器能够解码的音频。继续编辑可选 WAV，需要小文件可选 MP3。'],
        ['视频画质会下降吗？', '视频会重新编码以实现准确跳剪，可能有一次编码损失。原文件不会被修改。'],
        ['录音会上传吗？', '不会。读取、分析与导出均在本地浏览器中完成。'],
        ['支持很长的录音吗？', '实际限制取决于内存和编解码器。为避免耗尽内存，解码后的音频限制为 512 MiB，更长的录音请先分段。'],
      ],
      ui: {
        drop: '把视频或音频拖到这里', dropHint: 'MP4、MOV、WebM、MP3、WAV、M4A · 本地处理',
        preparing: '正在读取音频…', analyzing: '正在分析停顿…', threshold: '静音阈值', auto: '自动', minimum: '最短静音', padding: '语音留白', seconds: '秒',
        waveform: '音量波形与待删除片段', removedLegend: '底色标出的片段将被删除', summary: '从 $2 中删除 $1（$3%）· 新时长 $4',
        preview: '试听剪切效果', stop: '停止试听', previewHint: '试听时会跳过原录音中标出的静音区间。',
        format: '输出格式', video: 'MP4 视频', wav: 'WAV 音频', mp3: 'MP3 音频', go: '去除静音', exporting: '正在剪除静音…',
        done: '更紧凑的录音已经准备好', download: '下载 $1', cutlist: '下载剪切清单', cutlistTitle: 'LocalKit 静音剪切清单 — 原文件时间，单位：秒', keepLabel: '保留', removeLabel: '删除',
        noCuts: '没有发现较长停顿。可以提高阈值，或缩短最短静音时间。', allSilent: '整段录音都低于阈值，请降低阈值以保留部分声音。',
        noAudio: '没有可解码的音轨。请尝试带 AAC 音频的 MP4，或 WAV / MP3 录音。', noEncoder: '此浏览器无法编码该视频，请尝试新版 Chrome、Edge，或仅导出音频。',
        unsupported: '此文件或浏览器不支持音频解码，请使用新版 Chrome 或 Edge，并尝试 MP4、WAV 或 MP3。', tooLarge: '解码这段录音需要超过 512 MiB 内存，请先分成较短的文件。',
        another: '选择其他文件', adjust: '调整参数后，可再次生成新版本。',
      },
    },
  },
  ui: (s) => html`
<div id="rs-pick"></div>
<div id="rs-work" class="panel audio-cleanup" hidden>
  <div id="rs-file"></div>
  <div id="rs-player" class="player-fit"></div>
  <fieldset id="rs-controls" disabled>
    <div class="opts">
      <label class="opt">${s.threshold}<div class="audio-inline"><input type="range" id="rs-threshold" min="-80" max="-10" step="1" value="-40"><output id="rs-db">−40 dB</output></div></label>
      <label class="check"><input id="rs-auto" type="checkbox" checked> ${s.auto}</label>
      <label class="opt">${s.minimum}<select id="rs-min"><option value="0.3">0.3 ${s.seconds}</option><option value="0.6" selected>0.6 ${s.seconds}</option><option value="1">1 ${s.seconds}</option><option value="2">2 ${s.seconds}</option></select></label>
      <label class="opt">${s.padding}<select id="rs-padding"><option value="0">0 ${s.seconds}</option><option value="0.12" selected>0.12 ${s.seconds}</option><option value="0.25">0.25 ${s.seconds}</option><option value="0.4">0.4 ${s.seconds}</option></select></label>
    </div>
    <figure class="audio-wave"><canvas id="rs-wave" role="img" aria-label="${s.waveform}"></canvas><figcaption>${s.removedLegend}</figcaption></figure>
    <p id="rs-summary" class="audio-summary" aria-live="polite"></p>
    <div class="actions"><button id="rs-preview" type="button" class="btn ghost">${s.preview}</button><button id="rs-cutlist" type="button" class="btn ghost">${s.cutlist}</button></div>
    <p class="note">${s.previewHint}</p>
    <div class="opts"><label class="opt">${s.format}<select id="rs-format"><option value="video">${s.video}</option><option value="wav">${s.wav}</option><option value="mp3">${s.mp3}</option></select></label></div>
  </fieldset>
  <div id="rs-alert"></div>
  <div class="actions"><button id="rs-go" class="btn lg" disabled>${s.go}</button><button id="rs-another" class="btn ghost">${s.another}</button></div>
  <div id="rs-task"></div><div id="rs-result"></div>
</div>`,
};
