// Pure resume sheet renderer: DOM builders for all templates, the template
// catalogue, theme helpers and the print/preview frame assembly.
// The interactive (WYSIWYG) decorations are applied by resume-editor.js.
import { el, iconSync } from './lib.js';
import { A4, FONT_STACKS, THEMES } from './resume-model.js';
import { renderRuns } from './rich.js';
import { flowOfModule, jobRows } from './resume-render.js';

export const MODLANGS = {
  'zh-CN': { basic: '基本信息', job: '求职意向', education: '教育背景', work: '工作经历', intern: '实习经历', project: '项目经历', campus: '校园经历', skills: '专业技能', cert: '证书技能', award: '荣誉奖项', lang: '语言能力', eval: '自我评价', hobby: '兴趣爱好' },
  en: { basic: 'Basics', job: 'Job objective', education: 'Education', work: 'Experience', intern: 'Internships', project: 'Projects', campus: 'Campus', skills: 'Skills', cert: 'Certificates', award: 'Awards', lang: 'Languages', eval: 'Summary', hobby: 'Interests' },
};

/** Template catalogue: id, names, one-line description, structural kind, provenance. */
export const TEMPLATE_CATALOG = [
  ['classic', '经典', 'Classic', '单列通栏，稳定稳妥', 'Single column; stable and universally safe', 'flat', 'in-house'],
  ['airy', '通透', 'Airy', '大量留白，观感轻盈', 'Airy single column with generous white space', 'flat', 'layout inspired by vcflyer (MIT)'],
  ['flat', '紧凑', 'Flat', '紧凑单列，一页装更多', 'Compact single column', 'flat', 'Trevor-laser-style (MIT)'],
  ['ivory', '留白', 'Ivory', '深色窄边条 + 米白主列 + 底部简历学籍码', 'Thin dark rail, ivory main column', 'two', 'ivory (MIT)'],
  ['neon', '霓虹', 'Neon', '高饱和宽侧栏 + 主列卡片', 'High-saturation sidebar with soft cards', 'two', 'Neon-card (MIT)'],
  ['figure', '人物', 'Figure', '极简日系单列', 'Ultra-minimal single column', 'flat', 'rigyo (public)'],
  ['bob', '波点', 'Bob', '大标题 + 三列分组', 'Large name header, three-column groups', 'grid', 'Bob the builder (public)'],
  ['yolk', '蛋黄', 'Yolk', '白底 竖色条 双列分组', 'White sheet with a color rail, grouped columns', 'rail', 'Eggroll (public)'],
  ['orbit', '轨道', 'Orbit', '柔和大号侧栏，主列圆角', 'Soft wide sidebar, rounded main', 'two', 'design reference'],
  ['atlas', '黑岩', 'Atlas', '左右深色对分双栏', 'Symmetric dark two-column', 'two', 'design reference'],
  ['bfly', '蓝翅', 'Fly', '左侧深色侧栏 + 彩色装饰', 'Dark left sidebar + colored ornaments', 'two', 'design reference'],
  ['ledger', '表格', 'Ledger', '中文表格式简历（无照片）', 'Chinese table resume, no photo', 'table', 'in-house'],
  ['ledger2', '报表', 'Ledger II', '中文表格式简历（含照片）', 'Chinese table resume with photo', 'table', 'in-house'],
  ['typewriter', '打字机', 'Typewriter', '等宽字体学术风（无照片）', 'Monospace academic (no photo)', 'flat', 'academic CSS (MIT)'],
];

export const TEMPLATES = {};
for (const [id, zhd, en, dzh, den, kind, provenance] of TEMPLATE_CATALOG) {
  TEMPLATES[id] = { id, zh: zhd, en, dzh, den, kind, provenance, previewMod: previewOf(id) };
}
function previewOf(id) {
  const flat = ['classic', 'airy', 'flat', 'figure', 'typewriter', 'ledger', 'ledger2'];
  const two = ['neon', 'orbit', 'ivory', 'atlas', 'bfly'];
  return flat.includes(id) ? ['work', 'award', 'cert', 'skills']
    : two.includes(id) ? ['award', 'cert', 'skills']
      : ['work', 'award', 'cert'];
}

