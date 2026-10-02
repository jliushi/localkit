// Resume Builder: WYSIWYG A4 sheet + structured side panel, all in the browser.
import { el, toast, download } from './lib.js';
import { lang, D_, A4, uid, blankDoc, newModule, emptyEntry, emptyItem, createStore, normalizeDoc, resolveRef, mkRef } from './resume-data.js';
import { renderSheet, richClean, styleAttr, tplOf, TPLS } from './resume-tpl.js';
import { paginate, fitSearch, ensureCss } from './resume-layout.js';
import { initEditing } from './resume-edit.js';
import { createPanel } from './resume-panel.js';
import { dragSort } from './resume-sort.js';
import { cropDialog, shrink } from './resume-crop.js';
import { printPdf, exportImages, exportImagePdf, exportJson, readAsDataUrl } from './resume-export.js';
import { sampleDoc, SAMPLE_IDS } from './resume-samples.js';
import { ri } from './resume-icons.js';
import { T } from './resume-i18n.js';

const root = document.getElementById('rv-root');
ensureCss();

// ---------------------------------------------------------------- state
let fitS = 0, pages = 1, zoomMode = 'fit', layoutTimer = 0, target = null;
const store = createStore((kind) => { if (kind === 'history' || kind === 'switch') fullRender(); updateBar(); });
const doc = () => store.cur;

const icn = (n, cls = 'ico') => { const s = document.createElement('span'); s.className = cls; s.innerHTML = ri(n); return s; };
const tbtn = (icon, title, onclick, extra = {}) => { const b = el('button', { type: 'button', class: 'rv-btn', title, 'aria-label': title, onclick, ...extra }); b.append(icn(icon)); return b; };

// ---------------------------------------------------------------- DOM skeleton
const host = el('div', { class: 'rv-host' });
const zoomWrap = el('div', { class: 'rv-zoom' }, host);
const stage = el('div', { class: 'rv-stage', tabindex: -1 }, zoomWrap);
const btnUndo = tbtn('undo-2', T('undo'), () => { document.activeElement?.blur(); store.undo(); }, { id: 'rv-undo' });
const btnRedo = tbtn('redo-2', T('redo'), () => { document.activeElement?.blur(); store.redo(); }, { id: 'rv-redo' });
const docBtn = el('button', { type: 'button', class: 'rv-btn rv-docbtn', id: 'rv-docs', onclick: (e) => docsMenu(e.currentTarget) });
const pagesChip = el('span', { class: 'rv-pages', id: 'rv-pages', role: 'status' });
const fitBtn = el('button', { type: 'button', class: 'rv-btn', id: 'rv-fit', onclick: () => app.setFit(!doc().style.fit) });
const expBtn = el('button', { type: 'button', class: 'btn', id: 'rv-export', onclick: (e) => exportMenu(e.currentTarget) });
expBtn.append(icn('download'), T('export'));
const zoomLbl = el('span', { class: 'rv-zl', text: '' });
const bar = el('div', { class: 'rv-topbar' },
  docBtn, el('span', { class: 'rv-sep' }), btnUndo, btnRedo,
  el('span', { class: 'rv-grow' }),
  el('span', { class: 'rv-zoomctl' }, tbtn('zoom-out', T('zoomOut'), () => setZoom(curScale() / 1.15)), zoomLbl, tbtn('zoom-in', T('zoomIn'), () => setZoom(curScale() * 1.15)), tbtn('minimize-2', T('zoomFit'), () => { zoomMode = 'fit'; applyScale(); })),
  pagesChip, fitBtn, expBtn);
const mseg = el('div', { class: 'rv-mseg', role: 'tablist' },
  el('button', { type: 'button', 'data-v': 'sheet', class: 'on', text: T('m.preview'), onclick: () => setView('sheet') }),
  el('button', { type: 'button', 'data-v': 'edit', text: T('m.edit'), onclick: () => setView('edit') }));
const rv = el('div', { class: 'rv', 'data-view': 'sheet' });

function setView(v) {
  rv.dataset.view = v;
  for (const b of mseg.children) b.classList.toggle('on', b.dataset.v === v);
  if (v === 'sheet') requestAnimationFrame(applyScale);
}

