import { html } from '../../build/html.mjs';

export default {
  id: 'video-speed',
  category: 'video',
  iconName: 'gauge',
  color: '#e11d48',
  related: ['trim-video', 'video-audio', 'compress-video'],
  appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Change Video Speed',
      short: 'Speed up a video up to 4× or make it slow motion down to 0.25×, with the voice kept natural.',
      keywords: ['speed up video', 'slow motion video', 'slow down video', 'video speed changer', 'fast forward video', 'timelapse', 'change video speed', 'video speed controller'],
      title: 'Change Video Speed Online — Speed Up or Slow Down (No Upload)',
      desc: 'Speed up a video to 4× or slow it down to 0.25×. Preview the speed live and keep the voice at its natural pitch. Free, private, no upload or watermark.',
      h1: 'Speed up or slow down a video',
      sub: 'Choose a speed from 0.25× to 4× and preview it before saving. Keep the original voice pitch or remove the sound. Your video stays on your device.',
      features: [
        ['gauge', '0.25× to 4× with live preview', 'Choose 0.5×, 1.5×, 2×, 3× or any value in between with the slider. The preview plays at the chosen speed before you save.'],
        ['volume-2', 'Voices keep their natural pitch', 'The audio is time-stretched rather than just played faster, so speech and music stay at their original pitch and stay in sync with the picture. Or remove the sound entirely.'],
        ['shield-check', 'Private, in your browser', 'The video is processed on your device with no upload, no sign-up and no watermark.'],
      ],
      howToTitle: 'How to change the speed of a video',
      steps: [
        'Drop a video on the box, or pick one from your phone.',
        'Choose a speed with the presets or the slider and watch the preview. Decide whether the sound keeps its pitch or is removed.',
        'Press Change speed and download the result.',
      ],
      guide: [
        ['Which speed should I use?', { table: [['Speed', 'Typical use'], ['0.25×–0.5×', 'Slow motion for sports, tricks and tutorials'], ['1.5×–2×', 'Lectures, meetings and screen recordings'], ['3×–4×', 'Time-lapse, long drives, skipping through slow parts']] }],
        ['Keep the pitch or not?', 'With "Keep natural pitch" the audio is time-stretched, so a voice sounds like the same person talking faster or slower. This works best between about 0.5× and 2×; at the extremes the sound gets a little rough. "Remove audio" gives a silent video, which is usually best for time-lapse and slow motion.'],
        ['What happens to the frames?', 'Slowing down shows each frame for longer, so very slow speeds look steppy because no new frames are invented. Speeding up skips frames when the result would exceed the original frame rate, so the file does not get unnecessarily heavy.'],
      ],
      faq: [
        ['How do I speed up a video online?', 'Drop the video, choose a speed such as 2× with the chips or the slider, and press Change speed.'],
        ['How do I make a slow-motion video?', 'Choose 0.5× or 0.25×. The clip becomes two or four times longer. Because no extra frames are created, a clip filmed at a high frame rate looks smoothest.'],
        ['Will the voice sound like a chipmunk?', 'Not with "Keep natural pitch": the audio is time-stretched, so the pitch stays the same while the speed changes. You can also remove the audio.'],
        ['Is there a speed limit?', 'You can pick any speed from 0.25× to 4×. For a faster or slower result, run the saved clip through the tool again.'],
        ['Does it work for phone videos?', 'Yes. Open this page in Safari or Chrome, choose the video from your gallery and save the changed clip back to your phone.'],
        ['Is my video uploaded to a server?', 'No. It is read and processed in your browser and never leaves your device.'],
      ],
      ui: {
        drop: 'Drop a video to change its speed', dropHint: 'MP4, MOV, MKV, WebM, AVI · stays on your device', preparing: 'Reading video…',
        speed: 'Speed', custom: 'Custom speed', audio: 'Sound', keepPitch: 'Keep natural pitch', removeAudio: 'Remove audio', noAudio: 'This video has no sound.',
        estimate: 'New length: $1 (was $2)', play: 'Play', preview: 'Preview at the chosen speed',
        change: 'Change speed', changing: 'Changing speed…', done: 'Done · $1 → $2 · $3', download: 'Download video', another: 'Change another video', again: 'Try another speed',
        same: 'Pick a speed other than 1× to make a change.', legacy: 'This format is converted to MP4 with the compatibility engine, which is slower.',
      },
    },
    zh: {
      name: '视频变速',
      short: '视频加速最高 4 倍，或慢放到 0.25 倍，人声保持自然音调。',
      keywords: ['视频加速', '视频慢放', '视频变速', '慢动作视频', '视频快放', '延时摄影', '视频倍速', '视频调速'],
      title: '视频变速 — 在线加速、慢放视频，保持音调，免费不上传',
      desc: '把视频加速到 4 倍或慢放到 0.25 倍，实时预览变速效果，人声保持自然音调，也可以去掉声音导出无声视频。免费、私密、无水印，视频不会上传，手机电脑都能用。',
      h1: '视频加速或慢放',
      sub: '选择 0.25 到 4 倍速度，保存前即可预览效果。人声可以保持原来的音调，也可以直接去掉声音。视频始终留在你的设备上。',
      features: [
        ['gauge', '0.25 到 4 倍，实时预览', '可选 0.5×、1.5×、2×、3×，或用滑块选择中间的任意速度。保存前预览就会以所选速度播放。'],
        ['volume-2', '人声保持自然音调', '音频经过时间拉伸而不是简单加速播放，所以说话和音乐的音调不变，并与画面保持同步。也可以直接去掉声音。'],
        ['shield-check', '在浏览器里私密处理', '视频在你的设备上处理，无需上传、无需注册、没有水印。'],
      ],
      howToTitle: '如何改变视频速度',
      steps: [
        '把视频拖到框里，或在手机上点击选择视频。',
        '用预设或滑块选择速度并观看预览，再决定声音是保持音调还是去掉。',
        '点击「改变速度」并下载结果。',
      ],
      guide: [
        ['该选多快的速度？', { table: [['速度', '常见用途'], ['0.25×–0.5×', '运动、技巧、教程的慢动作'], ['1.5×–2×', '网课、会议、屏幕录像'], ['3×–4×', '延时摄影、长途驾驶、快进无聊的部分']] }],
        ['要不要保持音调？', '选择“保持自然音调”时，音频会被时间拉伸，听起来仍是同一个人在更快或更慢地说话。大约在 0.5× 到 2× 之间效果最好，极端速度下声音会有些粗糙。“去掉声音”得到无声视频，通常最适合延时摄影和慢动作。'],
        ['画面帧会怎么处理？', '慢放时每一帧显示得更久，因为不会凭空生成新的帧，所以很慢的速度看起来会一顿一顿。加速时，如果结果会超过原帧率，就会跳过一些帧，避免文件无谓地变大。'],
      ],
      faq: [
        ['怎么在线给视频加速？', '拖入视频，用预设或滑块选择比如 2× 的速度，然后点击「改变速度」。'],
        ['怎么做慢动作视频？', '选择 0.5× 或 0.25×，片段会变成原来的两倍或四倍长。因为不会生成额外的帧，用高帧率拍摄的素材慢放最流畅。'],
        ['人声会变成尖细的“花栗鼠”声吗？', '选择“保持自然音调”就不会：音频经过时间拉伸，速度变了但音调不变。你也可以直接去掉声音。'],
        ['速度有限制吗？', '可选 0.25× 到 4× 之间的任意速度。需要更快或更慢，可以把保存的片段再处理一次。'],
        ['手机拍的视频能用吗？', '可以。用 Safari 或 Chrome 打开本页，从相册选择视频，处理后保存回手机。'],
        ['视频会上传到服务器吗？', '不会。视频在浏览器中读取和处理，不会离开你的设备。'],
      ],
      ui: {
        drop: '拖入要变速的视频', dropHint: 'MP4、MOV、MKV、WebM、AVI · 文件不离开你的设备', preparing: '正在读取视频…',
        speed: '速度', custom: '自定义速度', audio: '声音', keepPitch: '保持自然音调', removeAudio: '去掉声音', noAudio: '这个视频没有声音。',
        estimate: '新的时长：$1（原来 $2）', play: '播放', preview: '以所选速度预览',
        change: '改变速度', changing: '正在变速…', done: '完成 · $1 → $2 · $3', download: '下载视频', another: '处理另一个视频', again: '换个速度再试',
        same: '请选择 1× 以外的速度。', legacy: '该格式会通过兼容引擎转换为 MP4，速度较慢。',
      },
    },
  },
  ui: (s) => html`
<div id="vs-pick"></div>
<div id="vs-work" class="panel" hidden>
  <div id="vs-file"></div>
  <div id="vs-player" class="player-fit"></div>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.speed}</span>
      <div class="chips" id="vs-chips">
        <label class="chip"><input type="radio" name="vs-speed" value="0.25"><span>0.25×</span></label>
        <label class="chip"><input type="radio" name="vs-speed" value="0.5"><span>0.5×</span></label>
        <label class="chip"><input type="radio" name="vs-speed" value="1"><span>1×</span></label>
        <label class="chip"><input type="radio" name="vs-speed" value="1.5"><span>1.5×</span></label>
        <label class="chip"><input type="radio" name="vs-speed" value="2" checked><span>2×</span></label>
        <label class="chip"><input type="radio" name="vs-speed" value="3"><span>3×</span></label>
        <label class="chip"><input type="radio" name="vs-speed" value="4"><span>4×</span></label>
      </div>
      <div class="vs-slider"><input type="range" id="vs-range" min="-2" max="2" step="0.01" value="1" aria-label="${s.custom}"><output id="vs-val" for="vs-range">2×</output></div>
    </div>
    <div class="opt" id="vs-audio-opt"><span class="field-label">${s.audio}</span>
      <div class="chips">
        <label class="chip"><input type="radio" name="vs-audio" value="keep" checked><span>${s.keepPitch}</span></label>
        <label class="chip"><input type="radio" name="vs-audio" value="remove"><span>${s.removeAudio}</span></label>
      </div>
    </div>
  </div>
  <p class="note" id="vs-est" aria-live="polite"></p>
  <div id="vs-alert"></div>
  <div class="actions"><button class="btn lg" id="vs-go">${s.change}</button></div>
  <div id="vs-task"></div>
  <div id="vs-result"></div>
</div>`,
};
