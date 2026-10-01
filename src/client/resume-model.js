// Resume document model: schema, module definitions, migration from v1 drafts,
// and the in-memory store (documents list + undo/redo + autosave).

export const uid = (p = 'm') => p + Math.random().toString(36).slice(2, 8);

export const A4 = { w: 794, h: 1123 }; // px at 96 dpi (210×297 mm)

export const FONT_STACKS = {
  'en-classic': '"Baskerville", "Palatino Linotype", Palatino, Georgia, serif',
  'en-geometric': 'ui-rounded, "Hiragino Maru Gothic ProN", "Kenney Future Narrow", Futura, "Century Gothic", Avenir, "Trebuchet MS", "PingFang SC", "Microsoft YaHei", sans-serif',
  'en-serif': 'Georgia, "Times New Roman", SimSun, serif',
  'en-sans': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  'en-typewriter': 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", "Noto Sans Mono", monospace',
  'zh-hei': '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  'zh-song': 'Georgia, "Times New Roman", "SimSun", "Songti SC", "NSimSun", serif',
  'zh-kai': '"KaiTi", "STKaiti", "DFKai-SB", "TW-Kai", serif',
  'zh-round': 'ui-rounded, "Hiragino Maru Gothic ProN", "Kenney Future Narrow", Futura, "Century Gothic", "Yuanti SC", "STYuanti", "Microsoft YaHei", sans-serif',
};
export const FONT_DEFAULT = { classic: 'zh-hei', airy: 'zh-geometric', flat: 'zh-hei', ivory: 'zh-hei', neon: 'zh-geometric', figure: 'zh-song', ledger: 'zh-song', ledger2: 'zh-hei', bob: 'zh-hei', yolk: 'zh-geometric', orbit: 'zh-song', atlas: 'en-sans', typewriter: 'en-typewriter' };
FONT_STACKS['zh-geometric'] = FONT_STACKS['en-geometric'];

export const THEMES = [
  { id: 'graphite', ink: '#0d1b3e', paper: '#ffffff', accent: '#0d3b66', soft: '#6b7fbf' },
  { id: 'terracotta', ink: '#5a2312', paper: '#f2ead3', accent: '#8a3f25', soft: '#b8986f' },
  { id: 'neon', ink: '#ffffff', paper: '#151f6a', accent: '#61f7ff', soft: '#93a9ff' },
  { id: 'oxford', ink: '#241348', paper: '#ffffff', accent: '#6d28d9', soft: '#a78bfa' },
  { id: 'teal', ink: '#13403c', paper: '#ffffff', accent: '#0f766e', soft: '#5eead4' },
  { id: 'brick', ink: '#4a1010', paper: '#ffffff', accent: '#b91c1c', soft: '#fca5a5' },
  { id: 'indigo', ink: '#1e1b4b', paper: '#ffffff', accent: '#3730a3', soft: '#a5b4fc' },
  { id: 'forest', ink: '#14532d', paper: '#ffffff', accent: '#166534', soft: '#86efac' },
];

export const DEFAULT_STYLE = {
  theme: 'graphite', accent: '#0d3b66', font: 'zh-hei', fontSize: 10.5, lineHeight: 1.5,
  margin: 64, moduleGap: 12, itemGap: 8, headGap: 12,
  photoShape: 'square', photoVisible: true,
};

// ---------------------------------------------------------------- modules

export const MODULE_TYPES = {
  basic: { icon: 'user-round' },
  job: { icon: 'briefcase' },
  education: { icon: 'graduation-cap', hasEntries: true },
  work: { icon: 'briefcase', hasEntries: true },
  intern: { icon: 'folder-kanban', hasEntries: true },
  project: { icon: 'clipboard-list', hasEntries: true },
  campus: { icon: 'graduation-cap', hasEntries: true },
  skills: { icon: 'wand-sparkles' },
  cert: { icon: 'badge-check' },
  award: { icon: 'trophy' },
  lang: { icon: 'languages' },
  eval: { icon: 'message-square-quote' },
  hobby: { icon: 'heart-handshake' },
  custom: { icon: 'square-pen', hasEntries: true },
};
const ORDER_BASE = ['basic', 'job'];
const ORDER_MAIN = ['education', 'work', 'intern', 'project', 'campus', 'skills', 'cert', 'award', 'lang', 'eval', 'hobby'];