// ---------------------------------------------------------------- app facade used by the panel
const app = {
  get doc() { return doc(); },
  focusLater: null, scrollToMod: null,
  pages: () => pages,
  panelScroller: () => panel.body,
  mutate(fn, { key = '' } = {}) {
    fn();
    store.changed(key);
    fullRender();
    if (this.focusLater) { const r = this.focusLater; this.focusLater = null; focusRef(r); }
    if (this.scrollToMod) { const id = this.scrollToMod; this.scrollToMod = null; panel.root.querySelector(`.rp-mod[data-mid="${id}"]`)?.scrollIntoView({ block: 'nearest' }); }
  },
  touchStyle(key, repanel) { store.changed(`style:${key}`); redrawSheet(); if (repanel) panel.render(); },
  setTemplate(id) { doc().tpl = id; store.changed(); fullRender(); },
  setFit(v) { doc().style.fit = !!v; store.changed(); redrawSheet(); panel.render(); },
  pickPhoto, cropPhoto,
  assist(m, e) {
    target = { mid: m.id, eid: e?.id };
    panel.state.bucket = m.kind === 'text' ? 'eval' : m.type === 'skills' ? 'skills' : 'work';
    panel.show('assist');
    setView('edit');
  },
  targetInfo() {
    const m = target && doc().modules.find((x) => x.id === target.mid);
    if (!m) return T('assist.noTarget');
    const e = m.entries?.find((x) => x.id === target.eid);
    return `${m.title}${e ? ` › ${e.org || e.role || '…'}` : ''}`;
  },
  insertPhrase, insertText,
};
const panel = createPanel(app);
app.onTab = null;

