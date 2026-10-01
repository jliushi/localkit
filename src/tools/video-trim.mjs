import { html } from '../../build/html.mjs';

export default {
  id: 'video-trim',
  category: 'video',
  icon: '⌛',
  color: '#7c3aed',
  strings: {
    en: {
      name: 'Video Trimmer (Cut Video)',
      title: 'Trim Video Online — Cut MP4, MOV, WebM Clips Free, No Upload',
      desc: 'Cut the part you need out of a video: set start and end while watching, then save the clip. Lossless fast mode or frame-accurate mode. Free, private, no watermark.',
      h1: 'Trim a video — cut out the part you need',
      lead: 'Watch the video, mark the start and end, and save just that part. Fast mode cuts without re-encoding, so quality stays identical and it finishes in seconds.',
      steps: [
        'Drop a video on the box.',
        'Play the video and press "Set start" and "Set end" at the right moments (or type the times).',
        'Choose Fast or Precise, click Cut video and download the clip.',
      ],
      faq: [
        ['What is the difference between Fast and Precise?', 'Fast copies the original video data without re-encoding: no quality loss and very quick, but the cut snaps to the nearest keyframe, so it can start up to a few seconds early. Precise re-encodes the clip to MP4 and cuts at the exact frame, which takes longer.'],
        ['Can I trim long videos?', 'Yes. Fast mode works even on long recordings because it only copies data.'],
        ['Which formats are supported?', 'MP4, MOV, WebM, MKV, AVI and most other common video formats. Precise mode always saves MP4.'],
        ['Is the video uploaded?', 'No. Trimming happens in your browser.'],
      ],
      ui: {
        drop: 'Drop a video here or click to choose', start: 'Start', end: 'End', setStart: '⇤ Set start', setEnd: 'Set end ⇥', length: 'Clip length: $1',
        mode: 'Mode', fast: 'Fast (no quality loss)', precise: 'Precise (re-encode to MP4)', cut: 'Cut video', loading: 'Loading the video engine (first time only)…',
        working: 'Cutting… $1', done: 'Clip saved: $1 ($2).', badTimes: 'The end must be after the start.', preview: 'Preview clip',
      },
    },
    zh: {
      name: '视频剪切（截取片段）',
      title: '在线剪切视频 — 截取 MP4、MOV、WebM 片段，免费不上传',
      desc: '从视频中剪出需要的片段：边看边设置开始和结束时间，然后保存。支持无损快速模式和逐帧精确模式。免费、私密、无水印。',
      h1: '剪切视频，截取需要的片段',
      lead: '一边播放一边标记开始和结束，只保存这一段。快速模式不重新编码，画质完全不变，几秒钟就能完成。',
      steps: [
        '把视频拖到框里。',
        '播放视频，在合适的时间点击「设为开始」和「设为结束」（也可以直接输入时间）。',
        '选择快速或精确模式，点击「剪切视频」，下载片段。',
      ],
      faq: [
        ['快速和精确有什么区别？', '快速模式直接复制原视频数据，不重新编码：没有画质损失、速度很快，但剪切点会对齐到最近的关键帧，可能提前几秒开始。精确模式会把片段重新编码为 MP4，在准确的帧上剪切，耗时更长。'],
        ['能剪很长的视频吗？', '可以。快速模式只复制数据，长录像也能处理。'],
        ['支持哪些格式？', '支持 MP4、MOV、WebM、MKV、AVI 等大多数常见视频格式。精确模式总是输出 MP4。'],
        ['视频会被上传吗？', '不会，剪切在你的浏览器中完成。'],
      ],
      ui: {
        drop: '把视频拖到这里，或点击选择', start: '开始', end: '结束', setStart: '⇤ 设为开始', setEnd: '设为结束 ⇥', length: '片段时长：$1',
        mode: '模式', fast: '快速（画质无损）', precise: '精确（重新编码为 MP4）', cut: '剪切视频', loading: '正在加载视频引擎（仅首次需要）…',
        working: '正在剪切… $1', done: '片段已保存：$1（$2）。', badTimes: '结束时间必须晚于开始时间。', preview: '预览片段',
      },
    },
  },
  ui: (s) => html`
<div class="dropzone" id="vt-drop"><strong>${s.drop}</strong></div>
<div id="vt-work" hidden>
  <div class="media-box"><video id="vt-video" controls playsinline></video></div>
  <div class="timeline" id="vt-timeline"><div class="sel" id="vt-sel"></div></div>
  <div class="fields">
    <label class="field"><span>${s.start}</span><input type="text" id="vt-start" value="00:00.0"></label>
    <label class="field"><span>${s.end}</span><input type="text" id="vt-end"></label>
    <label class="field"><span>${s.mode}</span><select id="vt-mode"><option value="fast">${s.fast}</option><option value="precise">${s.precise}</option></select></label>
  </div>
  <div class="row"><button class="btn secondary" id="vt-setstart">${s.setStart}</button><button class="btn secondary" id="vt-setend">${s.setEnd}</button><button class="btn ghost" id="vt-preview">▶ ${s.preview}</button><span class="muted" id="vt-len"></span></div>
  <div class="row"><button class="btn big" id="vt-go">${s.cut}</button></div>
  <div class="status" id="vt-status" hidden></div>
  <div class="progress" id="vt-progress" hidden><span></span></div>
  <div class="media-box" id="vt-result"></div>
</div>`,
};
