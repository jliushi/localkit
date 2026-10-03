import { html } from '../../build/html.mjs';

export default {
  id: 'resume-builder',
  category: 'docs',
  icon: 'CV',
  color: '#9333ea',
  strings: {
    en: {
      name: 'Resume Builder',
      title: 'Free Resume Builder — Make a Professional CV and Download PDF, No Sign-up',
      desc: 'Create a professional resume in minutes with clean templates and live preview, then save it as a PDF. Free, no sign-up, no watermark; your data stays in your browser.',
      h1: 'Free resume builder with PDF download',
      lead: 'Fill in your details, pick a template and colour, and watch your resume update live. Save it as a crisp, text-searchable PDF that applicant tracking systems can read.',
      steps: [
        'Fill in the form (or click "Load example" to see how it works). Your draft is saved automatically in this browser.',
        'Choose a template and accent colour; the preview updates as you type.',
        'Click "Download PDF" and choose "Save as PDF" in the print dialog.',
      ],
      faq: [
        ['Is it really free?', 'Yes — no sign-up, no paywall and no watermark on the PDF.'],
        ['Where is my data stored?', 'Only in your browser (local storage), so you can close the tab and continue later on the same device. Use "Export data" to move your resume to another computer.'],
        ['Is the PDF readable by applicant tracking systems (ATS)?', 'Yes. The PDF contains real text, not an image, so ATS software and recruiters can search and copy it. The Classic template is the safest choice for ATS.'],
        ['How do I get a one-page resume?', 'Keep 3–5 bullet points per job, focus on the last 10 years and use the Compact template. The preview shows the page break.'],
        ['Can I write my resume in Chinese?', 'Yes. Switch the site to 中文 to get Chinese section titles, and type in any language.'],
      ],
      ui: {
        personal: 'Personal details', name: 'Full name', headline: 'Job title / headline', email: 'Email', phone: 'Phone', location: 'City, country', website: 'Website / LinkedIn', photo: 'Photo (optional)', removePhoto: 'Remove photo',
        summary: 'Profile summary', summaryPh: 'Two or three sentences about your experience and what you are looking for.',
        experience: 'Work experience', company: 'Company', role: 'Position', start: 'Start', end: 'End', endPh: 'Present', bullets: 'Achievements (one per line)', addExp: '+ Add job',
        education: 'Education', school: 'School / university', degree: 'Degree / major', addEdu: '+ Add education',
        projects: 'Projects', project: 'Project name', projectDesc: 'Description (one point per line)', addProj: '+ Add project',
        skills: 'Skills', skillsPh: 'Comma separated, e.g. Excel, SQL, Project management', extra: 'Languages, certificates, awards', extraPh: 'One item per line',
        template: 'Template', tClassic: 'Classic', tModern: 'Modern', tCompact: 'Compact', accent: 'Accent colour',
        download: 'Download PDF', printHint: 'In the print dialog choose "Save as PDF" as the printer.', example: 'Load example', clearAll: 'Clear all', confirmClear: 'Delete everything in the form?',
        exportData: 'Export data', importData: 'Import data', remove: 'Remove', up: 'Up',
        hSummary: 'Profile', hExperience: 'Experience', hEducation: 'Education', hProjects: 'Projects', hSkills: 'Skills', hExtra: 'Additional', present: 'Present',
        badImport: 'This file is not a resume exported from this tool.',
        saveFailed: 'The browser could not save this draft. Export the data before leaving this page.',
      },
    },
    zh: {
      name: '在线简历制作',
      title: '免费在线简历制作 — 专业简历模板，一键下载 PDF，无需注册',
      desc: '几分钟做出专业简历：简洁模板、实时预览，保存为 PDF。免费、免注册、无水印，数据只保存在你的浏览器里。',
      h1: '免费在线简历制作，一键导出 PDF',
      lead: '填写信息、选择模板和配色，简历实时更新。导出为清晰、可搜索文字的 PDF，招聘系统（ATS）也能正确读取。',
      steps: [
        '填写表单（也可以点「载入示例」看看效果）。草稿会自动保存在当前浏览器中。',
        '选择模板和主题色，预览会随输入实时更新。',
        '点击「下载 PDF」，在打印窗口中选择「另存为 PDF」。',
      ],
      faq: [
        ['真的免费吗？', '是的，无需注册、不收费，导出的 PDF 也没有水印。'],
        ['我的数据保存在哪里？', '只保存在你的浏览器（本地存储）中，关闭页面后在同一设备上可以继续编辑。用「导出数据」可以把简历转移到其他电脑。'],
        ['导出的 PDF 能被招聘系统识别吗？', '能。PDF 中是真实文字而不是图片，招聘系统和 HR 都可以搜索和复制。「经典」模板对 ATS 最友好。'],
        ['怎样把简历控制在一页？', '每段工作写 3–5 条要点，重点写近 10 年的经历，并使用「紧凑」模板。预览中会显示分页位置。'],
        ['可以做英文简历吗？', '可以。把网站切换到 English，栏目标题就会变成英文，内容可以用任何语言填写。'],
      ],
      ui: {
        personal: '个人信息', name: '姓名', headline: '求职意向 / 职位', email: '邮箱', phone: '电话', location: '所在城市', website: '个人网站 / 作品集', photo: '照片（可选）', removePhoto: '移除照片',
        summary: '个人简介', summaryPh: '用两三句话概括你的经验、优势和求职方向。',
        experience: '工作经历', company: '公司', role: '职位', start: '开始时间', end: '结束时间', endPh: '至今', bullets: '工作内容与成果（每行一条）', addExp: '+ 添加工作经历',
        education: '教育背景', school: '学校', degree: '学历 / 专业', addEdu: '+ 添加教育经历',
        projects: '项目经历', project: '项目名称', projectDesc: '项目描述（每行一条）', addProj: '+ 添加项目',
        skills: '专业技能', skillsPh: '用逗号分隔，例如：Excel, SQL, 项目管理', extra: '语言、证书、荣誉', extraPh: '每行一项',
        template: '模板', tClassic: '经典', tModern: '现代', tCompact: '紧凑', accent: '主题色',
        download: '下载 PDF', printHint: '在打印窗口中，把打印机选为「另存为 PDF」。', example: '载入示例', clearAll: '清空', confirmClear: '确定清空表单中的所有内容吗？',
        exportData: '导出数据', importData: '导入数据', remove: '删除', up: '上移',
        hSummary: '个人简介', hExperience: '工作经历', hEducation: '教育背景', hProjects: '项目经历', hSkills: '专业技能', hExtra: '其他', present: '至今',
        badImport: '这个文件不是从本工具导出的简历数据。',
        saveFailed: '浏览器未能保存草稿，请在离开页面前导出数据备份。',
      },
    },
  },
  ui: (s) => html`
<div class="resume-app">
  <form class="resume-form" id="rb-form" autocomplete="on" onsubmit="return false">
    <div class="row" style="margin:0 0 12px">
      <label class="field" style="flex:1"><span>${s.template}</span><select name="template"><option value="classic">${s.tClassic}</option><option value="modern">${s.tModern}</option><option value="compact">${s.tCompact}</option></select></label>
      <label class="field"><span>${s.accent}</span><input type="color" name="accent" value="#0f766e"></label>
    </div>
    <fieldset><legend>${s.personal}</legend>
      <div class="grid2">
        <label class="field"><span>${s.name}</span><input type="text" name="name" autocomplete="name"></label>
        <label class="field"><span>${s.headline}</span><input type="text" name="headline" autocomplete="organization-title"></label>
        <label class="field"><span>${s.email}</span><input type="email" name="email" autocomplete="email"></label>
        <label class="field"><span>${s.phone}</span><input type="tel" name="phone" autocomplete="tel"></label>
        <label class="field"><span>${s.location}</span><input type="text" name="location"></label>
        <label class="field"><span>${s.website}</span><input type="text" name="website" autocomplete="url"></label>
      </div>
      <div class="row"><label class="btn ghost" for="rb-photo">${s.photo}</label><input type="file" id="rb-photo" accept="image/*" hidden><button type="button" class="btn danger" id="rb-photo-rm" hidden>${s.removePhoto}</button></div>
    </fieldset>
    <fieldset><legend>${s.summary}</legend><textarea name="summary" rows="3" placeholder="${s.summaryPh}"></textarea></fieldset>
    <fieldset><legend>${s.experience}</legend><div id="rb-exp"></div><button type="button" class="btn ghost" id="rb-add-exp">${s.addExp}</button></fieldset>
    <fieldset><legend>${s.education}</legend><div id="rb-edu"></div><button type="button" class="btn ghost" id="rb-add-edu">${s.addEdu}</button></fieldset>
    <fieldset><legend>${s.projects}</legend><div id="rb-proj"></div><button type="button" class="btn ghost" id="rb-add-proj">${s.addProj}</button></fieldset>
    <fieldset><legend>${s.skills}</legend><textarea name="skills" rows="2" placeholder="${s.skillsPh}"></textarea>
      <label class="field" style="margin-top:10px"><span>${s.extra}</span><textarea name="extra" rows="3" placeholder="${s.extraPh}"></textarea></label></fieldset>
    <div class="row"><button type="button" class="btn ghost" id="rb-example">${s.example}</button><button type="button" class="btn ghost" id="rb-export">${s.exportData}</button><label class="btn ghost" for="rb-import">${s.importData}</label><input type="file" id="rb-import" accept="application/json,.json" hidden><button type="button" class="btn danger" id="rb-clear">${s.clearAll}</button></div>
  </form>
  <div class="resume-preview-wrap">
    <div class="row" style="margin:0 0 10px"><button class="btn big" id="rb-print">${s.download}</button><span class="muted small">${s.printHint}</span></div>
    <div class="status" id="rb-status" hidden></div>
    <div class="resume-scale" id="rb-scale"><div id="rb-paper"></div></div>
  </div>
</div>`,
};