/** Creates an empty module of a type. zhDoc=null → use lang for default titles via t(). */
export function newModule(type, t) {
  const single = { email: '', phone: '', loc: '', site: '', gender: '', wechat: '' };
  const entry = () => ({ id: uid('i') });
  const m = { id: uid(), type, title: t[`mod.${type}`] || type, entries: [], hidden: false };
  if (type === 'basic') m.entry = { ...single };
  else if (type === 'job') m.entry = { title: '', city: '', salary: '', start: '' };
  else if (type === 'skills') m.entry = { tags: [] };
  else if (type === 'cert' || type === 'award') m.entry = { rows: [] };
  else if (type === 'lang') m.entry = { rows: [] };
  else if (type === 'eval') m.entry = { paras: [] };
  else if (type === 'hobby') m.entry = { tags: [] };
  else m.entries = [entry()];
  return m;
}

/** Empty document shell. */
export function newDoc(lang, name) {
  const modules = [...ORDER_BASE, 'education', 'work', 'skills', 'award'].map((type) => newModule(type, (k) => k));
  return {
    v: 2, id: uid('doc'), name: name || (lang === 'zh' ? '未命名简历' : 'Untitled resume'), createdAt: Date.now(), updatedAt: Date.now(),
    info: { name: '', title: '', birth: '' },
    photo: null,
    template: 'classic', accent: THEMES[0].accent, style: { ...DEFAULT_STYLE },
    modules,
    lib: false,
  };
}

/** Applies localized default titles to a fresh module list. */
export function localizeTitles(doc, names) {
  for (const m of doc.modules) if (m.title === `mod.${m.type}`) m.title = names[m.type] || m.type;
  return doc;
}

/** Extracts representative content for a reusable "graphic layout frame" (布局载体). */
export function frameFromDoc(doc) {
  return {
    name: doc.name, info: structuredClone(doc.info), photo: doc.photo,
    template: doc.template, accent: doc.accent, style: structuredClone(doc.style),
    modules: structuredClone(doc.modules),
  };
}

// ---------------------------------------------------------------- migration

const mapSimple = { email: 'email', phone: 'phone', location: 'loc', website: 'site' };