function focusRef(ref) {
  const cands = [...document.querySelectorAll('[data-ref]')].filter((e) => e.dataset.ref === ref && e.offsetParent !== null);
  const f = cands.find((e) => e.closest('.rv-sheet')) || cands[0];
  if (!f) return;
  f.focus({ preventScroll: false });
  if (f.isContentEditable) { const r = document.createRange(); r.selectNodeContents(f); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
}

// ---------------------------------------------------------------- rendering
function fullRender() { redrawSheet(); panel.render(); updateBar(); }

function redrawSheet() {
  host.querySelector('.rv-sheet')?.remove();
  host.insertAdjacentHTML('afterbegin', renderSheet(doc(), { edit: true, fit: fitS, pages }));
  layout();
}

function layout() {
  const sheet = host.querySelector('.rv-sheet');
  if (!sheet) return;
  const d = doc();
  let fail = false;
  if (d.style.fit) { const r = fitSearch(d, sheet); fitS = r.s; pages = r.pages; fail = r.s >= 1 && r.pages > 1; } else { fitS = 0; sheet.setAttribute('style', `${styleAttr(d, 0)}`); pages = paginate(sheet); }
  for (const l of host.querySelectorAll('.rv-pbl')) l.remove();
  for (let i = 1; i < pages; i++) host.append(el('div', { class: 'rv-pbl', style: { top: `${i * A4.h}px` } }, el('span', { text: T('pageN', i + 1) })));
  pagesChip.textContent = pages === 1 ? T('onePage') : T('nPages', pages);
  pagesChip.dataset.n = String(pages);
  pagesChip.classList.toggle('warn', pages > 1 && (d.style.fit || pages > 2));
  pagesChip.title = fail ? T('fitFail') : '';
  fitBtn.classList.toggle('on', !!d.style.fit);
  fitBtn.replaceChildren(icn('wand-sparkles'), T('fitOne'));
  fitBtn.setAttribute('aria-pressed', String(!!d.style.fit));
  applyScale();
}
function scheduleLayout() { clearTimeout(layoutTimer); layoutTimer = setTimeout(() => { layout(); }, 90); }

const curScale = () => (zoomMode === 'fit' ? Math.min(1.1, Math.max(0.3, (stage.clientWidth - 24) / A4.w)) : zoomMode);
function setZoom(k) { zoomMode = Math.min(1.6, Math.max(0.3, k)); applyScale(); }
function applyScale() {
  const k = curScale();
  const sheet = host.querySelector('.rv-sheet');
  host.style.transform = `scale(${k})`;
  const h = sheet ? sheet.offsetHeight : A4.h;
  zoomWrap.style.width = `${A4.w * k}px`;
  zoomWrap.style.height = `${h * k}px`;
  host.style.height = `${h}px`;
  zoomLbl.textContent = `${Math.round(k * 100)}%`;
}
new ResizeObserver(() => { if (zoomMode === 'fit') applyScale(); }).observe(stage);

function updateBar() {
  docBtn.replaceChildren(icn('file-text'), el('span', { class: 'rv-dn', text: doc().name }), icn('chevron-down'));
  btnUndo.disabled = !store.canUndo();
  btnRedo.disabled = !store.canRedo();
}

// ---------------------------------------------------------------- field editing
function valueOf(f) {
  if (f.matches('input,textarea,select')) return f.value;
  if (f.dataset.rich) return richClean(f.innerHTML);
  return f.textContent.replace(/\s+/g, ' ');
}
function onField(f) {
  const ref = f.dataset.ref, d = doc();
  const r = resolveRef(d, ref);
  if (!r) return;
  const val = valueOf(f);
  r.obj[r.field] = val;
  store.changed(ref);
  for (const o of document.querySelectorAll('[data-ref]')) {
    if (o === f || o.dataset.ref !== ref) continue;
    if (o.matches('input')) o.value = val; else if (o.dataset.rich) o.innerHTML = val; else o.textContent = val;
  }
  scheduleLayout();
  scheduleCheck();
}
let checkTimer = 0;
function scheduleCheck() { clearTimeout(checkTimer); checkTimer = setTimeout(() => { if (panel.tab === 'assist') panel.render(); }, 700); }

function onEnter(f) {
  const ref = f.dataset.ref;
  const r = resolveRef(doc(), ref);
  const iw = f.closest('[data-iid]');
  if (r && iw && r.m.items && f.dataset.ref.split('|')[3] === 't') {
    const idx = r.m.items.findIndex((i) => i.id === iw.dataset.iid);
    if ((r.obj.t || '').trim()) {
      const it = emptyItem(r.m.type);
      app.mutate(() => { r.m.items.splice(idx + 1, 0, it); app.focusLater = mkRef(r.m.id, 'i', it.id, 't'); });
      return;
    }
  }
  f.blur();
}
function onFocus(f) {
  const [mid, kind, rid] = f.dataset.ref.split('|');
  target = { mid, eid: kind === 'e' ? rid : undefined };
}
initEditing({ onField, onEnter, onFocus });

// ---------------------------------------------------------------- sheet actions
const modOf = (n) => doc().modules.find((m) => m.id === n.closest('.rv-mod')?.dataset.mid);

stage.addEventListener('pointerdown', (e) => {
  const g = e.target.closest('[data-act=mgrip],[data-act=egrip]');
  if (!g) return;
  const k = () => curScale();
  const common = { scale: k, scroller: stage };
  if (g.dataset.act === 'mgrip') {
    const item = g.closest('.rv-mod');
    dragSort(e, { ...common, container: item.parentElement, item, itemSel: '.rv-mod', idAttr: 'data-mid', onDrop: (order) => app.mutate(() => {
      const ms = doc().modules, slots = ms.map((m, i) => (order.includes(m.id) ? i : -1)).filter((i) => i >= 0), by = new Map(ms.map((m) => [m.id, m]));
      order.forEach((id, j) => { ms[slots[j]] = by.get(id); });
    }) });
  } else {
    const item = g.closest('.rv-entry'), m = modOf(item);
    dragSort(e, { ...common, container: item.parentElement, item, itemSel: '.rv-entry', idAttr: 'data-eid', onDrop: (order) => app.mutate(() => { const by = new Map(m.entries.map((x) => [x.id, x])); m.entries = order.map((id) => by.get(id)); }) });
  }
});
stage.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const act = a.dataset.act, d = doc();
  if (act === 'photo') return pickPhoto();
  if (act === 'level') {
    const m = d.modules.find((x) => x.id === a.dataset.mid), it = m?.items.find((x) => x.id === a.dataset.iid);
    if (!it) return;
    const r = a.getBoundingClientRect();
    it.lv = Math.max(5, Math.min(100, Math.round(((e.clientX - r.left) / r.width) * 20) * 5));
    store.changed('lv'); redrawSheet(); panel.render();
    return;
  }
  const m = modOf(a);
  if (!m) return;
  if (act === 'mup' || act === 'mdown') {
    const mod = a.closest('.rv-mod'), sibs = [...mod.parentElement.children].filter((c) => c.matches('.rv-mod')), sib = sibs[sibs.indexOf(mod) + (act === 'mup' ? -1 : 1)];
    const other = sib && d.modules.find((x) => x.id === sib.dataset.mid);
    if (!other) return;
    app.mutate(() => { const i = d.modules.indexOf(m), j = d.modules.indexOf(other); [d.modules[i], d.modules[j]] = [d.modules[j], d.modules[i]]; });
  } else if (act === 'mhide') app.mutate(() => { m.hidden = true; });
  else if (act === 'mdel') { if (confirm(T('confirmDelMod', m.title))) app.mutate(() => { d.modules = d.modules.filter((x) => x !== m); }); }
  else if (act === 'add-entry') app.mutate(() => { const en = emptyEntry(); m.entries.push(en); app.focusLater = mkRef(m.id, 'e', en.id, 'org'); });
  else if (act === 'add-item') app.mutate(() => { const it = emptyItem(m.type); m.items.push(it); app.focusLater = mkRef(m.id, 'i', it.id, 't'); });
  else if (act === 'edel' || act === 'edup') {
    const eid = a.closest('.rv-entry').dataset.eid, en = m.entries.find((x) => x.id === eid);
    if (act === 'edel') app.mutate(() => { m.entries = m.entries.filter((x) => x !== en); });
    else app.mutate(() => { m.entries.splice(m.entries.indexOf(en) + 1, 0, { ...structuredClone(en), id: emptyEntry().id }); });
  }
});

