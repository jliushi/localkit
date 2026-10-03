import { $, t, LK, el, download, status } from './lib.js';
import { validateResume } from './resume-data.js';

const KEY = `lk-resume-${LK.lang}`;
const form = $('#rb-form');
const paper = $('#rb-paper');
const st = status($('#rb-status'));
const LISTS = {
  exp: { box: '#rb-exp', fields: [['company', 'company'], ['role', 'role'], ['start', 'start'], ['end', 'end', 'endPh'], ['bullets', 'bullets', null, true]] },
  edu: { box: '#rb-edu', fields: [['school', 'school'], ['degree', 'degree'], ['start', 'start'], ['end', 'end']] },
  proj: { box: '#rb-proj', fields: [['name', 'project'], ['desc', 'projectDesc', null, true]] },
};
const SIMPLE = ['template', 'accent', 'name', 'headline', 'email', 'phone', 'location', 'website', 'summary', 'skills', 'extra'];
const empty = () => ({ template: 'classic', accent: '#0f766e', photo: null, exp: [{}], edu: [{}], proj: [], ...Object.fromEntries(SIMPLE.filter((k) => !['template', 'accent'].includes(k)).map((k) => [k, ''])) });

let data = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return { ...empty(), ...validateResume(saved) };
  } catch { /* no saved draft */ }
  return empty();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch { st.error(new Error(t('saveFailed'))); }
}

// ---------------------------------------------------------------- form

function renderLists() {
  for (const [list, def] of Object.entries(LISTS)) {
    $(def.box).replaceChildren(...data[list].map((item, i) => el('div', { class: 'item' },
      el('div', { class: 'grid2' }, def.fields.filter((f) => !f[3]).map(([key, label, ph]) =>
        el('label', { class: 'field' }, el('span', { text: t(label) }), el('input', { type: 'text', value: item[key] || '', placeholder: ph ? t(ph) : null, 'data-list': list, 'data-i': i, 'data-key': key })))),
      def.fields.filter((f) => f[3]).map(([key, label]) =>
        el('label', { class: 'field', style: 'margin-top:8px' }, el('span', { text: t(label) }), el('textarea', { rows: 3, 'data-list': list, 'data-i': i, 'data-key': key }, item[key] || ''))),
      el('div', { class: 'row' },
        i > 0 ? el('button', { type: 'button', class: 'btn danger', text: `↑ ${t('up')}`, onclick: () => { const a = data[list]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; renderLists(); update(); } }) : null,
        el('button', { type: 'button', class: 'btn danger', text: t('remove'), onclick: () => { data[list].splice(i, 1); renderLists(); update(); } })))));
  }
}

function fillForm() {
  for (const k of SIMPLE) if (form.elements[k]) form.elements[k].value = data[k] ?? '';
  $('#rb-photo-rm').hidden = !data.photo;
  renderLists();
}

form.addEventListener('input', (e) => {
  const tEl = e.target;
  if (tEl.dataset.list) data[tEl.dataset.list][Number(tEl.dataset.i)][tEl.dataset.key] = tEl.value;
  else if (tEl.name && SIMPLE.includes(tEl.name)) data[tEl.name] = tEl.value;
  update();
});
form.addEventListener('change', (e) => { if (e.target.name === 'template') update(); });

for (const [list, btn] of [['exp', '#rb-add-exp'], ['edu', '#rb-add-edu'], ['proj', '#rb-add-proj']]) {
  $(btn).addEventListener('click', () => { data[list].push({}); renderLists(); update(); });
}

$('#rb-photo').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  let bmp;
  try {
  bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
  const side = Math.min(bmp.width, bmp.height);
  const cv = el('canvas', { width: 360, height: 360 });
  cv.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 360, 360);
  data.photo = cv.toDataURL('image/jpeg', 0.85);
  $('#rb-photo-rm').hidden = false;
  update();
  } catch (err) { st.error(err); }
  finally { bmp?.close(); }
});
$('#rb-photo-rm').addEventListener('click', () => { data.photo = null; $('#rb-photo-rm').hidden = true; update(); });

// ---------------------------------------------------------------- preview

