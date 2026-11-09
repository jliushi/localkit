// Resume document model: modules, defaults, storage, undo/redo.
import { LK, toast } from './lib.js';
import { validateResume } from './resume-legacy.js';
import { validDocument } from './resume-validation.js';

export const lang = LK.lang === 'zh' ? 'zh' : 'en';
export const uid = (p = 'm') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-2);
export const A4 = { w: 794, h: 1122 };

// ---------------------------------------------------------------- strings used by the document itself
const D = {
  en: {
    mod: { basic: 'Basic info', job: 'Job objective', education: 'Education', work: 'Work experience', intern: 'Internships', project: 'Projects', campus: 'Campus activities', skills: 'Skills', cert: 'Certificates', award: 'Awards', lang: 'Languages', eval: 'Summary', hobby: 'Interests', custom: 'Custom section', customText: 'Custom text' },
    present: 'Present',
    untitled: 'Untitled resume',
    ph: {
      name: 'Your name', headline: 'Job title', phone: 'Phone', email: 'Email', city: 'City', site: 'Website', birth: 'Birth date', gender: 'Gender', extra: 'Other',
      title: 'Section title', start: 'Start', end: 'End', desc: 'Describe what you did and achieved…', text: 'Write a short summary…', item: 'Item', date: 'Date', level: 'Level',
      org: { education: 'School', work: 'Company', intern: 'Company', project: 'Project name', campus: 'Organization', custom: 'Title' },
      role: { education: 'Major · Degree', work: 'Position', intern: 'Position', project: 'Your role', campus: 'Role', custom: 'Subtitle' },
    },
    jobLabels: { pos: 'Position', city: 'Location', salary: 'Salary', start: 'Available' },
    tblLabels: { name: 'Name', gender: 'Gender', birth: 'Born', phone: 'Phone', email: 'Email', city: 'City', site: 'Website', extra: 'Other', headline: 'Target role' },
    tblTitle: 'Resume',
  },
  zh: {
    mod: { basic: '基本信息', job: '求职意向', education: '教育背景', work: '工作经历', intern: '实习经历', project: '项目经历', campus: '校园经历', skills: '专业技能', cert: '证书资质', award: '荣誉奖项', lang: '语言能力', eval: '自我评价', hobby: '兴趣爱好', custom: '自定义模块', customText: '自定义文本' },
    present: '至今',
    untitled: '未命名简历',
    ph: {
      name: '姓名', headline: '应聘岗位', phone: '手机', email: '邮箱', city: '城市', site: '个人主页', birth: '出生年月', gender: '性别', extra: '其他',
      title: '模块标题', start: '开始', end: '结束', desc: '描述你的职责与成果……', text: '写几句话介绍自己……', item: '条目', date: '时间', level: '程度',
      org: { education: '学校名称', work: '公司名称', intern: '公司名称', project: '项目名称', campus: '组织名称', custom: '标题' },
      role: { education: '专业 · 学历', work: '职位', intern: '职位', project: '担任角色', campus: '担任角色', custom: '副标题' },
    },
    jobLabels: { pos: '意向岗位', city: '意向城市', salary: '期望薪资', start: '到岗时间' },
    tblLabels: { name: '姓名', gender: '性别', birth: '出生年月', phone: '手机', email: '邮箱', city: '所在城市', site: '个人主页', extra: '其他', headline: '应聘岗位' },
    tblTitle: '个 人 简 历',
  },
};
export const D_ = D[lang];