// ---------------------------------------------------------------- photo
async function pickPhoto() {
  const inp = el('input', { type: 'file', accept: 'image/*', hidden: true });
  document.body.append(inp);
  inp.addEventListener('change', async () => {
    const f = inp.files[0]; inp.remove();
    if (!f) return;
    try {
      const orig = await shrink(await readAsDataUrl(f));
      const r = await cropDialog(orig, doc().photo?.shape || 'square');
      if (r) app.mutate(() => { doc().photo = r; doc().style.photoOn = true; });
    } catch { toast(T('photo.error')); }
  });
  inp.click();
}
async function cropPhoto() {
  const p = doc().photo;
  if (!p) return;
  const r = await cropDialog(p.orig || p.src, p.shape);
  if (r) app.mutate(() => { doc().photo = r; });
}

// ---------------------------------------------------------------- writing help
const appendLi = (desc, html) => (desc && /<\/ul>\s*$/.test(desc) ? desc.replace(/<\/ul>\s*$/, `<li>${html}</li></ul>`) : `${desc || ''}<ul><li>${html}</li></ul>`);
function insertPhrase(html, bucket) {
  const d = doc();
  const find = (types) => d.modules.find((m) => types.includes(m.type) && !m.hidden);
  let m = target && d.modules.find((x) => x.id === target.mid);
  const wantKind = bucket === 'skills' ? 'list' : bucket === 'eval' ? 'text' : 'entries';
  if (!m || m.kind !== wantKind || (bucket === 'skills' && m.type !== 'skills')) m = bucket === 'skills' ? find(['skills']) : bucket === 'eval' ? find(['eval']) : find(['work', 'intern', 'project', 'campus']);
  app.mutate(() => {
    if (!m) { m = newModule(bucket === 'skills' ? 'skills' : bucket === 'eval' ? 'eval' : 'work', { blank: true }); if (m.kind === 'entries') m.entries = [emptyEntry()]; d.modules.push(m); }
    if (m.kind === 'list') { const t = htmlTextOf(html); if (!m.items.some((i) => i.t === t)) m.items.push({ id: uid('i'), t, lv: 80 }); }
    else if (m.kind === 'text') m.text = `${m.text || ''}<p>${html}</p>`;
    else {
      let e = m.entries.find((x) => x.id === target?.eid) || m.entries[m.entries.length - 1];
      if (!e) { e = emptyEntry(); m.entries.push(e); }
      e.desc = appendLi(e.desc, html);
    }
    panel.expand(m.id);
  });
  toast(T('assist.inserted', m.title));
}
const htmlTextOf = (h) => { const t = document.createElement('div'); t.innerHTML = h; return t.textContent.trim(); };
function insertText(v) {
  const f = document.activeElement;
  if (f?.dataset?.rich) { document.execCommand('insertText', false, v); return; }
  toast(T('assist.clickFirst'));
}