// ---------------------------------------------------------------- theme

const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); return m ? m[1].toLowerCase() : '0d3b66'; };
const rgbA = (hexColor, a) => { const h = hex(hexColor); const [r, g, b] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; return `rgba(${r},${g},${b},${a})`; };
const rgb6 = (c) => { const h = hex(c); return `rgb(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)})`; };
export const themeFor = (doc) => {
  const preset = THEMES.find((x) => x.id === doc.style.theme) || THEMES[0];
  return { ...preset, accent: `#${hex(doc.accent || preset.accent)}` };
};

// ---------------------------------------------------------------- primitives

// ---------------------------------------------------------------- primitives

export const META_JOIN = '  ·  ';

/** Editable single line of text: kind = plain | title | one */
export function penLine(text, path, kind = 'plain', cls = 'pv-line') {
  const node = el('span', { class: cls, 'data-pen': kind, 'data-path': path }, document.createTextNode(text || ''));
  return node;
}

/** Rich-text body: paragraphs of runs (WYSIWYG rich field). */
export function richField(paras, path, cls = 'pv-body') {
  const box = el('div', { class: cls, 'data-pen': 'rich', 'data-path': path });
  const list = paras || [];
  for (const p of list) {
    const node = el(p.bullet ? 'div' : 'p', { class: p.bullet ? 'pv-li' : 'pv-p' });
    for (const c of renderRuns(p)) node.append(c);
    if (!node.childNodes.length) node.append(document.createElement('br'));
    box.append(node);
  }
  if (!box.childNodes.length) { const p = el('p', { class: 'pv-p' }); p.append(document.createElement('br')); box.append(p); }
  return box;
}

/** Module title (editable) */
export function moduleTitleEl(m) {
  return el('h2', { class: 'pv-mt', 'data-pen': 'title', 'data-path': `m.${m.id}.title` }, document.createTextNode(m.title || ''));
}

/** Entry head line: title (left) + date (right) + optional sub line. */
export function entryHeadEl(e, mod, t) {
  const h = e.head || {};
  const start = (e.when?.start || '').trim(), end = (e.when?.end || '').trim() || t('present');
  const when = start || (e.when?.end || '').trim() ? `${start || '…'} — ${end}` : '';
  const subParts = [h.org, h.role, e.extra?.name, e.extra?.year, e.extra?.score].filter(Boolean);
  const row = el('div', { class: 'pv-eh', 'data-entry': e.id, 'data-mod-id': mod.id });
  const line = el('div', { class: 'pv-eh-line' },
    penLine(h.title || '', `m.${mod.id}.i${e.id}.head.title`, 'plain', 'pv-eh-title'),
    when ? el('span', { class: 'pv-eh-date' }, penLine(start || '…', `m.${mod.id}.i${e.id}.when.endstart`, 'plain', 'pv-eh-ds'), document.createTextNode(' — '), penLine((e.when?.end || '').trim(), `m.${mod.id}.i${e.id}.when.end`, 'plain', 'pv-eh-de')) : null);
  row.append(line);
  if (subParts.length) row.append(el('div', { class: 'pv-eh-sub' }, penLine(subParts.join(META_JOIN), `m.${mod.id}.i${e.id}.head.meta`, 'plain', 'pv-eh-subv')));
  return row;
}

/** Key/value pairs (basic info, job intention…). items = [[label, value, key], …] */
export function kvBox(m, t, items, cls = 'pv-kvals') {
  const box = el('div', { class: cls });
  for (const [label, value, key] of items.filter((x) => x[1])) {
    box.append(el('div', { class: 'pv-kv' },
      el('b', { class: 'pv-k', texts: [label.endsWith(':') || label.endsWith('：') ? label : `${label} :`] }),
      penLine(value, `m.${m.id}.entry.${key}`, 'plain', 'pv-v')));
  }
  return box;
}