const lines = (text) => String(text || '').split('\n').map((l) => l.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean);
const range = (a, b) => [a, b || (a ? t('present') : '')].filter(Boolean).join(' – ');

function section(title, ...content) {
  const items = content.flat().filter(Boolean);
  return items.length ? el('section', { class: 'cv-sec' }, el('h2', { text: title }), items) : null;
}

function render() {
  const d = data;
  const contacts = [d.email, d.phone, d.location, d.website].filter(Boolean);
  const exp = d.exp.filter((x) => x.company || x.role).map((x) => el('div', { class: 'cv-item' },
    el('div', { class: 'cv-row' }, el('strong', { text: [x.role, x.company].filter(Boolean).join(' · ') }), el('span', { class: 'cv-date', text: range(x.start, x.end) })),
    lines(x.bullets).length ? el('ul', {}, lines(x.bullets).map((l) => el('li', { text: l }))) : null));
  const edu = d.edu.filter((x) => x.school || x.degree).map((x) => el('div', { class: 'cv-item' },
    el('div', { class: 'cv-row' }, el('strong', { text: x.school || '' }), el('span', { class: 'cv-date', text: range(x.start, x.end) })),
    x.degree ? el('div', { text: x.degree }) : null));
  const proj = d.proj.filter((x) => x.name).map((x) => el('div', { class: 'cv-item' },
    el('strong', { text: x.name }),
    lines(x.desc).length ? el('ul', {}, lines(x.desc).map((l) => el('li', { text: l }))) : null));
  const skills = String(d.skills || '').split(/[,，、;；\n]/).map((s) => s.trim()).filter(Boolean);
  const skillEl = skills.length ? el('ul', { class: 'cv-tags' }, skills.map((s) => el('li', { text: s }))) : null;
  const extra = lines(d.extra).length ? el('ul', {}, lines(d.extra).map((l) => el('li', { text: l }))) : null;
  const photo = d.photo ? el('img', { class: 'cv-photo', src: d.photo, alt: '' }) : null;
  const head = el('header', { class: 'cv-head' }, photo,
    el('div', {}, el('h1', { text: d.name || '' }), d.headline ? el('div', { class: 'cv-headline', text: d.headline }) : null,
      d.template !== 'modern' && contacts.length ? el('div', { class: 'cv-contacts', text: contacts.join('  ·  ') }) : null));

  const page = el('div', { class: `cv cv-${d.template}`, style: `--cv-accent:${d.accent || '#0f766e'}` });
  if (d.template === 'modern') {
    page.append(
      el('aside', { class: 'cv-side' }, photo, el('h1', { text: d.name || '' }), d.headline ? el('div', { class: 'cv-headline', text: d.headline }) : null,
        contacts.length ? el('ul', { class: 'cv-contact-list' }, contacts.map((x) => el('li', { text: x }))) : null,
        section(t('hSkills'), skillEl), section(t('hExtra'), extra)),
      el('div', { class: 'cv-main' },
        section(t('hSummary'), d.summary ? el('p', { text: d.summary }) : null),
        section(t('hExperience'), exp), section(t('hProjects'), proj), section(t('hEducation'), edu)));
    if (photo) head.remove();
  } else {
    page.append(head,
      section(t('hSummary'), d.summary ? el('p', { text: d.summary }) : null),
      section(t('hExperience'), exp), section(t('hProjects'), proj), section(t('hEducation'), edu),
      section(t('hSkills'), skillEl), section(t('hExtra'), extra));
  }
  paper.replaceChildren(page);
  fit();
}

function fit() {
  const cv = paper.firstElementChild;
  if (!cv) return;
  const avail = $('#rb-scale').clientWidth - 24;
  const k = Math.min(1, avail / cv.offsetWidth);
  paper.style.transform = `scale(${k})`;
  paper.style.transformOrigin = 'top left';
  paper.style.width = `${cv.offsetWidth}px`;
  paper.style.height = `${cv.offsetHeight * k}px`;
}
window.addEventListener('resize', fit);

let timer = null;
function update() {
  clearTimeout(timer);
  timer = setTimeout(() => { render(); save(); }, 120);
}

// ---------------------------------------------------------------- actions