// ---------------------------------------------------------------- menus & dialogs
function popMenu(anchor, items) {
  document.querySelectorAll('.rv-menu').forEach((m) => m.remove());
  const menu = el('div', { class: 'rv-menu', role: 'menu' });
  for (const it of items) {
    if (it === '-') { menu.append(el('hr')); continue; }
    if (it.head) { menu.append(el('div', { class: 'rv-mhd', text: it.head })); continue; }
    const b = el('button', { type: 'button', role: 'menuitem', class: `${it.on ? 'on ' : ''}${it.danger ? 'danger' : ''}`, onclick: () => { menu.remove(); it.run(); } });
    if (it.icon) b.append(icn(it.icon));
    b.append(el('span', { text: it.label }));
    if (it.sub) b.append(el('small', { text: it.sub }));
    menu.append(b);
  }
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = `${Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 8)}px`;
  menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8))}px`;
  const off = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('pointerdown', off, true); } };
  setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
}

function askText(title, value) {
  return new Promise((resolve) => {
    const inp = el('input', { type: 'text', value, id: 'rv-ask' });
    const dlg = el('dialog', { class: 'rv-dlg' }, el('h3', { text: title }), el('label', { class: 'field' }, inp),
      el('div', { class: 'actions' }, el('button', { type: 'button', class: 'btn ghost', text: T('cancel'), onclick: () => close(null) }), el('button', { type: 'button', class: 'btn', text: 'OK', id: 'rv-ask-ok', onclick: () => close(inp.value.trim()) })));
    const close = (v) => { dlg.close(); dlg.remove(); resolve(v); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(inp.value.trim()); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
    document.body.append(dlg); dlg.showModal(); inp.select();
  });
}

function starterDialog() {
  const dlg = el('dialog', { class: 'rv-dlg wide', id: 'rv-starter' }, el('h3', { text: T('new.title') }), el('p', { class: 'hint', text: T('new.sub') }));
  const grid = el('div', { class: 'rv-starts' });
  const mk = (label, sub, build, id) => {
    const b = el('button', { type: 'button', class: 'rv-start', 'data-start': id, onclick: () => { dlg.close(); dlg.remove(); const nd = build(); store.add(nd); setView('sheet'); } });
    const prev = el('div', { class: 'rv-sprev' });
    const dd = build(); dd.style.fit = false;
    prev.innerHTML = renderSheet(dd, { edit: false });
    const sh = prev.firstElementChild; sh.style.height = '1122px'; sh.style.overflow = 'hidden'; sh.style.minHeight = '1122px';
    b.append(prev, el('b', { text: label }), el('small', { text: sub }));
    grid.append(b);
    requestAnimationFrame(() => { const k = prev.clientWidth / 794; prev.style.height = `${1122 * k}px`; sh.style.transform = `scale(${k})`; });
  };
  mk(T('new.blank'), T('new.blankSub'), () => blankDoc(), 'blank');
  for (const id of SAMPLE_IDS) mk(T(`role.${id}`), tplOf(sampleDoc(id).tpl)[lang], () => sampleDoc(id), id);
  dlg.append(grid, el('div', { class: 'actions' }, el('button', { type: 'button', class: 'btn ghost', text: T('cancel'), onclick: () => { dlg.close(); dlg.remove(); } })));
  dlg.addEventListener('cancel', () => dlg.remove());
  document.body.append(dlg); dlg.showModal();
  for (const b of grid.querySelectorAll('.rv-start')) { const p = b.firstElementChild, k = p.clientWidth / 794; if (k) { p.style.height = `${1122 * k}px`; p.firstElementChild.style.transform = `scale(${k})`; } }
}

function importJson() {
  const inp = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
  document.body.append(inp);
  inp.addEventListener('change', async () => {
    const f = inp.files[0]; inp.remove();
    if (!f) return;
    try {
      const nd = normalizeDoc(JSON.parse(await f.text()));
      if (!nd) throw new Error('bad');
      nd.id = uid('doc');
      store.add(nd);
      toast(T('imported', nd.name));
    } catch { toast(T('badImport')); }
  });
  inp.click();
}

function docsMenu(anchor) {
  const items = [{ head: T('myResumes') }, ...store.docs.map((x) => ({ label: x.name, icon: 'file-text', on: x.id === doc().id, run: () => store.select(x.id) })), '-',
    { label: T('newResume'), icon: 'plus', run: starterDialog },
    { label: T('duplicate'), icon: 'copy', run: () => { store.duplicate(); } },
    { label: T('rename'), icon: 'pencil', run: async () => { const n = await askText(T('rename'), doc().name); if (n) store.rename(n); } },
    { label: T('delete'), icon: 'trash-2', danger: true, run: () => { if (confirm(T('confirmDelDoc', doc().name))) store.remove(); } }, '-',
    { label: T('exportJson'), icon: 'file-json', run: () => exportJson(doc()) },
    { label: T('importJson'), icon: 'file-up', run: importJson }];
  popMenu(anchor, items);
}

let busy = false;
async function runExport(label, fn) {
  if (busy) return;
  busy = true;
  document.activeElement?.blur?.();
  const t = el('div', { class: 'toast', role: 'status', text: label });
  document.body.append(t);
  try { await fn(); } catch (err) { toast(T('exportFail', err.message || err), 5000); } finally { t.remove(); busy = false; }
}
function exportMenu(anchor) {
  const d = doc();
  popMenu(anchor, [
    { head: T('export') },
    { label: T('exp.pdf'), sub: T('exp.pdfSub'), icon: 'printer', run: () => printHint(() => printPdf(d, fitS, d.name)) },
    { label: T('exp.pdfImg'), sub: T('exp.pdfImgSub'), icon: 'file-image', run: () => runExport(T('rendering'), () => exportImagePdf(d, fitS, d.name)) },
    { label: 'PNG', sub: T('exp.pngSub'), icon: 'image', run: () => runExport(T('rendering'), () => exportImages(d, fitS, 'image/png', d.name)) },
    { label: 'JPG', sub: T('exp.jpgSub'), icon: 'image', run: () => runExport(T('rendering'), () => exportImages(d, fitS, 'image/jpeg', d.name)) },
    '-', { label: T('exportJson'), icon: 'file-json', run: () => exportJson(d) }]);
}
function printHint(go) {
  let seen = false;
  try { seen = localStorage.getItem('lk-rv-printhint') === '1'; } catch { /* ignore */ }
  if (seen) return go();
  const dlg = el('dialog', { class: 'rv-dlg', id: 'rv-printhint' }, el('h3', { text: T('print.title') }), el('p', { text: T('print.body') }),
    el('ol', {}, [T('print.s1'), T('print.s2'), T('print.s3')].map((x) => el('li', { text: x }))),
    el('div', { class: 'actions' }, el('button', { type: 'button', class: 'btn ghost', text: T('cancel'), onclick: () => { dlg.close(); dlg.remove(); } }),
      el('button', { type: 'button', class: 'btn', id: 'rv-print-go', text: T('print.go'), onclick: () => { try { localStorage.setItem('lk-rv-printhint', '1'); } catch { /* ignore */ } dlg.close(); dlg.remove(); go(); } })));
  document.body.append(dlg); dlg.showModal();
}

// ---------------------------------------------------------------- global keys
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  if (document.activeElement?.isContentEditable || document.activeElement?.matches?.('input,textarea')) return;
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); store.redo(); }
});

// ---------------------------------------------------------------- boot
panel.root.classList.add('rv-panel');
rv.append(bar, mseg, el('div', { class: 'rv-body' }, panel.root, stage));
root.replaceChildren(rv);
fullRender();
panel.expand(doc().modules[0].id);
panel.render();
if (store.fresh) setTimeout(starterDialog, 150);

// debug/test hook (read-only helpers)
window.__rv = { doc: () => store.cur, store, pages: () => pages, fit: () => fitS };