/** Tags (skills/hobby): plain-editable chips. tags = [{name, level}] */
export function tagsEl(m, tags) {
  const box = el('div', { class: 'pv-tags' });
  for (const tag of tags) {
    const chip = el('span', { class: 'pv-tag' });
    chip.append(penLine(tag.name, `m.${m.id}.tag.${tag.name}`, 'plain', 'pv-tag-t'));
    const lv = Math.round(Number(tag.level) || 0);
    if (lv > 0) chip.append(el('span', { class: 'pv-lvto dots', 'data-lv': lv }, [1, 2, 3, 4, 5].map((i) => el('i', { class: i <= lv ? 'on' : '' }))));
    box.append(chip);
  }
  return box;
}

/** Rows (cert/award/lang): name (+ dots / level text / year). */
export function rowsEl(m, rows, kind) {
  const box = el('div', { class: 'pv-rows' });
  for (const r of rows) {
    if (kind === 'lang' || (typeof r.level === 'string' && r.level)) {
      box.append(el('div', { class: 'pv-row' },
        penLine(r.name, `m.${m.id}.row.${r.name}.name`, 'plain', 'pv-row-n'),
        r.level ? el('span', { class: 'pv-row-val' }, penLine(String(r.level), `m.${m.id}.row.${r.name}.level`, 'plain', 'pv-row-v')) : null,
        r.year ? el('span', { class: 'pv-row-yr' }, penLine(String(r.year), `m.${m.id}.row.${r.name}.year`, 'plain', 'pv-row-y')) : null));
    } else {
      const lv = Math.max(0, Math.min(5, Math.round(Number(r.level) || 0)));
      const row = el('div', { class: 'pv-row' }, penLine(r.name, `m.${m.id}.row.${r.name}.name`, 'plain', 'pv-row-n'));
      if (lv > 0) row.append(el('span', { class: 'pv-lvto dots', 'data-lv': lv }, [1, 2, 3, 4, 5].map((i) => el('i', { class: i <= lv ? 'on' : '' }))));
      if (r.year) row.append(el('span', { class: 'pv-row-yr' }, penLine(String(r.year), `m.${m.id}.row.${r.name}.year`, 'plain', 'pv-row-y')));
      box.append(row);
    }
  }
  return box;
}

// ---------------------------------------------------------------- heads

const VIS = (doc) => doc.modules.filter((m) => !m.hidden);
const WITHOUT_HEAD = (doc) => VIS(doc).filter((m) => !['basic', 'job'].includes(m.type));

export const contactItems = (doc, t) => {
  const e = doc.modules.find((m) => m.type === 'basic')?.entry || {};
  return [[t('f.loc'), e.loc, 'loc'], [t('f.phone'), e.phone, 'phone'], [t('f.email'), e.email, 'email'], [t('f.site'), e.site, 'site'], [t('f.wechat'), e.wechat, 'wechat'], [t('f.gender'), e.gender, 'gender']].filter((x) => x[1]);
};
export const jobModuleItems = (doc, t) => {
  const m = doc.modules.find((x) => x.type === 'job');
  if (!m || m.hidden) return { m: null, items: [] };
  const e = m.entry || {};
  return { m, items: [[t('job.title'), e.title, 'title'], [t('job.city'), e.city, 'city'], [t('job.salary'), e.salary, 'salary'], [t('job.start'), e.start, 'start']].filter((x) => x[1]) };
};

/** Photo node (shape from style, click affordance handled by the host). */
export function photoEl(doc) {
  const shape = doc.style.photoShape || 'square';
  const ph = el('div', { class: `pv-photo pv-photo-${shape}${doc.photo ? '' : ' is-empty'}` });
  if (doc.photo) ph.append(el('img', { src: doc.photo, alt: '' }));
  else ph.append(iconSync('camera', 'ic pv-photo-ic'));
  return ph;
}