/** Converts v1 drafts (form fields) and partial v2 docs to the current schema. Safe to re-run. */
export function migrate(data, lang, names) {
  const doc = { ...newDoc(lang), ...data, style: { ...DEFAULT_STYLE, ...(data.style || {}) }, info: { ...(data.info || {}) } };
  if (!Array.isArray(doc.modules)) doc.modules = [];
  // v1: single flat object with exp/edu/proj arrays
  if (data.exp || data.edu || data.proj || data.skills !== undefined) {
    const out = [newModule('basic', (k) => k), newModule('job', (k) => k)];
    const info = doc.info;
    info.name = data.name || info.name; info.title = data.headline || info.title; info.birth = '';
    for (const [from, toKey] of Object.entries(mapSimple)) if (data[from]) out[0].entry[toKey] = data[from];
    if (data.summary) out.push({ ...newModule('eval', (k) => k), entry: { paras: [{ bullet: false, runs: [{ text: data.summary }] }] } });
    const toEntries = (list, map) => (list || []).filter((x) => Object.values(x).some((v) => String(v || '').trim())).map((x) => ({ id: uid('i'), head: headFor(map, x), text: textParas(x.bullets || x.desc || x.detail || ''), when: { start: x.start || '', end: x.end || '' }, ...extraFor(map, x) }));
    out.push({ ...newModule('work', (k) => k), entries: toEntries(data.exp, 'work') });
    out.push({ ...newModule('education', (k) => k), entries: toEntries(data.edu, 'education') });
    if ((data.proj || []).length) out.push({ ...newModule('project', (k) => k), entries: toEntries(data.proj, 'project') });
    const skills = String(data.skills || '').split(/[,，、;；\n]/).map((s) => s.trim()).filter(Boolean);
    if (skills.length) out.push({ ...newModule('skills', (k) => k), entry: { tags: skills.map((name) => ({ name, level: 0 })) } });
    const extraLines = String(data.extra || '').split('\n').map((s) => s.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean);
    if (extraLines.length) out.push({ ...newModule('lang', (k) => k), entry: { rows: extraLines.map((s) => ({ name: s, level: '' })) } });
    doc.photo = data.photo || null;
    doc.template = { classic: 'classic', modern: 'neon', compact: 'flat' }[data.template] || 'classic';
    if (data.accent) doc.accent = data.accent;
    doc.modules = out;
  }
  for (const m of doc.modules) {
    m.id ||= uid();
    if (MODULE_TYPES[m.type]?.hasEntries && !Array.isArray(m.entries)) m.entries = [];
    if (m.entries) for (const e of m.entries) { e.id ||= uid('i'); e.when ||= { start: '', end: '' }; e.head ||= { title: '', org: '', role: '' }; }
    if (!MODULE_TYPES[m.type]?.hasEntries) m.entry ||= seedEntry(m.type);
    m.title = m.title || names[m.type] || m.type;
    if (m.type === 'basic' && !(m.entry ?? true)) m.entry = { email: '', phone: '', loc: '', site: '', gender: '', wechat: '' };
  }
  if (data.name && !doc.info.name && doc.modules.length && doc.modules[0].type === 'basic') doc.info.name = data.name;
  return doc;
}
const seedEntry = (type) => ({ ...(type === 'job' ? { title: '', city: '', salary: '', start: '' } : {}), ...(type === 'skills' || type === 'hobby' ? { tags: [] } : {}), ...(type === 'cert' || type === 'award' || type === 'lang' ? { rows: [] } : {}), ...(type === 'eval' ? { paras: [] } : {}) });
const headFor = (map, x) => {
  if (map === 'work') return { title: x.role || '', org: x.company || '', role: x.role || '' };
  if (map === 'education') return { title: x.school || '', org: '', role: x.degree || '' };
  return { title: x.name || x.title || '', org: x.org || '', role: x.role || '' };
};
const extraFor = (map, x) => (map === 'education' ? { degree: x.degree || '' } : {});
const textParas = (txt) => String(txt || '').split('\n').map((l) => { const m = l.match(/^\s*([-•*·])\s*(.*)$/); return { bullet: !!m, runs: [{ text: (m ? m[2] : l).trim() }] }; }).filter((p) => p.runs[0].text);

// ---------------------------------------------------------------- store

const KEY = (lang) => `lk-resume2-${lang}`;

