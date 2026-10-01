import { html } from '../../build/html.mjs';

export default {
  id: 'blur-video',
  category: 'video',
  iconName: 'eye-off',
  color: '#475569',
  related: ['crop-video', 'trim-video', 'compress-video'],
  strings: {
    en: {
      name: 'Blur Video (Privacy)',
      short: 'Blur or pixelate faces, licence plates and personal details in a video.',
      keywords: ['blur face in video', 'pixelate video', 'censor video', 'hide license plate', 'mosaic video', 'blur part of video'],
      title: 'Blur Part of a Video Online — Hide Faces, Plates & Text Free (No Upload)',
      desc: 'Blur, pixelate or black out any area of a video: faces, licence plates, addresses, screens. Draw boxes, choose when each one applies, preview and export MP4. Free and private — the video never leaves your browser.',
      h1: 'Blur or pixelate part of a video',
      sub: 'Draw a box over anything that shouldn\'t be seen — a face, a licence plate, a phone number on a screen — choose blur, mosaic or a solid box, and export a privacy-safe MP4. Processing happens on your device, so the unblurred original is never uploaded anywhere.',
      features: [
        ['square-dashed', 'Draw any number of areas', 'Drag on the video to add a box; move and resize it. Each area can cover the whole video or just a time range.'],
        ['eye-off', 'Blur, mosaic or black box', 'Choose a soft blur, a pixelated mosaic or a solid box, with adjustable strength. The preview shows exactly what the export will look like.'],
        ['shield-check', 'Private by design', 'Sensitive footage is processed locally and never uploaded — the safest way to anonymise a video before sharing it.'],
      ],
      howToTitle: 'How to blur part of a video',
      steps: [
        'Drop a video on the box.',
        'Drag on the video to draw a box over what you want to hide. Add more boxes as needed; set a time range for areas that only appear briefly.',
        'Choose Blur, Mosaic or Box and the strength, check the preview, then press Export video.',
      ],
      guide: [
        ['Which effect should I use?', { table: [['Effect', 'Best for'], ['Blur', 'Faces and backgrounds where a softer look is acceptable'], ['Mosaic', 'The classic "censored" look; strong enough for most faces and plates'], ['Black box', 'Text such as names, addresses, phone numbers or ID numbers — nothing can be recovered']] }, 'For text, prefer the black box: heavy blur on small text can occasionally be reversed, a solid box cannot.'],
        ['Things that move', 'Boxes stay where you draw them. For a person or car that moves across the frame, add several boxes with consecutive time ranges, or draw one large box that covers the whole path. Automatic tracking is not included.'],
      ],
      faq: [
        ['How do I blur a face in a video?', 'Drop the video, drag a box over the face, choose Blur or Mosaic and press Export video. If the face moves, use a bigger box or several boxes with time ranges.'],
        ['Can I blur only part of the time?', 'Yes. Each box has its own start and end time; use "From playhead" / "To playhead" to set them while watching.'],
        ['Is the blur permanent?', 'Yes. The effect is drawn into the video frames of the exported file; the original pixels are not stored in it.'],
        ['Does it keep the sound?', 'Yes, the audio track is copied unchanged.'],
        ['Is my video uploaded?', 'No. Everything runs in your browser, which matters most for footage you are trying to anonymise.'],
      ],
      ui: {
        drop: 'Drop a video to blur', dropHint: 'MP4, MOV, MKV, WebM · stays on your device', preparing: 'Reading video…',
        drawHint: 'Drag on the video to draw an area to hide.', effect: 'Effect', blur: 'Blur', mosaic: 'Mosaic', box: 'Black box', strength: 'Strength',
        areas: 'Areas', area: 'Area $1', whole: 'Whole video', from: 'From', to: 'To', fromHere: 'From playhead', toHere: 'To playhead', remove: 'Remove', noAreas: 'No areas yet — drag on the video above.',
        export: 'Export video', exporting: 'Rendering the video…', done: 'Done · $1', download: 'Download video', another: 'Blur another video', legacy: 'This format cannot be processed in this browser. Convert it to MP4 first with Convert Video.',
        preview: 'Preview of the export (pause to update)',
      },
    },
    zh: {
      name: '视频打码（局部模糊）',
      short: '给视频中的人脸、车牌和个人信息打码、模糊或遮挡。',
      keywords: ['视频打码', '视频马赛克', '视频局部模糊', '人脸打码', '车牌打码', '视频遮挡'],
      title: '视频打码 — 在线给视频局部加马赛克、模糊人脸车牌，免费不上传',
      desc: '给视频任意区域加模糊、马赛克或黑框：人脸、车牌、地址、屏幕内容都能遮住。画框、设置出现时间、预览后导出 MP4。免费、私密 —— 视频不离开你的浏览器。',
      h1: '给视频局部打码、模糊或遮挡',
      sub: '在不该被看到的地方画一个框 —— 人脸、车牌、屏幕上的手机号 —— 选择模糊、马赛克或纯色遮挡，导出可以放心分享的 MP4。处理在你的设备上完成，未打码的原视频不会被上传到任何地方。',
      features: [
        ['square-dashed', '想画几个框都行', '在视频上拖动即可添加遮挡框，可以移动和调整大小。每个框可以覆盖整段视频，也可以只在某个时间段出现。'],
        ['eye-off', '模糊、马赛克或黑框', '可选柔和模糊、像素马赛克或纯色遮挡，强度可调。预览效果就是导出的效果。'],
        ['shield-check', '天生保护隐私', '敏感画面在本地处理，绝不上传 —— 分享前给视频脱敏最安全的方式。'],
      ],
      howToTitle: '如何给视频打码',
      steps: [
        '把视频拖到框里。',
        '在视频上拖动，框住要遮住的内容。需要的话继续添加；只短暂出现的内容可以设置时间段。',
        '选择模糊、马赛克或黑框以及强度，确认预览后点击「导出视频」。',
      ],
      guide: [
        ['选哪种效果？', { table: [['效果', '适合'], ['模糊', '人脸和背景，效果比较柔和'], ['马赛克', '经典的「打码」效果，遮人脸、车牌足够'], ['黑框', '姓名、地址、电话、证件号等文字 —— 完全无法还原']] }, '遮文字时建议用黑框：小字号文字的重度模糊偶尔可能被还原，纯色遮挡则不可能。'],
        ['移动的物体', '遮挡框会固定在画的位置。对于会在画面中移动的人或车，可以添加多个时间段相连的框，或者画一个覆盖整个移动路径的大框。目前不包含自动跟踪。'],
      ],
      faq: [
        ['怎么给视频里的人脸打码？', '拖入视频，在人脸上拖出一个框，选择模糊或马赛克，点击「导出视频」。如果人脸会移动，可以画大一点的框，或用多个带时间段的框。'],
        ['可以只在一段时间里打码吗？', '可以。每个框都有自己的开始和结束时间，边看边用「从播放位置」/「到播放位置」设置。'],
        ['打码是永久的吗？', '是的。效果被直接绘制进导出视频的画面中，文件里不保存原始像素。'],
        ['会保留声音吗？', '会，音轨原样保留。'],
        ['视频会被上传吗？', '不会。全部在你的浏览器中完成，这对需要脱敏的画面尤其重要。'],
      ],
      ui: {
        drop: '拖入要打码的视频', dropHint: 'MP4、MOV、MKV、WebM · 文件不离开你的设备', preparing: '正在读取视频…',
        drawHint: '在视频上拖动，画出要遮住的区域。', effect: '效果', blur: '模糊', mosaic: '马赛克', box: '黑框', strength: '强度',
        areas: '遮挡区域', area: '区域 $1', whole: '整段视频', from: '从', to: '到', fromHere: '从播放位置', toHere: '到播放位置', remove: '删除', noAreas: '还没有区域 —— 在上方视频上拖动即可添加。',
        export: '导出视频', exporting: '正在生成视频…', done: '完成 · $1', download: '下载视频', another: '给另一个视频打码', legacy: '这个格式无法在当前浏览器中处理，请先用「视频格式转换」转成 MP4。',
        preview: '导出效果预览（暂停时更新）',
      },
    },
  },
  ui: (s) => html`
<div id="bv-pick"></div>
<div id="bv-work" class="panel" hidden>
  <div id="bv-file"></div>
  <p class="note">${s.drawHint}</p>
  <div class="bv-stage" id="bv-stage"></div>
  <div class="opts">
    <div class="opt"><span class="field-label">${s.effect}</span><div class="chips">
      <label class="chip"><input type="radio" name="bv-fx" value="blur" checked><span>${s.blur}</span></label>
      <label class="chip"><input type="radio" name="bv-fx" value="mosaic"><span>${s.mosaic}</span></label>
      <label class="chip"><input type="radio" name="bv-fx" value="box"><span>${s.box}</span></label>
    </div></div>
    <label class="field opt" id="bv-str-wrap"><span>${s.strength}</span><input type="range" id="bv-str" min="1" max="10" value="6"></label>
  </div>
  <div><span class="field-label">${s.areas}</span><div class="flist" id="bv-list" style="margin-top:8px"></div></div>
  <div id="bv-alert"></div>
  <div class="actions"><button class="btn lg" id="bv-go">${s.export}</button></div>
  <div id="bv-task"></div>
  <div id="bv-result"></div>
</div>`,
};
