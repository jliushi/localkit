import { html } from '../../build/html.mjs';

export default {
  id: 'resume-builder',
  category: 'docs',
  iconName: 'file-user',
  color: '#9333ea',
  related: ['edit-pdf', 'compress-pdf', 'jpg-to-pdf'],
  appCategory: 'BusinessApplication',
  strings: {
    en: {
      name: 'Resume Builder',
      short: 'Edit your resume right on the page, pick from 12 templates and export a PDF or image. Private, no sign-up.',
      keywords: ['resume builder', 'cv maker', 'free resume template', 'resume pdf', 'one page resume', 'resume editor'],
      title: 'Free Resume Builder: 12 Templates, PDF Export, No Sign-up',
      desc: 'Edit your resume directly on an A4 preview with 12 templates, drag-and-drop sections, photo crop and one-page fit. Export PDF, PNG or JPG. Runs in your browser.',
      h1: 'Free resume builder: edit on the page, export PDF',
      sub: 'Click any text on the A4 page to edit it in place, or use the side panel. Choose from 12 templates, reorder sections by dragging, crop your photo, squeeze everything onto one page with one click, then export a PDF with selectable text or a PNG/JPG image. Everything runs in your browser, so your details are never uploaded and there is no account or watermark.',
      features: [
        ['layout-template', '12 templates, your content kept', 'Single column, sidebar, timeline, banner, formal form, developer, academic and more. Switching template never changes your text.'],
        ['file-user', 'Edit on the page or in the panel', 'Type directly on the resume with a bold/italic/bullet toolbar, or fill the structured panel. Both stay in sync, and the panel works well on phones.'],
        ['shield-check', 'Private by design', 'Your resumes are saved only in this browser. Export or import them as JSON to move between devices.'],
      ],
      howToTitle: 'How to make a resume',
      steps: [
        'Press New resume and pick an example for your role, or start blank.',
        'Click text on the page to edit it. Add, hide, rename and drag sections; upload and crop a photo if you want one.',
        'Open Design to try templates, colours, fonts and spacing, and turn on Fit to one page if you are slightly over.',
        'Press Export: PDF (opens the print dialog, choose Save as PDF) for selectable text, or PNG/JPG/image PDF for an exact picture.',
      ],
      guide: [
        ['What makes a good resume', { list: ['One page for under about 10 years of experience; two at most otherwise.', 'Start each bullet with an action verb and add numbers: "Cut onboarding time by 30%".', 'Put the most relevant experience first and drop very old or unrelated jobs.', 'Use keywords from the job ad in your skills and experience; tracking systems match on them.'] }],
        ['How PDF export works', 'The "PDF — selectable text" option uses your browser\'s print function on pre-paginated pages, so the file contains real text and breaks pages exactly where the preview shows. The "image pages" options render each page to a picture, which looks identical everywhere but cannot be searched or copied.'],
        ['Which template should I choose?', { table: [['Template', 'Best for'], ['Classic, International', 'Corporate jobs and online application systems'], ['Sidebar, Elegant', 'Roles where a photo and a skills column help'], ['Banner, Bold, Timeline', 'Creative, marketing and product roles'], ['Compact, Minimal', 'Fitting a lot on one clean page'], ['Form', 'Formal applications in China, with a photo cell'], ['Developer, Academic', 'Engineering portfolios and research CVs']] }],
      ],
      faq: [
        ['Is this resume builder really free?', 'Yes. There is no sign-up, no payment and no watermark.'],
        ['Where is my information stored?', 'Only in your browser\'s local storage on this device. Nothing is uploaded. Use Export data (.json) to back up or move a resume to another computer.'],
        ['Will applicant tracking systems read my PDF?', 'The "PDF — selectable text" export contains real text, so systems can parse it. For best results use a single-column template such as Classic or International and standard section names.'],
        ['How do I get a PDF on my phone?', 'Use Export, then PDF. Your phone\'s print sheet lets you save or share it as a PDF. The "image pages" PDF downloads directly like any other file.'],
        ['Can I make a Chinese or bilingual resume?', 'Yes. Switch the site to 中文 for Chinese section titles and templates such as the formal form, and write in any language you like. All section titles can be renamed.'],
      ],
      ui: {},
    },
    zh: {
      name: '简历制作',
      short: '在 A4 页面上直接编辑，12 套模板，一键排成一页纸，导出 PDF 或图片。本地处理，无需注册。',
      keywords: ['简历制作', '免费简历模板', '在线简历', '简历生成器', '一页纸简历', '简历PDF', '求职简历'],
      title: '免费在线简历制作：12 套模板，导出 PDF，无需注册',
      desc: '在 A4 页面上直接点击编辑，12 套简历模板，模块拖拽排序、照片裁剪、一键排成一页纸，支持导出 PDF、PNG、JPG。全程在浏览器本地完成，无水印。',
      h1: '免费在线简历制作：所见即所得，导出 PDF',
      sub: '直接点击 A4 页面上的文字就能编辑，也可以用侧边栏表单填写。12 套模板随意切换，内容不变；模块可隐藏、重命名、拖动排序；照片支持裁剪成方形、2:3 证件照或圆形；一键排成一页纸，再导出可选中文字的 PDF 或 PNG/JPG 图片。所有内容只在你的浏览器里处理，不上传、不注册、无水印。',
      features: [
        ['layout-template', '12 套模板，内容不变', '经典单栏、侧栏、时间轴、创意色块、表格式、技术极客、学术等，切换模板不会改动你写的内容。'],
        ['file-user', '页面直接编辑 + 侧边栏', '在简历上直接输入并用工具条加粗、斜体、列表；也可使用结构化侧边栏，两边实时同步，手机上同样好用。'],
        ['shield-check', '隐私优先', '简历只保存在本机浏览器里，可导出 / 导入 JSON 在不同设备间迁移。'],
      ],
      howToTitle: '如何制作简历',
      steps: [
        '点击“新建简历”，选择与你岗位相近的示例，或从空白开始。',
        '点击页面上的文字直接修改；可添加、隐藏、重命名并拖动模块，需要时上传并裁剪照片。',
        '在“模板样式”中尝试模板、主题色、字体与间距；内容略超一页时打开“一页纸”。',
        '点击“导出”：选“PDF（可选中文字）”会打开打印窗口，目标选“另存为 PDF”；也可导出 PNG / JPG / 图片版 PDF。',
      ],
      guide: [
        ['一份好简历的要点', { list: ['工作经验不足 10 年尽量控制在一页，最多两页。', '每条描述以动词开头并量化成果，例如“将上线耗时缩短 30%”。', '最相关的经历放前面，过于久远或不相关的经历可以删减。', '把招聘启事里的关键词写进技能与经历，筛选系统会按关键词匹配。'] }],
        ['PDF 导出的原理', '“PDF（可选中文字）”调用浏览器的打印功能，页面已按预览预先分好页，所以文件里是真实文字，分页位置与预览完全一致。“图片”类导出把每页渲染成图片，在任何设备上看起来都一样，但无法搜索和复制文字。'],
        ['如何选择模板', { table: [['模板', '适合'], ['经典、国际版', '企业岗位与在线投递系统'], ['侧栏、雅致', '需要照片和技能栏的岗位'], ['创意色块、醒目、时间轴', '设计、运营、产品等偏创意岗位'], ['紧凑一页、极简', '想在一页里放更多内容'], ['表格式', '国内正式场合、需要照片栏'], ['技术极客、学术', '技术岗位与科研简历']] }],
      ],
      faq: [
        ['这个简历制作工具真的免费吗？', '是的，不需要注册、不收费，导出的文件也没有水印。'],
        ['我的个人信息保存在哪里？', '只保存在这台设备的浏览器本地存储里，不会上传到任何服务器。可以用“导出数据（.json）”备份，或迁移到另一台电脑。'],
        ['招聘系统能读取我的 PDF 吗？', '“PDF（可选中文字）”导出的是真实文字，系统可以解析。建议使用经典、国际版等单栏模板，并使用常见的模块名称。'],
        ['手机上怎么得到 PDF？', '点击“导出”再选 PDF，用手机的打印面板即可保存或分享为 PDF；“图片版 PDF”则会像普通文件一样直接下载。'],
        ['可以做英文或中英双语简历吗？', '可以。内容可以用任意语言书写，所有模块标题都能改名；切换到英文站点即可使用英文默认标题。'],
      ],
      ui: {},
    },
  },
  ui: () => html`
<div id="rv-root"><p class="hint">Loading the editor… This tool needs JavaScript.</p></div>`,
};
