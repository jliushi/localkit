import { html } from '../../build/html.mjs';

export default {
  id: 'video-audio', category: 'video', iconName: 'volume-x', color: '#e11d48',
  related: ['video-speed', 'extract-audio', 'trim-video'], appCategory: 'MultimediaApplication',
  strings: {
    en: {
      name: 'Mute / Replace Audio', short: 'Remove sound, replace it with music, or mix background music with the original audio.',
      keywords: ['mute video', 'remove audio from video', 'add music to video', 'replace video audio', 'background music', 'mix video audio'],
      title: 'Mute Video or Add Music Online — Private, No Upload',
      desc: 'Remove sound from a video or add your own background music. Replace or mix audio, loop short tracks, adjust volume and fade out. Free and entirely local.',
      h1: 'Remove sound or add your own music',
      sub: 'Mute a clip, replace its soundtrack, or keep the original voice under background music. Adjust the music volume and ending, then save a video that stays on your device.',
      features: [
        ['volume-x', 'Remove the audio track', 'Save a silent video. Compatible files keep their original video quality without re-encoding.'],
        ['music', 'Replace or mix music', 'Choose an audio file, then replace the original sound or mix both tracks. Set separate music and original volume levels.'],
        ['repeat', 'Fit the whole clip', 'Loop short music or play it once, trim long tracks to the video length, and optionally fade out the ending.'],
      ],
      howToTitle: 'How to mute a video or add music',
      steps: ['Choose your video.', 'Select Remove audio, Replace audio or Mix with original. For music, choose an audio file and adjust its volume and ending.', 'Press Save video, preview the result and download it.'],
      guide: [
        ['Choose the right sound mode', { table: [['Mode', 'Result'], ['Remove audio', 'No audio track in the downloaded video'], ['Replace audio', 'Only your selected music'], ['Mix with original', 'Original voices and your music together']] }],
        ['When the music is shorter or longer', 'Loop repeats a short track until the video ends. Play once leaves the rest silent (or keeps the original sound in Mix mode). Long tracks are trimmed at the video ending. A fade-out softens the last seconds of the music.'],
        ['Balance voices and music', 'Start with music around 20–40% when keeping speech. Very loud tracks may still clip when mixed; lower either volume and listen to the saved preview.'],
        ['Processing on your device', 'Music editing uses a local compatibility engine, downloaded when needed. Large files need more memory and may take longer, especially on phones. MP4 is used for formats the engine must convert.'],
      ],
      faq: [
        ['How do I remove audio from a video?', 'Select Remove audio and save. The output has no audio stream, rather than a soundtrack with its volume set to zero.'],
        ['Can I keep the original voice?', 'Yes. Choose Mix with original and lower the music volume so the voice remains clear.'],
        ['Can I add music to a silent video?', 'Yes. Choose Replace audio or Mix with original; a silent source simply contributes no original sound.'],
        ['What happens when the music is too short?', 'Loop is enabled by default. Choose Play once to stop the music at its natural ending while the video continues.'],
        ['Does muting reduce picture quality?', 'Compatible video tracks are copied without re-encoding. Unsupported containers or codecs may need conversion to MP4.'],
        ['Are my video and music uploaded?', 'No. Files are processed in your browser. Use music you have permission to share if you publish the result.'],
      ],
      ui: {
        drop: 'Drop a video to edit its sound', dropHint: 'MP4, MOV, WebM, MKV, AVI · stays on your device', preparing: 'Reading video…',
        mode: 'Sound mode', mute: 'Remove audio', replace: 'Replace audio', mix: 'Mix with original', musicDrop: 'Choose your music', musicHint: 'MP3, WAV, M4A, AAC, OGG, FLAC',
        musicVolume: 'Music volume', originalVolume: 'Original volume', length: 'When the music ends', loop: 'Loop to fill video', once: 'Play once', fade: 'Music fade-out', noFade: 'None', seconds: '$1 seconds',
        fitNote: 'Long music is trimmed to the video length. Play once leaves silence after a short track; Mix mode keeps the original sound.',
        save: 'Save video', saving: 'Editing soundtrack…', done: 'Done · $1 · $2', download: 'Download video', another: 'Choose another video', needMusic: 'Choose an audio file first.',
        noVideo: 'This file has no readable video track. Choose another video.', noSound: 'This video has no audio track. You can still add music.', engine: 'Music editing loads a local processing engine on first use.', preview: 'Source preview · listen to the edited sound in the result below.',
      },
    },
    zh: {
      name: '视频静音 / 替换音频', short: '去掉视频声音、替换配乐，或保留人声并添加背景音乐。',
      keywords: ['视频去除声音', '视频静音', '视频加背景音乐', '视频加音乐', '替换视频音频', '视频混音'],
      title: '视频静音、替换音频、添加背景音乐 — 免费不上传',
      desc: '在线去掉视频声音，或加入自己的背景音乐。支持替换原声、保留人声混音、短音乐循环、独立音量调节与结尾淡出。音视频都在本机浏览器处理，不上传、无水印，手机电脑均可使用。',
      h1: '去掉原声，或给视频配上音乐',
      sub: '让视频静音、换一段配乐，或者保留人声并添加背景音乐。调好音乐音量和结尾效果，再保存视频。文件始终留在你的设备上。',
      features: [
        ['volume-x', '直接移除音轨', '导出没有声音的视频。兼容格式会保留原视频画质，无需重新编码。'],
        ['music', '替换配乐或保留原声混音', '选择音频文件，替换原声或把两条音轨混在一起。音乐和原声的音量可以分别调节。'],
        ['repeat', '音乐适配整个视频', '短音乐可循环或只播放一次，长音乐自动裁到视频结尾，还能给音乐添加淡出效果。'],
      ],
      howToTitle: '如何让视频静音或添加音乐',
      steps: ['选择要处理的视频。', '选择「去掉声音」「替换原声」或「保留原声混音」。需要配乐时，选择音频文件并调整音量和结尾。', '点击「保存视频」，预览处理后的效果，再下载。'],
      guide: [
        ['选择声音模式', { table: [['模式', '结果'], ['去掉声音', '下载的视频中没有音轨'], ['替换原声', '只保留你选择的配乐'], ['保留原声混音', '原视频声音和配乐一起播放']] }],
        ['音乐长短如何处理', '「循环到视频结束」会重复播放短音乐。「只播放一次」会在音乐自然结束后静音，混音模式则继续保留原声。长音乐自动在视频结尾裁断。淡出可以让音乐结尾更柔和。'],
        ['让人声听得清楚', '保留说话声时，可先把音乐音量设为 20%–40%。两段很响的声音混在一起仍可能失真，此时降低任一音量，再听处理后的预览。'],
        ['在本机处理', '配乐编辑使用按需下载的本地兼容引擎。大文件需要更多内存，在手机上可能耗时较长。必须转换的格式会保存为 MP4。'],
      ],
      faq: [
        ['怎么去掉视频声音？', '选择「去掉声音」并保存。结果会直接移除音轨，而不是仅把音量设为零。'],
        ['能保留说话声音吗？', '可以。选择「保留原声混音」，并调低音乐音量，让人声更清楚。'],
        ['没有声音的视频能加音乐吗？', '可以。选择「替换原声」或「保留原声混音」即可；无声视频不会贡献原声音轨。'],
        ['音乐太短怎么办？', '默认会循环播放到视频结束。也可选择「只播放一次」，让音乐自然结束而视频继续。'],
        ['静音会降低画质吗？', '兼容的视频轨道会直接复制，不重新编码。不兼容的封装格式或编码可能需要转换为 MP4。'],
        ['音视频会上传吗？', '不会，文件在浏览器内处理。公开发布结果时，请使用有权分享的音乐。'],
      ],
      ui: {
        drop: '拖入要编辑声音的视频', dropHint: 'MP4、MOV、WebM、MKV、AVI · 文件不离开设备', preparing: '正在读取视频…',
        mode: '声音模式', mute: '去掉声音', replace: '替换原声', mix: '保留原声混音', musicDrop: '选择配乐文件', musicHint: 'MP3、WAV、M4A、AAC、OGG、FLAC',
        musicVolume: '音乐音量', originalVolume: '原声音量', length: '音乐结束后', loop: '循环到视频结束', once: '只播放一次', fade: '音乐结尾淡出', noFade: '不淡出', seconds: '$1 秒',
        fitNote: '长音乐会裁到视频结尾。「只播放一次」会在短音乐结束后静音，混音模式则继续保留原声。',
        save: '保存视频', saving: '正在编辑声音…', done: '完成 · $1 · $2', download: '下载视频', another: '选择另一个视频', needMusic: '请先选择音频文件。',
        noVideo: '这个文件没有可读取的视频轨道，请选择其他视频。', noSound: '这个视频没有音轨，仍然可以添加音乐。', engine: '首次配乐编辑会加载本地处理引擎。', preview: '原视频预览 · 处理后的声音可在下方结果中试听。',
      },
    },
  },
  ui: (s) => html`
<div id="va-pick"></div>
<div id="va-work" class="panel" hidden>
  <div id="va-file"></div>
  <div id="va-player" class="player-fit"></div><p class="note">${s.preview}</p>
  <div class="opts"><div class="opt"><span class="field-label">${s.mode}</span><div class="chips" id="va-modes">
    <label class="chip"><input type="radio" name="va-mode" value="mute" checked><span>${s.mute}</span></label>
    <label class="chip"><input type="radio" name="va-mode" value="replace"><span>${s.replace}</span></label>
    <label class="chip"><input type="radio" name="va-mode" value="mix"><span>${s.mix}</span></label>
  </div></div></div>
  <div id="va-music" hidden>
    <div id="va-music-pick"></div><div id="va-music-file"></div>
    <div class="opts">
      <div class="opt"><label for="va-volume">${s.musicVolume}</label><div class="vs-slider"><input id="va-volume" type="range" min="0" max="200" value="100"><output for="va-volume" id="va-volume-val">100%</output></div></div>
      <div class="opt" id="va-original-opt" hidden><label for="va-original">${s.originalVolume}</label><div class="vs-slider"><input id="va-original" type="range" min="0" max="200" value="100"><output for="va-original" id="va-original-val">100%</output></div></div>
      <div class="opt"><label for="va-loop">${s.length}</label><select id="va-loop"><option value="loop">${s.loop}</option><option value="once">${s.once}</option></select></div>
      <div class="opt"><label for="va-fade">${s.fade}</label><select id="va-fade"><option value="0">${s.noFade}</option><option value="1">${s.seconds.replace('$1', '1')}</option><option value="2">${s.seconds.replace('$1', '2')}</option><option value="3">${s.seconds.replace('$1', '3')}</option><option value="5">${s.seconds.replace('$1', '5')}</option></select></div>
    </div><p class="note">${s.fitNote}</p><p class="note">${s.engine}</p>
  </div>
  <div id="va-alert" role="status"></div><div class="actions"><button class="btn lg" id="va-go" disabled>${s.save}</button></div>
  <div id="va-task"></div><div id="va-result"></div>
</div>`,
};
