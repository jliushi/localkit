// Resume renderer: document -> sheet HTML for every template. Pure string output so the same
// markup serves the editable preview, the page windows for print/PDF, and image export.
import { lang, A4, D_, esc, mkRef, basicOf, cleanHtml } from './resume-data.js';
import { ri } from './resume-icons.js';

export const FONTS = {
  en: [
    ['en-sans', 'Sans', 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'],
    ['en-serif', 'Serif', 'Georgia, "Times New Roman", "Songti SC", SimSun, serif'],
    ['en-classic', 'Classic', '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Songti SC", SimSun, serif'],
    ['en-round', 'Rounded', 'ui-rounded, "Hiragino Maru Gothic ProN", "Century Gothic", Avenir, "Trebuchet MS", "Microsoft YaHei", sans-serif'],
    ['en-mono', 'Monospace', 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", "Microsoft YaHei", monospace'],
  ],
  zh: [
    ['zh-hei', '黑体（无衬线）', '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", system-ui, sans-serif'],
    ['zh-song', '宋体（衬线）', '"Songti SC", "Noto Serif SC", "Source Han Serif SC", SimSun, "Times New Roman", serif'],
    ['zh-kai', '楷体', '"Kaiti SC", KaiTi, STKaiti, "DFKai-SB", "Songti SC", serif'],
    ['zh-round', '圆体', 'ui-rounded, "Hiragino Maru Gothic ProN", "Yuanti SC", "Microsoft YaHei", "PingFang SC", sans-serif'],
    ['en-sans', 'Latin Sans', 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, "PingFang SC", "Microsoft YaHei", sans-serif'],
    ['en-serif', 'Latin Serif', 'Georgia, "Times New Roman", "Songti SC", SimSun, serif'],
  ],
};
const fontStack = (id) => (FONTS.zh.concat(FONTS.en).find((f) => f[0] === id) || FONTS[lang][0])[2].replace(/"/g, "'");

export const PALETTE = ['#1e4e8c', '#0f766e', '#2563eb', '#4f46e5', '#7c3aed', '#be185d', '#dc2626', '#d97706', '#15803d', '#0e7490', '#44403c', '#111827'];

// side: which module types live in the sidebar for two-column templates
const SIDE = ['skills', 'lang', 'cert', 'hobby'];
export const TPLS = [
  { id: 'classic', en: 'Classic', zh: '经典', layout: 'single', head: 'classic', photo: true, color: '#1e4e8c', skills: 'tags' },
  { id: 'sidebar', en: 'Sidebar', zh: '侧栏', layout: 'side', head: 'side', photo: true, color: '#0f766e', skills: 'bars', side: SIDE },
  { id: 'timeline', en: 'Timeline', zh: '时间轴', layout: 'single', head: 'classic', photo: true, color: '#2563eb', skills: 'tags' },
  { id: 'minimal', en: 'Minimal', zh: '极简', layout: 'single', head: 'center', photo: true, color: '#374151', skills: 'text' },
  { id: 'banner', en: 'Banner', zh: '创意色块', layout: 'single', head: 'banner', photo: true, color: '#4f46e5', skills: 'tags' },
  { id: 'compact', en: 'Compact', zh: '紧凑一页', layout: 'single', head: 'compact', photo: true, color: '#0f5f8f', skills: 'text' },
  { id: 'table', en: 'Form', zh: '表格式', layout: 'single', head: 'table', photo: true, color: '#1f2933', skills: 'text', font: { en: 'en-serif', zh: 'zh-song' } },
  { id: 'tech', en: 'Developer', zh: '技术极客', layout: 'single', head: 'tech', photo: false, color: '#0d9f6e', skills: 'tags', font: { en: 'en-mono', zh: 'en-mono' } },
  { id: 'academic', en: 'Academic', zh: '学术', layout: 'single', head: 'center', photo: false, color: '#7f1d1d', skills: 'text', font: { en: 'en-classic', zh: 'zh-song' } },
  { id: 'intl', en: 'International', zh: '国际版', layout: 'single', head: 'intl', photo: false, color: '#0b6e99', skills: 'text' },
  { id: 'elegant', en: 'Elegant', zh: '雅致', layout: 'side', head: 'side', photo: true, color: '#9a6b4f', skills: 'bars', side: SIDE, right: true, font: { en: 'en-classic', zh: 'zh-song' } },
  { id: 'bold', en: 'Bold', zh: '醒目', layout: 'single', head: 'bold', photo: true, color: '#e11d48', skills: 'tags' },
];
export const tplOf = (id) => TPLS.find((t) => t.id === id) || TPLS[0];

// ---------------------------------------------------------------- colour helpers
const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); return m ? m[1] : '1e4e8c'; };
export function onColor(c) {
  const h = hex(c); const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#1b1f24' : '#ffffff';
}

/** Effective style with the one-page-fit factor s (0 = as set, 1 = maximum squeeze). */
export function effStyle(doc, s = 0) {
  const st = doc.style;
  const lerp = (v, min) => v - (v - min) * s;
  return { ...st, fs: lerp(st.fs, Math.max(11.5, st.fs * 0.84)), lh: lerp(st.lh, 1.26), mg: lerp(st.mg, Math.min(st.mg, 30)), gap: lerp(st.gap, st.gap * 0.45), egap: lerp(st.egap, st.egap * 0.4) };
}
export function styleAttr(doc, s = 0) {
  const t = tplOf(doc.tpl), e = effStyle(doc, s);
  const ac = doc.style.color || t.color;
  const fid = doc.style.font || t.font?.[lang] || (lang === 'zh' ? 'zh-hei' : 'en-sans');
  const r = (n) => Math.round(n * 100) / 100;
  return `--ac:${ac};--on:${onColor(ac)};--fs:${r(e.fs)}px;--lh:${r(e.lh)};--mg:${r(e.mg)}px;--gap:${r(e.gap)}px;--egap:${r(e.egap)}px;--font:${fontStack(fid)}`;
}

// ---------------------------------------------------------------- field helpers
const wrapBare = (html) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  let run = null;
  for (const n of [...tpl.content.childNodes]) {
    const block = n.nodeType === 1 && ['UL', 'OL', 'P'].includes(n.tagName);
    if (block) { run = null; continue; }
    if (n.nodeType === 1 && n.tagName === 'BR' && !run) { n.remove(); continue; }
    if (!run) { run = document.createElement('p'); n.before(run); }
    run.append(n);
  }
  return tpl.innerHTML;
};
/** Sanitised, paragraph-wrapped rich text as stored in the model. */
export const richClean = (html) => wrapBare(cleanHtml(html));

export function makeCtx(doc, edit) {
  const F = (ref, val, ph, cls = '') => {
    val = val ?? '';
    if (!edit) return val ? `<span class="f ${cls}">${esc(val)}</span>` : '';
    return `<span class="f ${cls}" data-ref="${ref}" data-ph="${esc(ph)}" contenteditable="true" spellcheck="false">${esc(val)}</span>`;
  };
  const R = (ref, html, ph, cls = '') => {
    html = html ? richClean(html) : '';
    if (!edit) return html ? `<div class="f rv-desc ${cls}">${html}</div>` : '';
    return `<div class="f rv-desc ${cls}" data-ref="${ref}" data-rich="1" data-ph="${esc(ph)}" contenteditable="true">${html}</div>`;
  };
  return { F, R, edit, doc };
}

const CONTACTS = [['phone', 'phone'], ['email', 'mail'], ['city', 'map-pin'], ['site', 'globe'], ['birth', 'cake'], ['gender', 'user-round'], ['extra', 'info']];
const sep = ' – ';

function contactsHtml(c, bm, { icons = false, only } = {}) {
  const items = CONTACTS.filter(([k]) => !only || only.includes(k)).map(([k, ic]) => {
    const v = bm.d[k];
    if (!c.edit && !v) return '';
    return `<span class="rv-c rv-c-${k}">${icons ? ri(ic, 'rv-ci') : ''}${c.F(mkRef(bm.id, 'd', '', k), v, D_.ph[k])}</span>`;
  }).join('');
  return items ? `<div class="rv-contacts">${items}</div>` : '';
}

function jobHtml(c, doc) {
  const jm = doc.modules.find((m) => m.type === 'job' && !m.hidden);
  if (!jm) return '';
  const keys = ['pos', 'city', 'salary', 'start'];
  const items = keys.map((k) => {
    const v = jm.d[k];
    if (!c.edit && !v) return '';
    return `<span class="rv-jb"><em>${esc(D_.jobLabels[k])}</em>${c.F(mkRef(jm.id, 'd', '', k), v, D_.jobLabels[k])}</span>`;
  }).join('');
  return items ? `<div class="rv-job">${items}</div>` : '';
}

function photoHtml(c, doc, tpl, cls = '') {
  if (!tpl.photo || !doc.style.photoOn) return '';
  if (!doc.photo) return '';
  const shape = doc.photo.shape || 'square';
  return `<div class="rv-photo shape-${shape} ${cls}" ${c.edit ? 'data-act="photo" title="photo"' : ''}><img src="${esc(doc.photo.src)}" alt=""></div>`;
}

// ---------------------------------------------------------------- modules
function dateHtml(c, m, e) {
  const present = (m.type === 'work' || m.type === 'intern') ? D_.present : '';
  if (!c.edit) {
    const s = (e.start || '').trim(), en = (e.end || '').trim() || (s ? present : '');
    if (!s && !en) return '';
    return `<span class="rv-d">${esc(s)}${s && en ? sep : ''}${esc(en)}</span>`;
  }
  return `<span class="rv-d">${c.F(mkRef(m.id, 'e', e.id, 'start'), e.start, D_.ph.start)}<i>${sep}</i>${c.F(mkRef(m.id, 'e', e.id, 'end'), e.end, present || D_.ph.end)}</span>`;
}

function entryHtml(c, m, e) {
  const key = m.type === 'custom' ? 'custom' : m.type;
  const org = c.F(mkRef(m.id, 'e', e.id, 'org'), e.org, D_.ph.org[key] || D_.ph.org.custom, 'rv-t');
  const role = c.F(mkRef(m.id, 'e', e.id, 'role'), e.role, D_.ph.role[key] || D_.ph.role.custom, 'rv-r');
  const date = dateHtml(c, m, e);
  const desc = c.R(mkRef(m.id, 'e', e.id, 'desc'), e.desc, D_.ph.desc);
  if (!c.edit && !org && !role && !date && !desc) return '';
  const head = (org || role || date || c.edit) ? `<div class="rv-eh" data-atom data-keep>${org}${role}${date}</div>` : '';
  const tools = c.edit ? `<div class="rv-etools" contenteditable="false"><button type="button" class="rv-tb" data-act="egrip" title="drag">${ri('grip-vertical')}</button><button type="button" class="rv-tb" data-act="edup">${ri('copy')}</button><button type="button" class="rv-tb danger" data-act="edel">${ri('trash-2')}</button></div>` : '';
  return `<div class="rv-entry" data-eid="${e.id}">${tools}${head}${desc}</div>`;
}

function listHtml(c, m, tpl) {
  const items = m.items || [];
  const row = (it, inner) => `<div class="rv-iw" data-iid="${it.id}">${inner}</div>`;
  const nm = (it, ph = D_.ph.item) => c.F(mkRef(m.id, 'i', it.id, 't'), it.t, ph);
  const live = c.edit ? items : items.filter((i) => (i.t || '').trim());
  if (!live.length) return '';
  if (m.type === 'skills') {
    const view = m.view && m.view !== 'auto' ? m.view : tpl.skills;
    if (view === 'bars') {
      return `<div class="rv-bars">${live.map((it) => row(it, `<div class="rv-bar" data-atom><span class="rv-bn">${nm(it)}</span><i class="rv-lv" ${c.edit ? `data-act="level" data-mid="${m.id}" data-iid="${it.id}"` : ''}><b style="width:${Math.max(0, Math.min(100, it.lv ?? 0))}%"></b></i></div>`)).join('')}</div>`;
    }
    if (view === 'text' && !c.edit) return `<div class="rv-inline" data-atom>${live.map((it) => `<span>${esc(it.t)}</span>`).join('<i> · </i>')}</div>`;
    return `<div class="rv-tags ${view === 'text' ? 'plain' : ''}" data-atom>${live.map((it) => `<span class="rv-iw rv-tag" data-iid="${it.id}">${nm(it)}</span>`).join('')}</div>`;
  }
  if (m.type === 'hobby') return `<div class="rv-tags" data-atom>${live.map((it) => `<span class="rv-iw rv-tag" data-iid="${it.id}">${nm(it)}</span>`).join('')}</div>`;
  const dph = m.type === 'lang' ? D_.ph.level : D_.ph.date;
  return `<div class="rv-rows">${live.map((it) => row(it, `<div class="rv-row" data-atom><span class="rv-rt">${nm(it)}</span>${(c.edit || it.d) ? `<span class="rv-rd">${c.F(mkRef(m.id, 'i', it.id, 'd'), it.d, dph)}</span>` : ''}</div>`)).join('')}</div>`;
}

const hasContent = (m) => {
  if (m.kind === 'entries') return (m.entries || []).some((e) => e.org || e.role || e.start || e.end || (e.desc || '').trim());
  if (m.kind === 'list') return (m.items || []).some((i) => (i.t || '').trim());
  if (m.kind === 'text') return !!(m.text || '').replace(/<[^>]*>/g, '').trim();
  return false;
};

function moduleToolsHtml(m) {
  const add = m.kind === 'entries' ? 'add-entry' : m.kind === 'list' ? 'add-item' : '';
  return `<div class="rv-tools" contenteditable="false">`
    + `<button type="button" class="rv-tb" data-act="mgrip" title="drag">${ri('grip-vertical')}</button>`
    + `<button type="button" class="rv-tb" data-act="mup">${ri('arrow-up')}</button><button type="button" class="rv-tb" data-act="mdown">${ri('arrow-down')}</button>`
    + (add ? `<button type="button" class="rv-tb" data-act="${add}">${ri('plus')}</button>` : '')
    + `<button type="button" class="rv-tb" data-act="mhide">${ri('eye-off')}</button><button type="button" class="rv-tb danger" data-act="mdel">${ri('trash-2')}</button></div>`;
}

function moduleHtml(c, m, tpl) {
  if (!c.edit && !hasContent(m)) return '';
  let body = '';
  if (m.kind === 'entries') body = (m.entries || []).map((e) => entryHtml(c, m, e)).join('');
  else if (m.kind === 'list') body = listHtml(c, m, tpl);
  else if (m.kind === 'text') body = c.R(mkRef(m.id, 'm', '', 'text'), m.text, D_.ph.text, 'rv-text');
  const title = c.F(mkRef(m.id, 'm', '', 'title'), m.title, D_.ph.title);
  const ico = ri((m.type === 'custom' ? 'square-pen' : null) || ({ education: 'graduation-cap', work: 'briefcase', intern: 'building-2', project: 'folder-kanban', campus: 'users', skills: 'wand-sparkles', cert: 'badge-check', award: 'trophy', lang: 'languages', eval: 'message-square', hobby: 'heart', job: 'briefcase' }[m.type] || 'square-pen'), 'rv-mi');
  return `<section class="rv-mod rv-m-${m.type}" data-mid="${m.id}">${c.edit ? moduleToolsHtml(m) : ''}<h2 class="rv-mh" data-atom data-keep>${ico}<span class="rv-mt">${title}</span></h2><div class="rv-mb">${body}</div></section>`;
}

// ---------------------------------------------------------------- headers
function nameBlock(c, bm) {
  return `<h1 class="rv-name">${c.F(mkRef(bm.id, 'd', '', 'name'), bm.d.name, D_.ph.name)}</h1>${(c.edit || bm.d.headline) ? `<div class="rv-hl">${c.F(mkRef(bm.id, 'd', '', 'headline'), bm.d.headline, D_.ph.headline)}</div>` : ''}`;
}

function tableHead(c, doc, bm, tpl) {
  const cell = (k, label, span = '') => `<div class="rv-tl ${span}">${esc(label)}</div><div class="rv-tv ${span}">${c.F(mkRef(bm.id, 'd', '', k), bm.d[k], D_.ph[k])}</div>`;
  const L = D_.tblLabels;
  const jm = doc.modules.find((m) => m.type === 'job' && !m.hidden);
  const photo = doc.style.photoOn ? (doc.photo ? photoHtml(c, doc, tpl) : `<div class="rv-photo shape-square empty">${c.edit ? esc(lang === 'zh' ? '照片' : 'Photo') : ''}</div>`) : '';
  const jobCells = jm ? ['pos', 'city', 'salary', 'start'].map((k) => `<div class="rv-tl">${esc(D_.jobLabels[k])}</div><div class="rv-tv">${c.F(mkRef(jm.id, 'd', '', k), jm.d[k], D_.jobLabels[k])}</div>`).join('') : '';
  return `<header class="rv-head"><div class="rv-ttl">${esc(D_.tblTitle)}</div><div class="rv-tgrid ${photo ? 'with-photo' : ''}">`
    + `<div class="rv-tcells">${cell('name', L.name)}${cell('gender', L.gender)}${cell('birth', L.birth)}${cell('phone', L.phone)}${cell('email', L.email)}${cell('city', L.city)}${cell('headline', L.headline)}${cell('site', L.site)}${jobCells}</div>${photo ? `<div class="rv-tph">${photo}</div>` : ''}</div></header>`;
}

function headHtml(c, doc, bm, tpl) {
  const photo = photoHtml(c, doc, tpl);
  const job = jobHtml(c, doc);
  const name = nameBlock(c, bm);
  switch (tpl.head) {
    case 'center': return `<header class="rv-head">${photo}<div class="rv-hmain">${name}${contactsHtml(c, bm)}${job}</div></header>`;
    case 'banner': return `<header class="rv-head"><div class="rv-hband"><div class="rv-hmain">${name}${contactsHtml(c, bm, { icons: true })}</div>${photo}</div>${job}</header>`;
    case 'compact': return `<header class="rv-head"><div class="rv-hmain">${name}${job}</div><div class="rv-hside">${contactsHtml(c, bm, { icons: true })}</div>${photo}</header>`;
    case 'tech': return `<header class="rv-head"><div class="rv-prompt">~/resume $ whoami</div><div class="rv-hmain">${name}</div>${contactsHtml(c, bm, { icons: true })}${job}</header>`;
    case 'intl': return `<header class="rv-head"><div class="rv-hmain">${name}${job}</div>${contactsHtml(c, bm)}</header>`;
    case 'bold': return `<header class="rv-head"><div class="rv-hmain">${name}${contactsHtml(c, bm, { icons: true })}${job}</div>${photo}</header>`;
    case 'table': return tableHead(c, doc, bm, tpl);
    default: return `<header class="rv-head"><div class="rv-hmain">${name}${contactsHtml(c, bm)}${job}</div>${photo}</header>`;
  }
}

// ---------------------------------------------------------------- sheet
export function renderSheet(doc, { edit = false, fit = 0, pages = 1 } = {}) {
  const tpl = tplOf(doc.tpl);
  const c = makeCtx(doc, edit);
  const bm = basicOf(doc);
  const mods = doc.modules.filter((m) => !m.hidden && m.type !== 'basic' && m.type !== 'job');
  const cls = `rv-sheet t-${tpl.id} lay-${tpl.layout}${tpl.right ? ' right' : ''}${edit ? ' editing' : ''}${doc.style.photoOn && doc.photo && tpl.photo ? ' has-photo' : ''}`;
  const style = `${styleAttr(doc, fit)};min-height:${Math.max(1, pages) * A4.h}px`;
  let inner;
  if (tpl.layout === 'side') {
    const side = mods.filter((m) => tpl.side.includes(m.type)), main = mods.filter((m) => !tpl.side.includes(m.type));
    const photo = photoHtml(c, doc, tpl);
    inner = `<aside class="rv-side" data-flow>${photo}${contactsHtml(c, bm, { icons: true })}${side.map((m) => moduleHtml(c, m, tpl)).join('')}</aside>`
      + `<div class="rv-mainc" data-flow><header class="rv-head"><div class="rv-hmain">${nameBlock(c, bm)}${jobHtml(c, doc)}</div></header>${main.map((m) => moduleHtml(c, m, tpl)).join('')}</div>`;
  } else {
    inner = `${headHtml(c, doc, bm, tpl)}<div class="rv-flow" data-flow>${mods.map((m) => moduleHtml(c, m, tpl)).join('')}</div>`;
  }
  return `<div class="${cls}" style="${style}" data-tpl="${tpl.id}">${inner}</div>`;
}