/** Name + headline + contact line. */
export function identityEl(doc, t, cls = 'pv-id') {
  const id = el('hgroup', { class: cls });
  id.append(penLine(doc.info.name || '', 'info.name', 'plain', 'pv-name'));
  if (doc.info.title || doc.info.birth) {
    id.append(el('p', { class: 'pv-head' },
      doc.info.title ? penLine(doc.info.title, 'info.title', 'plain', 'pv-head-t') : null,
      doc.info.title && doc.info.birth ? el('i', { class: 'pv-dot' }) : null,
      doc.info.birth ? penLine(doc.info.birth, 'info.birth', 'plain', 'pv-birth') : null));
  }
  const basicsId = doc.modules.find((m) => m.type === 'basic')?.id || 'x';
  const c = contactItems(doc, t).map(([, v, k]) => ({ v, k }));
  if (c.length) id.append(el('p', { class: 'pv-contacts' },
    c.flatMap(({ v, k }, i) => [i ? el('i', { class: 'pv-sep' }) : null, penLine(v, `m.${basicsId}.entry.${k}`, 'plain', 'pv-cl')]).filter(Boolean)));
  return id;
}

// ---------------------------------------------------------------- modules

/** Job intention module (top, beside identity in most templates). */
export function jobEl(doc, t) {
  const { m, items } = jobModuleItems(doc, t);
  if (!m || !items.length) return null;
  return section(m, t, kvBox(m, t, items, 'pv-kvals job'), 'pv-se-jobT');
}

function section(mod, t, body, cls = '') {
  return el('section', { class: `pv-se pv-se-${mod.type} ${cls}`, 'data-mod': mod.id }, moduleTitleEl(mod), body);
}

function renderModuleBody(m, t) {
  const flows = flowOfModule(m, t);
  if (m.type === 'basic') return kvBox(m, t, contactItems({ modules: [m] }, t), 'pv-kvals contact');
  const box = el('div', { class: 'pv-mb' });
  for (const flow of flows) {
    if (flow.type === 'list') {
      for (const item of flow.items) {
        const e = (m.entries || []).find((x) => x.id === item.id);
        if (!e) continue;
        const wrap = el('article', { class: 'pv-item', 'data-entry': e.id, 'data-mod-id': m.id });
        wrap.append(entryHeadEl(e, m, t));
        if (e.text?.length) wrap.append(richField(e.text, `m.${m.id}.i${e.id}.text`));
        box.append(wrap);
      }
    } else if (flow.type === 'tags') box.append(tagsEl(m, flow.tags));
    else if (flow.type === 'rows') box.append(rowsEl(m, flow.rows, flow.kind));
    else if (flow.type === 'paras') box.append(richField(flow.paras, `m.${m.id}.text`));
    else if (flow.type === 'cr') box.append(kvBox(m, t, contactItems({ modules: [m] }, t), 'pv-kvals contact'));
  }
  return box;
}

/** Renders a list of modules as sections, for a lane. */
export function modsFor(mods, t, cls = '') {
  return mods.map((m) => {
    const body = renderModuleBody(m, t);
    if (!body || (body.childNodes.length === 0 && m.type !== 'basic')) return null;
    return section(m, t, body, cls);
  }).filter(Boolean);
}

// ---------------------------------------------------------------- template layers

function flatLayer(doc, t) {
  const mods = WITHOUT_HEAD(doc);
  const head = el('div', { class: 'pv-headline', 'data-slot': 'head' },
    doc.style.photoVisible ? photoEl(doc) : null,
    identityEl(doc, t),
    jobEl(doc, t));
  return { kind: 'flat', head, lanes: { flow: modsFor(mods, t) }, sideMods: [], mainMods: mods };
}