export const MODULE_TYPES = {
  basic: { icon: 'user-round', kind: 'data' },
  job: { icon: 'briefcase', kind: 'data' },
  education: { icon: 'graduation-cap', kind: 'entries' },
  work: { icon: 'briefcase', kind: 'entries' },
  intern: { icon: 'building-2', kind: 'entries' },
  project: { icon: 'folder-kanban', kind: 'entries' },
  campus: { icon: 'users', kind: 'entries' },
  skills: { icon: 'wand-sparkles', kind: 'list' },
  cert: { icon: 'badge-check', kind: 'list' },
  award: { icon: 'trophy', kind: 'list' },
  lang: { icon: 'languages', kind: 'list' },
  eval: { icon: 'message-square', kind: 'text' },
  hobby: { icon: 'heart', kind: 'list' },
  custom: { icon: 'square-pen', kind: 'entries' },
};
export const ADDABLE = ['education', 'work', 'intern', 'project', 'campus', 'skills', 'cert', 'award', 'lang', 'eval', 'hobby', 'job', 'custom', 'customText'];

export const emptyEntry = () => ({ id: uid('e'), org: '', role: '', start: '', end: '', desc: '' });
export const emptyItem = (type) => ({ id: uid('i'), t: '', ...(type === 'skills' ? { lv: 80 } : { d: '' }) });

export function newModule(type, opts = {}) {
  const base = type === 'customText' ? 'custom' : type;
  let kind = MODULE_TYPES[base].kind;
  if (type === 'customText') kind = 'text';
  const m = { id: uid(), type: base, kind, title: opts.title ?? (type === 'customText' ? D_.mod.customText : D_.mod[base]), hidden: false };
  if (kind === 'data') m.d = base === 'basic' ? { name: '', headline: '', phone: '', email: '', city: '', site: '', birth: '', gender: '', extra: '' } : { pos: '', city: '', salary: '', start: '' };
  if (kind === 'entries') m.entries = opts.blank ? [] : [emptyEntry()];
  if (kind === 'list') {
    m.items = opts.blank ? [] : [emptyItem(base), emptyItem(base)];
    if (base === 'skills') m.view = 'auto';
  }
  if (kind === 'text') m.text = '';
  return m;
}

export const DEFAULT_STYLE = { color: null, font: null, fs: 14, lh: 1.5, mg: 48, gap: 16, egap: 9, fit: false, photoOn: true };

export function blankDoc(name) {
  return {
    v: 2, id: uid('doc'), name: name || D_.untitled, tpl: 'classic', created: Date.now(), updated: Date.now(), style: { ...DEFAULT_STYLE }, photo: null,
    modules: ['basic', 'job', 'education', 'work', 'skills'].map((t) => newModule(t)),
  };
}

// ---------------------------------------------------------------- html helpers
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const bullets = (arr) => `<ul>${arr.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'A', 'UL', 'OL', 'LI', 'P', 'BR']);

/** Whitelist sanitizer for rich text: keeps b/i/u/a/ul/ol/li/p/br only. */
export function cleanHtml(src) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(src ?? '');
  const walk = (node) => {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) continue;
      if (ch.nodeType !== 1) { ch.remove(); continue; }
      if (ch.tagName === 'DIV') { const p = document.createElement('p'); p.append(...ch.childNodes); ch.replaceWith(p); walk(p); continue; }
      if (!ALLOWED.has(ch.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG'].includes(ch.tagName)) { ch.remove(); continue; }
        const kids = [...ch.childNodes];
        ch.replaceWith(...kids);
        for (const k of kids) if (k.nodeType === 1) { const w = document.createElement('div'); w.append(k.cloneNode(true)); walk(w); k.replaceWith(...w.childNodes); }
        continue;
      }
      for (const a of [...ch.attributes]) if (!(ch.tagName === 'A' && a.name === 'href')) ch.removeAttribute(a.name);
      if (ch.tagName === 'A') {
        const h = (ch.getAttribute('href') || '').trim();
        if (/^(javascript|data|vbscript):/i.test(h)) { ch.removeAttribute('href'); } else {
          if (!/^(https?:|mailto:|tel:)/i.test(h)) ch.setAttribute('href', /^[\w.+-]+@[\w.-]+$/.test(h) ? `mailto:${h}` : `https://${h}`);
          ch.setAttribute('target', '_blank'); ch.setAttribute('rel', 'noopener');
        }
      }
      walk(ch);
    }
  };
  walk(tpl.content);
  for (const e of [...tpl.content.querySelectorAll('p,li')]) if (!e.textContent.trim() && !e.querySelector('br')) e.remove();
  for (const e of [...tpl.content.querySelectorAll('ul,ol')]) if (!e.children.length) e.remove();
  return tpl.innerHTML;
}
export const htmlText = (html) => {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  for (const b of d.querySelectorAll('li,p,br')) b.after(' ');
  return d.textContent.replace(/\s+/g, ' ').trim();
};