$('#rb-print').addEventListener('click', () => {
  clearTimeout(timer);
  render(); save();
  const root = el('div', { id: 'print-root' }, paper.firstElementChild.cloneNode(true));
  document.body.append(root);
  document.body.classList.add('printing');
  const prevTitle = document.title;
  document.title = (data.name || 'resume').replace(/[\\/:*?"<>|]/g, '');
  const done = () => { root.remove(); document.body.classList.remove('printing'); document.title = prevTitle; };
  window.addEventListener('afterprint', done, { once: true });
  window.print();
  setTimeout(() => { if (document.body.classList.contains('printing') && !matchMedia('print').matches) done(); }, 1000);
});

const EXAMPLE = {
  en: {
    name: 'Alex Chen', headline: 'Product Designer', email: 'alex.chen@example.com', phone: '+1 555 0100', location: 'Seattle, USA', website: 'alexchen.design',
    summary: 'Product designer with 6 years of experience turning complex workflows into simple, accessible interfaces. Led design for products used by 2 million people.',
    exp: [
      { company: 'Northwind Apps', role: 'Senior Product Designer', start: '2022', end: '', bullets: 'Redesigned onboarding, raising activation from 41% to 58%\nBuilt and maintained the design system used by 6 product teams\nMentored 3 junior designers' },
      { company: 'Contoso Labs', role: 'Product Designer', start: '2019', end: '2022', bullets: 'Designed the mobile app from first sketch to 500k downloads\nRan 40+ usability studies and turned findings into a research library' },
    ],
    edu: [{ school: 'University of Washington', degree: 'B.Des. Interaction Design', start: '2015', end: '2019' }],
    proj: [{ name: 'Accessible Forms Kit', desc: 'Open-source form components meeting WCAG 2.2 AA\n1.2k stars on GitHub' }],
    skills: 'Figma, Prototyping, Design systems, User research, Accessibility, HTML/CSS', extra: 'English (native), Mandarin (fluent)\nGoogle UX Design Certificate',
  },
  zh: {
    name: '陈晓明', headline: '产品经理', email: 'xiaoming.chen@example.com', phone: '138 0000 0000', location: '上海', website: 'xiaoming.design',
    summary: '5 年互联网产品经验，擅长把复杂业务梳理成简单好用的产品。主导的产品服务超过 200 万用户。',
    exp: [
      { company: '某科技有限公司', role: '高级产品经理', start: '2022.03', end: '', bullets: '负责会员体系改版，付费转化率从 3.1% 提升到 4.6%\n搭建数据看板，推动 6 个团队用数据做决策\n带领 3 名产品专员' },
      { company: '某互联网公司', role: '产品经理', start: '2019.07', end: '2022.02', bullets: '从 0 到 1 设计移动端 App，上线一年下载量 50 万\n主持 40 余次用户访谈，建立用户研究库' },
    ],
    edu: [{ school: '某某大学', degree: '本科 · 信息管理与信息系统', start: '2015', end: '2019' }],
    proj: [{ name: '智能客服系统', desc: '设计自动问答流程，人工客服工作量减少 35%\n获公司年度最佳项目' }],
    skills: 'Axure, Figma, SQL, 数据分析, 用户研究, 项目管理', extra: '英语六级\nPMP 项目管理认证',
  },
};

$('#rb-example').addEventListener('click', () => { data = { ...empty(), ...structuredClone(EXAMPLE[LK.lang] || EXAMPLE.en), template: data.template, accent: data.accent }; fillForm(); update(); });
$('#rb-clear').addEventListener('click', () => { if (confirm(t('confirmClear'))) { data = empty(); fillForm(); update(); } });
$('#rb-export').addEventListener('click', () => download(new Blob([JSON.stringify({ localkitResume: 1, ...data }, null, 2)], { type: 'application/json' }), 'resume-data.json'));
$('#rb-import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const obj = JSON.parse(await f.text());
    if (obj?.localkitResume !== 1) throw new Error(t('badImport'));
    const clean = validateResume(obj);
    data = { ...empty(), ...clean };
    fillForm();
    update();
    st.clear();
  } catch (err) {
    st.error(new Error(t('badImport')));
  }
});

fillForm();
render();
window.addEventListener('pagehide', save);