/** Documents list store. api = { onChange(), strings, lang } */
export function createStore(api) {
  let docs = [];
  const state = loadAll();
  let undoStack = [], redoStack = [], lastEditAt = 0;

  function loadAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY(api.lang)));
      if (raw && Array.isArray(raw.docs) && raw.docs.length) return { docs: raw.docs, cur: raw.cur || raw.docs[0].id };
    } catch { /* fall through */ }
    // Migrate v1 single draft.
    try {
      const legacy = JSON.parse(localStorage.getItem(`lk-resume-${api.lang}`));
      if (legacy && typeof legacy === 'object') {
        const d = migrate(legacy, api.lang, api.names);
        d.name = legacy.name
          ? (api.lang === 'zh' ? `${legacy.name} 的简历` : `${legacy.name}'s resume`)
          : undefined;
        return { docs: [d], cur: d.id, legacyKey: `lk-resume-${api.lang}` };
      }
    } catch { /* ignore */ }
    return { docs: [newDoc(api.lang)], cur: null };
  }
  docs = state.docs;
  if (!state.cur) state.cur = docs[0].id;
  let curId = state.cur;

  const byId = (id) => docs.find((d) => d.id === id);
  const cur = () => byId(curId) || docs[0];

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  }
  function persist() {
    try { localStorage.setItem(KEY(api.lang), JSON.stringify({ docs, cur: curId })); } catch { /* storage full */ }
    if (state.legacyKey != null) { try { localStorage.removeItem(state.legacyKey); } catch { } state.legacyKey = null; }
  }

  /** Records an undo checkpoint for `doc` (coalesces bursts within 1.2 s). */
  function checkpoint(doc) {
    const now = Date.now();
    const last = undoStack[undoStack.length - 1];
    if (!(last && last.docId === doc.id && now - lastEditAt < 1200)) pushCheckpoint(doc, undoStack);
    lastEditAt = now;
    redoStack = [];
  }
  function pushCheckpoint(doc, stack) {
    stack.push({ docId: doc.id, snap: JSON.stringify(stripDocForSnap(doc)) });
    if (stack.length > 60) stack.shift();
  }
  function stripDocForSnap(doc) { const c = structuredClone(doc); return c; }

  return {
    get docs() { return docs; },
    get cur() { return cur(); },
    get curId() { return curId; },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    checkpoint,
    touch(doc = cur()) { doc.updatedAt = Date.now(); scheduleSave(); api.onChange?.(); },
    scheduleSave, persist,
    flush() { clearTimeout(saveTimer); persist(); },
    undo() {
      if (!undoStack.length) return null;
      const last = undoStack.pop();
      pushCheckpoint(byId(last.docId) || cur(), redoStack);
      const live = byId(last.docId) || cur();
      applySnap(live, last.snap);
      scheduleSave();
      api.onChange?.();
      return live;
    },
    redo() {
      if (!redoStack.length) return null;
      const last = redoStack.pop();
      pushCheckpoint(byId(last.docId) || cur(), undoStack);
      const live = byId(last.docId) || cur();
      applySnap(live, last.snap);
      scheduleSave();
      api.onChange?.();
      return live;
    },
    select(id) { curId = byId(id) ? id : docs[0].id; undoStack = []; redoStack = []; scheduleSave(); api.onChange?.(); return cur(); },
    addDoc(doc) { docs.push(doc); curId = doc.id; undoStack = []; redoStack = []; scheduleSave(); api.onChange?.(); return doc; },
    renameDoc(id, name) { const d = byId(id); if (d) d.name = name; scheduleSave(); },
    removeDoc(id) {
      docs = docs.filter((d) => d.id !== id);
      if (!docs.length) docs.push(newDoc(api.lang));
      if (curId === id) curId = docs[0].id;
      undoStack = []; redoStack = []; scheduleSave(); api.onChange?.();
    },
    duplicateDoc(id) {
      const d = byId(id); if (!d) return;
      const copy = structuredClone(d);
      copy.id = uid('doc'); copy.createdAt = Date.now();
      copy.name += api.lang === 'zh' ? ' 副本' : ' copy';
      cloneIds(copy);
      return this.addDoc(copy);
    },
    replaceDoc(id, doc) { const i = docs.findIndex((d) => d.id === id); if (i >= 0) docs[i] = doc; else docs.push(doc); curId = doc.id; undoStack = []; redoStack = []; scheduleSave(); api.onChange?.(); },
  };
}
function applySnap(live, snap) {
  const c = JSON.parse(snap);
  for (const k of Object.keys(live)) if (!(k in c)) delete live[k];
  Object.assign(live, c);
}
function cloneIds(doc) {
  for (const m of doc.modules) { m.id = uid(); for (const e of m.entries || []) e.id = uid('i'); }
}

/** Date range label like "2023.03 – 至今" / "2023.03 – Present". */
export function whenLabel(when, presentStr) {
  const s = (when?.start || '').trim(), e = (when?.end || '').trim();
  if (!s && !e) return '';
  return `${s || '…'} – ${e || presentStr}`;
}