// ---------------------------------------------------------------- migration
const KEY = `lk-resume2-${lang}`;
const OLD_KEY = `lk-resume-${lang}`;

function fromV1(o) {
  const d = blankDoc(o.name ? (lang === 'zh' ? `${o.name} 的简历` : `${o.name}'s resume`) : undefined);
  d.tpl = { classic: 'classic', modern: 'sidebar', compact: 'compact' }[o.template] || 'classic';
  if (o.accent) d.style.color = o.accent;
  if (o.photo) d.photo = { src: o.photo, orig: o.photo, shape: 'circle' };
  const by = (t) => d.modules.find((m) => m.type === t);
  Object.assign(by('basic').d, { name: o.name || '', headline: o.headline || '', phone: o.phone || '', email: o.email || '', city: o.location || '', site: o.website || '' });
  const lines = (s) => bullets(String(s || '').split('\n').map((x) => x.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean).map(esc));
  by('education').entries = (o.edu || []).filter((x) => x.school || x.degree).map((x) => ({ ...emptyEntry(), org: x.school || '', role: x.degree || '', start: x.start || '', end: x.end || '' }));
  by('work').entries = (o.exp || []).filter((x) => x.company || x.role).map((x) => ({ ...emptyEntry(), org: x.company || '', role: x.role || '', start: x.start || '', end: x.end || '', desc: x.bullets ? lines(x.bullets) : '' }));
  by('skills').items = String(o.skills || '').split(/[,，、;；\n]/).map((s) => s.trim()).filter(Boolean).map((t) => ({ id: uid('i'), t, lv: 80 }));
  if (o.summary) d.modules.splice(2, 0, { ...newModule('eval'), text: `<p>${esc(o.summary)}</p>` });
  if ((o.proj || []).some((x) => x.name || x.desc)) d.modules.push({ ...newModule('project'), entries: o.proj.filter((x) => x.name || x.desc).map((x) => ({ ...emptyEntry(), org: x.name || '', desc: x.desc ? lines(x.desc) : '' })) });
  if (o.extra) d.modules.push({ ...newModule('cert', { blank: true }), title: D_.mod.award, items: String(o.extra).split('\n').map((s) => s.trim()).filter(Boolean).map((t) => ({ id: uid('i'), t, d: '' })) });
  return d;
}

/** Makes sure a (possibly imported) object is a valid v2 document; null when it is not a resume. */
export function normalizeDoc(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  if (o.v !== 2) {
    try { return (o.exp || o.edu || o.name !== undefined) ? fromV1(validateResume(o)) : null; } catch { return null; }
  }
  if (!validDocument(o)) return null;
  const d = { ...blankDoc(), ...o, style: { ...DEFAULT_STYLE, ...(o.style || {}) } };
  d.modules = o.modules.filter((m) => m && MODULE_TYPES[m.type]).map((m) => {
    const base = newModule(m.type === 'custom' && m.kind === 'text' ? 'customText' : m.type, { blank: true });
    const out = { ...base, ...m, id: m.id || uid() };
    if (out.d) out.d = { ...base.d, ...out.d };
    for (const e of out.entries || []) e.id ||= uid('e');
    for (const e of out.items || []) e.id ||= uid('i');
    return out;
  });
  if (!d.modules.some((m) => m.type === 'basic')) d.modules.unshift(newModule('basic'));
  return d;
}

