import { html } from '../../build/html.mjs';

export default {
  id: 'resume-builder',
  category: 'docs',
  iconName: 'file-user',
  color: '#9333ea',
  related: ['edit-pdf', 'compress-pdf', 'compare-text'],
  appCategory: 'BusinessApplication',
  strings: {
  "en": {
    "name": "Resume Builder",
    "short": "Write a professional resume with live preview and download a PDF.",
    "keywords": [
      "cv maker",
      "resume maker",
      "free resume template",
      "create resume",
      "resume pdf",
      "curriculum vitae"
    ],
    "title": "Free Resume Builder — ATS-Friendly PDF, No Sign-up, No Watermark",
    "desc": "Build a professional resume: fill in the form, pick a template, see a live A4 preview, download an ATS-friendly PDF. Free, no sign-up, no watermark.",
    "h1": "Free resume builder with PDF download",
    "sub": "A free online resume builder: fill in the form, choose a template and accent colour, and watch the resume update as you type. Download a crisp, text-based PDF that recruiters and applicant tracking systems (ATS) can read — no account, no watermark.",
    "features": [
      [
        "layout-template",
        "Three clean templates",
        "Classic for ATS-heavy applications, Modern with a coloured sidebar and photo, Compact to fit more on one page."
      ],
      [
        "save",
        "Auto-saved drafts",
        "Everything you type is saved in this browser, so you can close the tab and continue later. Export your data to move devices."
      ],
      [
        "file-check",
        "ATS-friendly PDF",
        "The PDF contains real, selectable text — not a picture — so recruiters can search it and tracking systems can parse it."
      ]
    ],
    "steps": [
      "Fill in the form, or press \"Load example\" to start from a sample.",
      "Choose a template and colour; the preview updates live and shows where pages break.",
      "Press Download PDF, then save the result as PDF."
    ],
    "guide": [
      [
        "What makes a good resume",
        {
          "list": [
            "One page for under ~10 years of experience; two at most otherwise.",
            "Start bullet points with an action verb and add numbers: \"Cut onboarding time by 30%\".",
            "Put the most relevant experience first and drop very old or unrelated jobs.",
            "Use the job ad's own keywords in your skills and experience — tracking systems match on them."
          ]
        }
      ],
      [
        "Which template should I choose?",
        {
          "table": [
            [
              "Template",
              "Best for"
            ],
            [
              "Classic",
              "Corporate jobs and online application systems (most ATS-friendly)"
            ],
            [
              "Modern",
              "Creative, marketing and product roles; when a photo is expected"
            ],
            [
              "Compact",
              "Long experience you want to fit on one page"
            ]
          ]
        }
      ]
    ],
    "faq": [
      [
        "Is this resume builder really free?",
        "Yes — no sign-up, no payment, and no watermark on the PDF."
      ],
      [
        "Where is my information stored?",
        "Only in your browser's local storage on this device. Nothing is sent to a server. Use \"Export data\" to move your resume to another computer."
      ],
      [
        "Will applicant tracking systems (ATS) read my resume?",
        "Yes. The PDF contains real text. For the best results use the Classic template and standard section names."
      ],
      [
        "How do I get a PDF on my phone?",
        "Press Download PDF; the PDF downloads like any other file and appears in Files (iPhone) or Downloads (Android)."
      ],
      [
        "Can I make a resume in Chinese?",
        "Yes. Switch the site to 中文 for Chinese section titles and write in any language."
      ]
    ],
    "ui": {
      "personal": "Personal details",
      "name": "Full name",
      "headline": "Job title / headline",
      "email": "Email",
      "phone": "Phone",
      "location": "City, country",
      "website": "Website / LinkedIn",
      "photo": "Photo (optional)",
      "removePhoto": "Remove photo",
      "summary": "Profile summary",
      "summaryPh": "Two or three sentences about your experience and what you are looking for.",
      "experience": "Work experience",
      "company": "Company",
      "role": "Position",
      "start": "Start",
      "end": "End",
      "endPh": "Present",
      "bullets": "Achievements (one per line)",
      "addExp": "+ Add job",
      "education": "Education",
      "school": "School / university",
      "degree": "Degree / major",
      "addEdu": "+ Add education",
      "projects": "Projects",
      "project": "Project name",
      "projectDesc": "Description (one point per line)",
      "addProj": "+ Add project",
      "skills": "Skills",
      "skillsPh": "Comma separated, e.g. Excel, SQL, Project management",
      "extra": "Languages, certificates, awards",
      "extraPh": "One item per line",
      "template": "Template",
      "tClassic": "Classic",
      "tModern": "Modern",
      "tCompact": "Compact",
      "accent": "Accent colour",
      "download": "Download PDF",
      "printHint": "In the print dialog choose \"Save as PDF\" as the printer.",
      "example": "Load example",
      "clearAll": "Clear all",
      "confirmClear": "Delete everything in the form?",
      "exportData": "Export data",
      "importData": "Import data",
      "remove": "Remove",
      "up": "Up",
      "hSummary": "Profile",
      "hExperience": "Experience",
      "hEducation": "Education",
      "hProjects": "Projects",
      "hSkills": "Skills",
      "hExtra": "Additional",
      "present": "Present",
      "badImport": "This file is not a resume exported from this tool."
    }
  },
  "zh": {
    "name": "简历制作",
    "short": "在线写一份专业简历，实时预览，一键下载 PDF。",
    "keywords": [
      "简历模板",
      "在线简历",
      "免费简历",
      "简历生成器",
      "简历 pdf",
      "个人简历"
    ],
    "title": "在线简历制作 — 免费简历模板，下载 PDF，免注册无水印",
    "desc": "几分钟做出专业简历：填写表单，选择模板和主题色，实时预览 A4 效果，下载可被招聘系统（ATS）识别的 PDF。免费、免注册、无水印 —— 数据只存在你的浏览器里。",
    "h1": "免费在线简历制作，一键导出 PDF",
    "sub": "这是一个免费的在线简历制作工具：填写个人信息，选择模板和主题色，简历随输入实时更新 A4 预览。下载清晰的文字版 PDF，HR 和招聘系统（ATS）都能读取 —— 无需账号，没有水印。",
    "features": [
      [
        "layout-template",
        "三款简洁模板",
        "「经典」适合网申和招聘系统，「现代」带彩色侧栏和照片，「紧凑」能在一页里放下更多内容。"
      ],
      [
        "save",
        "草稿自动保存",
        "输入的内容会自动保存在当前浏览器中，关掉页面下次还能接着写；换设备时可以导出数据。"
      ],
      [
        "file-check",
        "招聘系统友好的 PDF",
        "PDF 里是可以选中的真实文字而不是图片，HR 可以搜索，招聘系统也能正确解析。"
      ]
    ],
    "steps": [
      "填写表单，或点击「载入示例」从示例开始。",
      "选择模板和颜色，预览会实时更新并显示分页位置。",
      "点击「下载 PDF」，PDF 会像普通文件一样保存到下载文件夹。"
    ],
    "guide": [
      [
        "好简历的要点",
        {
          "list": [
            "工作经验不到 10 年时尽量控制在一页，最多两页。",
            "每条经历用动词开头并加上数字，例如「把新人上手时间缩短 30%」。",
            "把最相关的经历放在前面，删掉很久以前或无关的工作。",
            "在技能和经历中使用招聘要求里的关键词 —— 招聘系统会按关键词匹配。"
          ]
        }
      ],
      [
        "模板怎么选？",
        {
          "table": [
            [
              "模板",
              "适合"
            ],
            [
              "经典",
              "大公司岗位和网申系统（对招聘系统最友好）"
            ],
            [
              "现代",
              "设计、市场、产品类岗位；需要照片时"
            ],
            [
              "紧凑",
              "经历丰富、希望放在一页里"
            ]
          ]
        }
      ]
    ],
    "faq": [
      [
        "这个简历工具真的免费吗？",
        "是的 —— 无需注册、不用付费，导出的 PDF 也没有水印。"
      ],
      [
        "我的信息保存在哪里？",
        "只保存在这台设备浏览器的本地存储中，不会发送到服务器。换电脑时可以用「导出数据」转移简历。"
      ],
      [
        "招聘系统（ATS）能读取我的简历吗？",
        "能。PDF 里是真实文字。想要效果最好，请使用「经典」模板和常规的栏目名称。"
      ],
      [
        "手机上怎么得到 PDF？",
        "点击「下载 PDF」，PDF 会保存到「文件」（iPhone）或下载文件夹（安卓）。"
      ],
      [
        "可以做英文简历吗？",
        "可以。把网站切换到 English，栏目标题就会变成英文，内容可以用任何语言填写。"
      ]
    ],
    "ui": {
      "personal": "个人信息",
      "name": "姓名",
      "headline": "求职意向 / 职位",
      "email": "邮箱",
      "phone": "电话",
      "location": "所在城市",
      "website": "个人网站 / 作品集",
      "photo": "照片（可选）",
      "removePhoto": "移除照片",
      "summary": "个人简介",
      "summaryPh": "用两三句话概括你的经验、优势和求职方向。",
      "experience": "工作经历",
      "company": "公司",
      "role": "职位",
      "start": "开始时间",
      "end": "结束时间",
      "endPh": "至今",
      "bullets": "工作内容与成果（每行一条）",
      "addExp": "+ 添加工作经历",
      "education": "教育背景",
      "school": "学校",
      "degree": "学历 / 专业",
      "addEdu": "+ 添加教育经历",
      "projects": "项目经历",
      "project": "项目名称",
      "projectDesc": "项目描述（每行一条）",
      "addProj": "+ 添加项目",
      "skills": "专业技能",
      "skillsPh": "用逗号分隔，例如：Excel, SQL, 项目管理",
      "extra": "语言、证书、荣誉",
      "extraPh": "每行一项",
      "template": "模板",
      "tClassic": "经典",
      "tModern": "现代",
      "tCompact": "紧凑",
      "accent": "主题色",
      "download": "下载 PDF",
      "printHint": "在打印窗口中，把打印机选为「另存为 PDF」。",
      "example": "载入示例",
      "clearAll": "清空",
      "confirmClear": "确定清空表单中的所有内容吗？",
      "exportData": "导出数据",
      "importData": "导入数据",
      "remove": "删除",
      "up": "上移",
      "hSummary": "个人简介",
      "hExperience": "工作经历",
      "hEducation": "教育背景",
      "hProjects": "项目经历",
      "hSkills": "专业技能",
      "hExtra": "其他",
      "present": "至今",
      "badImport": "这个文件不是从本工具导出的简历数据。"
    }
  }
},
  ui: (s) => html`
<div class="resume-app">
  <form class="resume-form" id="rb-form" autocomplete="on" onsubmit="return false">
    <div class="actions" style="margin:0 0 14px">
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
      <div class="actions" style="margin-top:10px"><label class="btn ghost sm" for="rb-photo">${s.photo}</label><input type="file" id="rb-photo" accept="image/*" hidden><button type="button" class="btn danger sm" id="rb-photo-rm" hidden>${s.removePhoto}</button></div>
    </fieldset>
    <fieldset><legend>${s.summary}</legend><textarea name="summary" rows="3" placeholder="${s.summaryPh}"></textarea></fieldset>
    <fieldset><legend>${s.experience}</legend><div id="rb-exp"></div><button type="button" class="btn ghost sm" id="rb-add-exp" style="margin-top:10px">${s.addExp}</button></fieldset>
    <fieldset><legend>${s.education}</legend><div id="rb-edu"></div><button type="button" class="btn ghost sm" id="rb-add-edu" style="margin-top:10px">${s.addEdu}</button></fieldset>
    <fieldset><legend>${s.projects}</legend><div id="rb-proj"></div><button type="button" class="btn ghost sm" id="rb-add-proj" style="margin-top:10px">${s.addProj}</button></fieldset>
    <fieldset><legend>${s.skills}</legend><textarea name="skills" rows="2" placeholder="${s.skillsPh}"></textarea>
      <label class="field" style="margin-top:10px"><span>${s.extra}</span><textarea name="extra" rows="3" placeholder="${s.extraPh}"></textarea></label></fieldset>
    <div class="actions"><button type="button" class="btn soft" id="rb-example">${s.example}</button><button type="button" class="btn ghost sm" id="rb-export">${s.exportData}</button><label class="btn ghost sm" for="rb-import">${s.importData}</label><input type="file" id="rb-import" accept="application/json,.json" hidden><button type="button" class="btn danger sm" id="rb-clear">${s.clearAll}</button></div>
  </form>
  <div class="resume-side">
    <div class="actions"><button class="btn lg" id="rb-print">${s.download}</button><span class="note">${s.printHint}</span></div>
    <div id="rb-status"></div>
    <div class="resume-scale" id="rb-scale"><div id="rb-paper"></div></div>
  </div>
</div>`,
};