function tableLayer(doc, t, withPhoto) {
  const mods = WITHOUT_HEAD(doc);
  const basicM = VIS(doc).find((m) => m.type === 'basic');
  const jobM = VIS(doc).find((m) => m.type === 'job');
  const table = el('div', { class: 'pv-tablegrid' });
  table.append(el('div', { class: 'pv-tr pv-tr-head', 'data-slot': 'head' },
    el('div', { class: 'pv-td pv-name-cell' },
      doc.info.name ? penLine(doc.info.name, 'info.name', 'plain', 'pv-name big') : null,
      doc.info.title ? penLine(doc.info.title, 'info.title', 'plain', 'pv-head-t') : null),
    withPhoto && doc.style.photoVisible ? el('div', { class: 'pv-td pv-photo-cell' }, photoEl(doc)) : null));
  if (basicM && contactItems(doc, t).length) table.append(tr(basicM, kvBox(basicM, t, contactItems(doc, t), 'pv-kvals')));
  if (jobM && jobModuleItems(doc, t).items.length) table.append(tr(jobM, kvBox(jobM, t, jobModuleItems(doc, t).items, 'pv-kvals')));
  for (const m of mods) {
    const body = renderModuleBody(m, t);
    if (body) table.append(tr(m, body));
  }
  return { kind: 'table', table, sideMods: [], mainMods: mods };
}
function tr(m, body) {
  return el('div', { class: 'pv-tr pv-modrow', 'data-mod': m.id },
    el('div', { class: 'pv-td pv-td-title' }, moduleTitleEl(m)),
    el('div', { class: 'pv-td pv-td-body' }, body));
}

function twoLayer(doc, t, tpl) {
  const SIDE = {
    neon: ['skills', 'cert', 'lang', 'hobby', 'award'],
    orbit: ['skills', 'cert', 'lang', 'hobby', 'eval', 'award'],
    atlas: ['skills', 'cert', 'hobby', 'lang', 'award'],
    ivory: ['work', 'custom', 'project', 'campus'],
    bfly: ['skills', 'cert', 'award', 'lang', 'hobby'],
  }[tpl] || [];
  const mods = WITHOUT_HEAD(doc);
  const side = mods.filter((m) => SIDE.includes(m.type));
  const main = mods.filter((m) => !SIDE.includes(m.type));
  const head = el('div', { class: 'pv-headline', 'data-slot': 'head' },
    doc.style.photoVisible ? photoEl(doc) : null,
    identityEl(doc, t),
    jobEl(doc, t));
  return { kind: 'two', tpl, head, lanes: { side: modsFor(side, t, 'in-side'), main: modsFor(main, t) }, sideMods: side, mainMods: main, footer: footerEl(doc, t, tpl) };
}
const footerEl = (doc, t) => {
  const c = contactItems(doc, t);
  if (!c.length) return null;
  const basicsId = doc.modules.find((m) => m.type === 'basic')?.id || 'x';
  return el('div', { class: 'pv-foot' }, c.map(([, v, k]) => penLine(v, `m.${basicsId}.entry.${k}`, 'plain', 'pv-flv')));
};