// ---------------------------------------------------------------- store
export function createStore(onChange) {
  let docs = [], curId = null, undo = [], redo = [], lastSnap = '', lastTouch = 0, lastRef = '', timer = 0;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.docs)) { docs = raw.docs.map(normalizeDoc).filter(Boolean); curId = raw.cur; }
  } catch { /* ignore */ }
  if (!docs.length) {
    try { const old = JSON.parse(localStorage.getItem(OLD_KEY)); const d = old && normalizeDoc(old); if (d) docs = [d]; } catch { /* ignore */ }
  }
  const fresh = !docs.length;
  if (fresh) docs = [blankDoc()];
  if (!docs.some((d) => d.id === curId)) curId = docs[0].id;

  const cur = () => docs.find((d) => d.id === curId);
  const snap = () => JSON.stringify(cur());
  lastSnap = snap();
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ docs, cur: curId })); }
    catch { toast(lang === 'zh' ? '浏览器未能保存草稿，请在离开页面前导出 JSON 备份。' : 'The browser could not save this draft. Export JSON before leaving this page.', 6000); }
  };
  const save = () => { clearTimeout(timer); timer = setTimeout(persist, 350); };

  const api = {
    fresh,
    get docs() { return docs; },
    get cur() { return cur(); },
    canUndo: () => undo.length > 0,
    canRedo: () => redo.length > 0,
    /** Call AFTER mutating the doc. A key coalesces typing bursts on the same field into one undo step. */
    changed(key = '') {
      const now = Date.now();
      if (!(key && key === lastRef && now - lastTouch < 900)) { undo.push(lastSnap); if (undo.length > 80) undo.shift(); }
      redo = [];
      lastRef = key; lastTouch = now;
      lastSnap = snap();
      cur().updated = now;
      save(); onChange?.('edit');
    },
    undo() { if (!undo.length) return; redo.push(snap()); this._apply(undo.pop()); },
    redo() { if (!redo.length) return; undo.push(snap()); this._apply(redo.pop()); },
    _apply(s) {
      const i = docs.findIndex((d) => d.id === curId);
      docs[i] = JSON.parse(s); lastSnap = s; lastRef = '';
      save(); onChange?.('history');
    },
    select(id) { if (docs.some((d) => d.id === id)) { curId = id; undo = []; redo = []; lastSnap = snap(); lastRef = ''; save(); onChange?.('switch'); } },
    add(doc) { docs.push(doc); this.select(doc.id); },
    duplicate() {
      const c = JSON.parse(snap());
      c.id = uid('doc'); c.name += lang === 'zh' ? ' 副本' : ' copy';
      for (const m of c.modules) { m.id = uid(); for (const e of m.entries || []) e.id = uid('e'); for (const e of m.items || []) e.id = uid('i'); }
      this.add(c);
    },
    remove(id = curId) {
      docs = docs.filter((d) => d.id !== id);
      if (!docs.length) docs = [blankDoc()];
      if (curId === id) curId = docs[0].id;
      undo = []; redo = []; lastSnap = snap(); save(); onChange?.('switch');
    },
    rename(name) { cur().name = name; save(); onChange?.('meta'); },
    flush() { clearTimeout(timer); persist(); },
  };
  window.addEventListener('pagehide', () => api.flush());
  return api;
}

// ---------------------------------------------------------------- field refs
// ref = "moduleId|kind|rowId|field"   kind: m (module) d (data) e (entry) i (item)
export const mkRef = (mid, kind, rid, field) => `${mid}|${kind}|${rid || ''}|${field}`;
export function resolveRef(doc, ref) {
  const [mid, kind, rid, field] = ref.split('|');
  const m = doc.modules.find((x) => x.id === mid);
  if (!m) return null;
  const obj = kind === 'm' ? m : kind === 'd' ? m.d : kind === 'e' ? m.entries?.find((e) => e.id === rid) : m.items?.find((e) => e.id === rid);
  return obj ? { obj, field, m } : null;
}
export const basicOf = (doc) => doc.modules.find((m) => m.type === 'basic');
