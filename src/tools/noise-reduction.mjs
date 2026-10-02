import { html } from '../../build/html.mjs';

export default {
  id: 'noise-reduction', category: 'video', iconName: 'mic', color: '#7c3aed',
  related: ['remove-silence', 'video-to-mp3', 'ai-subtitle-generator'], appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Voice Noise Reduction', short: 'Reduce background noise in voice recordings and videos.',
      keywords: ['remove background noise from audio', 'noise reduction online', 'voice denoiser', 'remove video noise', 'RNNoise'],
      title: 'Remove Background Noise from Audio & Video — Free',
      desc: 'Reduce background noise in voice recordings with RNNoise, locally in your browser. Compare before and after, then download cleaned video, WAV or MP3.',
      h1: 'Remove background noise from voice',
      sub: 'Reduce fan noise, hum and hiss in a recording. Compare the original and cleaned audio, then save it privately.',
      features: [['mic', 'Made for spoken voice', 'RNNoise combines a trained neural network with signal processing to suppress background noise.'], ['sliders-horizontal', 'Choose a natural balance', 'Blend the cleaned voice with the original, and optionally filter low rumble. Switch A/B at the same playback position.'], ['film', 'Keep your video quality', 'Video packets are copied without re-encoding. Only the audio is replaced; the picture keeps its original quality.']],
      howToTitle: 'How to reduce background noise',
      steps: ['Choose an audio recording or a video with sound.', 'Set the strength and optional low-rumble filter, then click Clean recording.', 'Switch between Original and Cleaned to compare. Download the video, WAV or MP3.'],
      guide: [
        ['A useful starting point', 'Start at 85% strength. A higher value removes more noise but can make voices sound processed; lower it to keep more room sound. The optional 80 Hz high-pass filter reduces low rumble and may thin deeper voices.'],
        ['Designed for speech', 'RNNoise is a speech denoiser, not a music separator or echo remover. It can suppress singing, music and other non-speech sounds. Clipping, wind hitting the microphone and overlapping speakers may remain.'],
        ['Formats and privacy', 'Audio is processed locally at 48 kHz in a background worker. Video exports to MP4, or WebM for VP8 input, retaining the original video packets. WAV and MP3 exports contain audio only. Only the first video and audio tracks are used. Use current Chrome or Edge; supported codecs depend on your device.'],
      ],
      faq: [
        ['How do I remove background noise from audio?', 'Open a recording, choose the strength and click Clean recording. Listen to both versions before downloading.'],
        ['Does it use real noise reduction?', 'Yes. RNNoise runs as WebAssembly on 48 kHz audio in 480-sample frames. Each channel is processed separately and mixed with the original according to your strength setting.'],
        ['Will my video be re-encoded?', 'The original video stream is copied. Only the audio is decoded, cleaned and encoded again, so the picture keeps its original quality. Extra audio tracks and subtitles are not carried over.'],
        ['Can I clean music or remove vocals?', 'This tool is tuned for spoken voice. It may remove musical detail and cannot isolate instruments or vocals.'],
        ['Does my recording leave my device?', 'No. The app and denoiser load from this site, and the file is processed entirely inside your browser.'],
        ['Is there a file-size limit?', 'Available memory and codecs determine what works. Decoded audio is capped at 512 MiB; split very long recordings into smaller files.'],
      ],
      ui: {
        drop: 'Drop a voice recording or video', dropHint: 'MP4, MOV, WebM, MP3, WAV, M4A · stays on your device',
        preparing: 'Reading audio…', strength: 'Noise reduction strength', strengthHint: 'Lower keeps more room sound; higher can change the voice.', highpass: 'Reduce low rumble (80 Hz high-pass)',
        format: 'Output format', video: 'Video · original picture quality', wav: 'WAV audio', mp3: 'MP3 audio', go: 'Clean recording', denoising: 'Reducing background noise…', exporting: 'Saving cleaned recording…',
        original: 'Original', cleaned: 'Cleaned', compare: 'Compare at the same playback position', done: 'Your cleaned recording is ready', download: 'Download $1', another: 'Choose another file',
        ready: 'Ready · $1 · $2 channel(s)', changed: 'Settings changed. Clean the recording again to update the comparison.', originalNote: 'Play the original recording before cleaning.',
        noAudio: 'No decodable audio track found. Try an MP4 with AAC audio, or a WAV/MP3 recording.', unsupported: 'This file or browser cannot decode the audio. Try current Chrome or Edge with MP4, WAV or MP3.',
        tooLarge: 'This recording needs more than 512 MiB of decoded audio. Split it into shorter files first.', noEncoder: 'This browser cannot encode the selected output. Try current Chrome or Edge, or WAV audio.',
        workerFailed: 'The denoiser could not load. Reload the page and try again.',
      },
    },
    zh: {
      name: '人声降噪', short: '减少录音和视频中的背景噪声，让人声更清楚。',
      keywords: ['音频降噪', '视频去除杂音', '去除背景噪音', '人声降噪', '录音降噪', 'RNNoise'],
      title: '音频降噪 — 在线去除录音与视频背景杂音，免费',
      desc: '使用 RNNoise 在浏览器本地减少录音与视频中的风扇声、低频嗡声和背景杂音。自由调节降噪强度，同一播放位置切换试听原声与结果，导出保留原画质的视频、WAV 或 MP3。文件不上传，无需注册。',
      h1: '减少背景杂音，让人声更清楚',
      sub: '清理录音里的风扇声、嗡声与嘶声。对比原声和降噪效果，满意后下载，全程本地处理。',
      features: [['mic', '为说话声设计', 'RNNoise 将训练好的神经网络与信号处理相结合，抑制人声录音中的背景噪声。'], ['sliders-horizontal', '选择自然的平衡', '自由混合原声和降噪声音，也可滤除低频轰鸣。在同一播放位置切换 A/B 试听。'], ['film', '保留视频原画质', '视频数据直接复制，不重新编码。只替换音轨，画面保持原有质量。']],
      howToTitle: '如何去除背景杂音',
      steps: ['选择人声录音或带声音的视频。', '调节降噪强度，可选低频滤波，然后点击「开始降噪」。', '切换「原声」与「降噪后」对比试听，下载视频、WAV 或 MP3。'],
      guide: [
        ['从合适的强度开始', '建议先尝试默认 85% 强度。较高强度能去除更多噪声，也可能让人声显得不自然；较低强度会保留更多环境声音。可选的 80 Hz 高通滤波能减少低频轰鸣，但可能削弱较低沉的人声。'],
        ['适合人声，不是音乐分离', 'RNNoise 主要针对说话声，并非回声消除或音乐分离工具。它可能压低歌声、音乐和其他非语音声音。爆音、直接吹向麦克风的风噪和重叠说话声未必能清除。'],
        ['格式与隐私', '音频在后台线程中以 48 kHz 本地处理。视频通常导出 MP4，VP8 输入则导出 WebM，保留原始视频数据。WAV 与 MP3 只含音频。仅保留第一条视频与音频轨道。建议使用新版 Chrome 或 Edge，支持的格式取决于设备。'],
      ],
      faq: [
        ['如何去除音频背景噪音？', '打开录音，选择强度并点击「开始降噪」。下载前建议对比试听两个版本。'],
        ['是真正的降噪算法吗？', '是。RNNoise 通过 WebAssembly 运行，以 48 kHz、每帧 480 个采样处理声音。每个声道单独降噪，再根据强度与原声混合。'],
        ['视频会重新编码吗？', '不会重新编码画面，原视频数据直接复制。只有音频会解码、降噪并重新编码，因此保留原画质，但不会保留额外音轨或字幕。'],
        ['可以清理音乐或去人声吗？', '这个工具面向说话声，可能损失音乐细节，也不能分离乐器或人声。'],
        ['录音会离开我的设备吗？', '不会。网页与降噪程序从本站加载，文件始终在你的浏览器内处理。'],
        ['有文件大小限制吗？', '处理能力取决于内存与编解码器，解码后的音频最多 512 MiB。很长的录音请先分段处理。'],
      ],
      ui: {
        drop: '把人声录音或视频拖到这里', dropHint: 'MP4、MOV、WebM、MP3、WAV、M4A · 文件不离开设备',
        preparing: '正在读取音频…', strength: '降噪强度', strengthHint: '低强度保留更多环境声；高强度可能改变人声质感。', highpass: '减少低频轰鸣（80 Hz 高通滤波）',
        format: '输出格式', video: '视频 · 保留原画质', wav: 'WAV 音频', mp3: 'MP3 音频', go: '开始降噪', denoising: '正在减少背景噪声…', exporting: '正在保存降噪结果…',
        original: '原声', cleaned: '降噪后', compare: '在同一播放位置对比试听', done: '降噪结果已经准备好', download: '下载 $1', another: '选择其他文件',
        ready: '已就绪 · $1 · $2 声道', changed: '参数已改变，请再次降噪以更新对比结果。', originalNote: '先听听原录音，再开始降噪。',
        noAudio: '没有可解码的音轨。请尝试带 AAC 音频的 MP4，或 WAV / MP3 录音。', unsupported: '此文件或浏览器无法解码音频，请使用新版 Chrome 或 Edge，并尝试 MP4、WAV 或 MP3。',
        tooLarge: '解码这段录音需要超过 512 MiB 内存，请先分成较短的文件。', noEncoder: '此浏览器无法编码所选格式，请尝试新版 Chrome、Edge，或导出 WAV 音频。',
        workerFailed: '降噪程序加载失败，请刷新页面后重试。',
      },
    },
  },
  ui: (s) => html`
<div id="nr-pick"></div>
<div id="nr-work" class="panel audio-cleanup" hidden>
  <div id="nr-file"></div>
  <div id="nr-player" class="player-fit"></div>
  <p id="nr-status" class="note" aria-live="polite">${s.originalNote}</p>
  <fieldset id="nr-controls" disabled>
    <div class="opts"><label class="opt">${s.strength}<div class="audio-inline"><input id="nr-strength" type="range" min="0" max="100" value="85" step="5"><output id="nr-percent">85%</output></div></label></div>
    <p class="note">${s.strengthHint}</p>
    <label class="check"><input id="nr-highpass" type="checkbox"> ${s.highpass}</label>
    <div class="opts"><label class="opt">${s.format}<select id="nr-format"><option value="video">${s.video}</option><option value="wav">${s.wav}</option><option value="mp3">${s.mp3}</option></select></label></div>
  </fieldset>
  <div id="nr-alert"></div>
  <div class="actions"><button id="nr-go" class="btn lg" disabled>${s.go}</button><button id="nr-another" class="btn ghost">${s.another}</button></div>
  <div id="nr-task"></div><div id="nr-result"></div>
</div>`,
};