function bobLayer(doc, t) {
  const mods = WITHOUT_HEAD(doc);
  const basicsId = doc.modules.find((m) => m.type === 'basic')?.id || 'x';
  const colA = mods.filter((m) => ['education'].includes(m.type));
  const colB = mods.filter((m) => ['campus', 'custom'].includes(m.type));
  const colC = mods.filter((m) => ['work', 'intern'].includes(m.type));
  const bottom = mods.filter((m) => !['education', 'work', 'intern', 'campus', 'custom'].includes(m.type));
  const head = el('div', { class: 'pv-bob-head', 'data-slot': 'head' },
    el('div', { class: 'pv-bob-id' },
      doc.info.name ? penLine(doc.info.name, 'info.name', 'plain', 'pv-name xxl') : null,
      doc.info.title ? penLine(doc.info.title, 'info.title', 'plain', 'pv-head-t') : null,
      contactItems(doc, t).length ? el('p', { class: 'pv-clines' }, contactItems(doc, t).map(([, v, k]) => penLine(v, `m.${basicsId}.entry.${k}`, 'plain', 'pv-cl'))) : null),
    doc.style.photoVisible ? photoEl(doc) : null);
  return { kind: 'grid', head, cols: { A: modsFor(colA, t), B: modsFor(colB, t), C: [...modsFor(colC, t), jobEl(doc, t)].filter(Boolean) }, bottom: modsFor(bottom, t), colMods: { A: colA, B: colB, C: colC }, bottomMods: bottom };
}

function yolkLayer(doc, t) {
  const mods = WITHOUT_HEAD(doc);
  const rail = mods.filter((m) => ['campus', 'custom', 'award', 'cert', 'skills'].includes(m.type));
  const main = mods.filter((m) => !['campus', 'custom', 'award', 'cert', 'skills'].includes(m.type));
  const head = el('div', { class: 'pv-headline', 'data-slot': 'head' },
    doc.style.photoVisible ? photoEl(doc) : null,
    identityEl(doc, t),
    jobEl(doc, t));
  return { kind: 'rail', head, lanes: { rail: modsFor(rail, t, 'in-rail'), main: modsFor(main, t) }, sideMods: rail, mainMods: main };
}

// ---------------------------------------------------------------- roots

const LAYERS = {
  classic: flatLayer, airy: flatLayer, flat: flatLayer, figure: flatLayer, typewriter: flatLayer,
  neon: twoLayer, orbit: twoLayer, atlas: twoLayer, ivory: twoLayer, bfly: twoLayer,
  bob: (d, t) => bobLayer(d, t), yolk: (d, t) => yolkLayer(d, t),
  ledger: (d, t) => tableLayer(d, t, false), ledger2: (d, t) => tableLayer(d, t, true),
};

/** Builds the root frame for the template. Returns { frame, layer }. */
export function buildRoots(doc, t, opts = {}) {
  const tpl = doc.template in LAYERS ? doc.template : 'classic';
  const layer = LAYERS[tpl](doc, t, tpl);
  const style = doc.style;
  const theme = THEMES.find((x) => x.id === style.theme) || THEMES[0];
  const accent = doc.accent || theme.accent;
  const css = {
    '--pv-accent': accent, '--pv-accent-44': rgbA(accent, 0.44), '--pv-accent-16': rgbA(accent, 0.16),
    '--pv-ink': theme.ink, '--pv-paper': theme.paper,
    '--pv-fsize': `${style.fontSize}px`, '--pv-lead': style.lineHeight,
    'font-family': FONT_STACKS[style.font] || FONT_STACKS['zh-hei'], lineHeight: style.lineHeight, fontSize: `${style.fontSize}px`,
    '--pv-mgap': `${style.moduleGap}px`, '--pv-igap': `${style.itemGap}px`, '--pv-hgap': `${style.headGap}px`,
  };
  const dark = theme.paper.toLowerCase() !== '#ffffff';
  const frame = el('div', { class: `pv${dark ? ' pv-dark' : ''} pv-${tpl}`, style: css, 'data-tpl': tpl });
  const slotOf = (laneEl, cls = 'pv-lane') => {
    const w = el('div', { class: cls });
    const lane = el('div', { 'data-slot': '' });
    return { lane, wrap: w };
  };
  if (layer.kind === 'two') {
    const cols = el('div', { class: 'pv-cols' });
    const sideLane = el('div', { class: 'pv-lane pv-side' }); sideLane.append(makeSlot('side', layer.lanes.side));
    const mainLane = el('div', { class: 'pv-lane pv-main' }); mainLane.append(makeSlot('main', layer.lanes.main));
    cols.append(sideLane, mainLane);
    if (layer.tpl === 'atlas' || layer.tpl === 'ivory') frame.append(layer.head, cols, layer.footer || null);
    else if (layer.tpl === 'bfly') frame.append(el('i', { class: 'pv-wing' }), layer.head, cols);
    else frame.append(el('div', { class: 'pv-top', 'data-slot': 'head' }, layer.head), cols);
  } else if (layer.kind === 'grid') {
    const c3 = el('div', { class: 'pv-cols3' },
      el('div', { class: 'pv-lane pv-col-a' }, makeSlot('A', layer.cols.A)),
      el('div', { class: 'pv-lane pv-col-b' }, makeSlot('B', layer.cols.B)),
      el('div', { class: 'pv-lane pv-col-c' }, makeSlot('C', layer.cols.C)));
    frame.append(layer.head, c3, el('div', { class: 'pv-flow', 'data-slot': 'flow' }, layer.bottom));
  } else if (layer.kind === 'rail') {
    frame.append(layer.head,
      el('div', { class: 'pv-cols pv-cols-yolk' },
        el('div', { class: 'pv-lane pv-rail' }, makeSlot('side', layer.lanes.rail)),
        el('div', { class: 'pv-lane pv-main' }, makeSlot('main', layer.lanes.main))));
  } else if (layer.kind === 'table') {
    frame.append(layer.table);
  } else {
    frame.append(layer.head, el('div', { class: 'pv-flow', 'data-slot': 'flow' }, layer.lanes.flow));
  }
  return { frame, layer };
}
function makeSlot(slot, kids) { return el('div', { 'data-slot': slot }, kids.filter(Boolean)); }
}

/** Structural glyph for the template picker. */
export function glyphFor(tpl) {
  const kind = TEMPLATES[tpl]?.kind || 'flat';
  const L = (cls) => el('i', { class: `g-l ${cls}` });
  const lines = (n = 3) => Array.from({ length: n }, (_, i) => L(i === 0 ? 'g-lg' : ''));
  const photo = ['atlas', 'typewriter', 'ledger'].includes(tpl) ? null : el('i', { class: 'g-ph' });
  let headKids;
  if (tpl === 'bob') headKids = [L('g-xxl'), el('span', { class: 'g-f' }, L(), L('g-sm')), photo];
  else if (tpl === 'figure') headKids = [L('g-xl'), L('g-sm')];
  else if (tpl === 'yolk') headKids = [el('i', { class: 'g-bar' }), el('span', { class: 'g-f' }, L('g-lg'), L()), photo];
  else if (tpl === 'ledger' || tpl === 'ledger2') headKids = [L('g-xl'), tpl === 'ledger2' ? photo : null];
  else headKids = [el('span', { class: 'g-f' }, L('g-lg'), L(), L('g-sm')), photo];
  let body;
  if (kind === 'two') body = el('span', { class: 'g-cols2' }, el('span', { class: 'g-col g-side' }, lines(3)), el('span', { class: 'g-col g-main' }, lines(5)));
  else if (kind === 'grid') body = el('span', { class: 'g-cols3' }, el('span', { class: 'g-col' }, lines(3)), el('span', { class: 'g-col' }, lines(3)), el('span', { class: 'g-col' }, lines(4)));
  else if (kind === 'rail') body = el('span', { class: 'g-cols2' }, el('span', { class: 'g-col g-rail' }, lines(3)), el('span', { class: 'g-col g-main' }, lines(5)));
  else if (kind === 'table') body = el('span', { class: 'g-table' }, Array.from({ length: 9 }, () => el('i')));
  else body = el('span', { class: 'g-col' }, lines(tpl === 'flat' ? 8 : 6));
  return el('span', { class: `tpg g-${kind} g-${tpl}` }, el('i', { class: 'g-head-band' }, headKids.filter(Boolean)), body);
}
