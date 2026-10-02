// Side panel: content (modules), design (templates + style), assistant (phrases + checklist).
import { el } from './lib.js';
import { lang, D_, MODULE_TYPES, ADDABLE, newModule, emptyEntry, emptyItem, mkRef, basicOf, cleanHtml, htmlText } from './resume-data.js';
import { TPLS, PALETTE, FONTS, renderSheet, tplOf, richClean } from './resume-tpl.js';
import { PHRASES, ROLE_IDS } from './resume-samples.js';
import { checkDoc } from './resume-check.js';
import { dragSort } from './resume-sort.js';
import { ri } from './resume-icons.js';
import { T } from './resume-i18n.js';

const icn = (n) => { const s = document.createElement('span'); s.className = 'ico'; s.innerHTML = ri(n); return s; };
const ibtn = (name, title, onclick, cls = '') => { const b = el('button', { type: 'button', class: `rp-ib ${cls}`, title, 'aria-label': title, onclick }); b.append(icn(name)); return b; };

export function createPanel(app) {
  const root = el('div', { class: 'rp' });
  const open = new Set(), seeded = new Set();
  let tab = 'content';
  const state = { role: ROLE_IDS.includes(localStorage.getItem('lk-rv-role')) ? localStorage.getItem('lk-rv-role') : 'se', bucket: 'work' };

  // ---------------------------------------------------------------- field builders
  const input = (ref, val, label, ph, type = 'text') => el('label', { class: 'field' }, el('span', { text: label }),
    el('input', { type, value: val ?? '', placeholder: ph || '', 'data-ref': ref, autocomplete: 'off' }));
  const rich = (ref, val, ph) => el('div', { class: 'rp-rich f', contenteditable: 'true', 'data-ref': ref, 'data-rich': '1', 'data-ph': ph, innerHTML: val ? richClean(val) : '' });
  const richEl = (ref, val, ph) => { const d = rich(ref, val, ph); d.innerHTML = val ? richClean(val) : ''; return d; };

  // ---------------------------------------------------------------- content tab
  function modCard(m) {
    const doc = app.doc;
    const isOpen = open.has(m.id);
    const locked = m.type === 'basic';
    const head = el('div', { class: 'rp-mh' },
      locked ? el('span', { class: 'rp-grip off' }) : ((g) => { g.innerHTML = ri('grip-vertical'); return g; })(el('button', { type: 'button', class: 'rp-grip', title: T('drag'), 'data-act': 'grip' })),
      icn(m.type === 'custom' ? 'square-pen' : (MODULE_TYPES[m.type]?.icon || 'square-pen')),
      el('input', { class: 'rp-title', type: 'text', value: m.title, 'data-ref': mkRef(m.id, 'm', '', 'title'), 'aria-label': T('modTitle') }),
      locked ? null : ibtn(m.hidden ? 'eye-off' : 'eye', m.hidden ? T('show') : T('hide'), () => app.mutate(() => { m.hidden = !m.hidden; }, { key: 'hide' + m.id }), m.hidden ? 'dim' : ''),
      ibtn(isOpen ? 'chevron-up' : 'chevron-down', T('expand'), () => { if (open.has(m.id)) open.delete(m.id); else open.add(m.id); render(); }),
      locked ? null : ibtn('trash-2', T('delete'), () => { if (confirm(T('confirmDelMod', m.title))) app.mutate(() => { doc.modules = doc.modules.filter((x) => x !== m); }); }, 'danger'));
    head.querySelector('.rp-grip[data-act=grip]')?.addEventListener('pointerdown', (e) => dragSort(e, {
      container: list, item: card, itemSel: '.rp-mod', idAttr: 'data-mid', scroller: app.panelScroller(),
      onDrop: (order) => app.mutate(() => { const by = new Map(doc.modules.map((x) => [x.id, x])); const basic = doc.modules.find((x) => x.type === 'basic'); const rest = order.map((id) => by.get(id)).filter((x) => x && x !== basic); doc.modules = basic ? [basic, ...rest] : rest; }),
    }));
    const card = el('section', { class: `rp-mod${m.hidden ? ' off' : ''}${isOpen ? ' open' : ''}`, 'data-mid': m.id }, head);
    if (isOpen) card.append(el('div', { class: 'rp-mb' }, modBody(m)));
    return card;
  }

  function modBody(m) {
    const doc = app.doc;
    if (m.type === 'basic') {
      const f = (k, label, type) => input(mkRef(m.id, 'd', '', k), m.d[k], label, '', type);
      return [el('div', { class: 'grid2' }, f('name', D_.ph.name), f('headline', D_.ph.headline), f('phone', D_.ph.phone, 'tel'), f('email', D_.ph.email, 'email'), f('city', D_.ph.city), f('site', D_.ph.site), f('birth', D_.ph.birth), f('gender', D_.ph.gender), f('extra', D_.ph.extra)), photoBlock()];
    }
    if (m.type === 'job') return el('div', { class: 'grid2' }, ['pos', 'city', 'salary', 'start'].map((k) => input(mkRef(m.id, 'd', '', k), m.d[k], D_.jobLabels[k])));
    if (m.kind === 'entries') {
      const wrap = el('div', { class: 'rp-ents' });
      for (const e of m.entries) {
        const key = m.type;
        const ent = el('div', { class: 'rp-ent', 'data-eid': e.id },
          el('div', { class: 'rp-eh' },
            ((g) => { g.innerHTML = ri('grip-vertical'); g.addEventListener('pointerdown', (ev) => dragSort(ev, { container: wrap, item: ent, itemSel: '.rp-ent', idAttr: 'data-eid', scroller: app.panelScroller(), onDrop: (order) => app.mutate(() => { const by = new Map(m.entries.map((x) => [x.id, x])); m.entries = order.map((id) => by.get(id)); }) })); return g; })(el('button', { type: 'button', class: 'rp-grip', title: T('drag') })),
            el('b', { class: 'rp-esum', text: e.org || e.role || D_.ph.org[key] || D_.ph.org.custom }),
            ibtn('lightbulb', T('assist.tip'), () => app.assist(m, e)),
            ibtn('copy', T('duplicate'), () => app.mutate(() => { const c = { ...structuredClone(e), id: emptyEntry().id }; m.entries.splice(m.entries.indexOf(e) + 1, 0, c); })),
            ibtn('trash-2', T('delete'), () => app.mutate(() => { m.entries = m.entries.filter((x) => x !== e); }), 'danger')),
          el('div', { class: 'grid2' },
            input(mkRef(m.id, 'e', e.id, 'org'), e.org, D_.ph.org[key] || D_.ph.org.custom),
            input(mkRef(m.id, 'e', e.id, 'role'), e.role, D_.ph.role[key] || D_.ph.role.custom),
            input(mkRef(m.id, 'e', e.id, 'start'), e.start, D_.ph.start, '2022.03'),
            input(mkRef(m.id, 'e', e.id, 'end'), e.end, D_.ph.end, (m.type === 'work' || m.type === 'intern') ? D_.present : '')),
          el('div', { class: 'field' }, el('span', { text: T('desc') }), richEl(mkRef(m.id, 'e', e.id, 'desc'), e.desc, D_.ph.desc)));
        wrap.append(ent);
      }
      return [wrap, el('button', { type: 'button', class: 'btn ghost sm', onclick: () => app.mutate(() => { const e = emptyEntry(); m.entries.push(e); app.focusLater = mkRef(m.id, 'e', e.id, 'org'); }) }, '+ ', T('addEntry'))];
    }
    if (m.kind === 'list') {
      const wrap = el('div', { class: 'rp-items' });
      const sk = m.type === 'skills';
      for (const it of m.items) {
        wrap.append(el('div', { class: 'rp-item', 'data-iid': it.id },
          el('input', { type: 'text', value: it.t, placeholder: D_.ph.item, 'data-ref': mkRef(m.id, 'i', it.id, 't'), 'aria-label': D_.ph.item }),
          sk ? el('input', { type: 'range', min: 0, max: 100, step: 5, value: it.lv ?? 80, class: 'rp-lv', 'aria-label': D_.ph.level, oninput: (ev) => { it.lv = Number(ev.target.value); app.touchStyle('lv' + it.id); } })
            : el('input', { type: 'text', value: it.d ?? '', placeholder: m.type === 'lang' ? D_.ph.level : D_.ph.date, 'data-ref': mkRef(m.id, 'i', it.id, 'd'), class: 'rp-d' }),
          ibtn('trash-2', T('delete'), () => app.mutate(() => { m.items = m.items.filter((x) => x !== it); }), 'danger')));
      }
      const out = [wrap, el('button', { type: 'button', class: 'btn ghost sm', onclick: () => app.mutate(() => { const i = emptyItem(m.type); m.items.push(i); app.focusLater = mkRef(m.id, 'i', i.id, 't'); }) }, '+ ', T('addItem'))];
      if (sk) out.push(el('label', { class: 'field inline' }, el('span', { text: T('skillView') }), el('select', { onchange: (ev) => app.mutate(() => { m.view = ev.target.value; }, { key: 'view' }) },
        [['auto', T('view.auto')], ['tags', T('view.tags')], ['bars', T('view.bars')], ['text', T('view.text')]].map(([v, l]) => el('option', { value: v, text: l, selected: (m.view || 'auto') === v })))));
      return out;
    }
    return el('div', { class: 'field' }, richEl(mkRef(m.id, 'm', '', 'text'), m.text, D_.ph.text), el('button', { type: 'button', class: 'btn ghost sm', onclick: () => app.assist(m, null) }, icn('lightbulb'), T('assist.tip')));
  }

  function photoBlock() {
    const doc = app.doc, tp = tplOf(doc.tpl);
    const box = el('div', { class: 'rp-photo' });
    if (doc.photo) box.append(el('img', { src: doc.photo.src, alt: '' }));
    else box.append(el('div', { class: 'rp-nophoto' }, icn('image')));
    const col = el('div', { class: 'rp-pbtns' },
      el('button', { type: 'button', class: 'btn ghost sm', onclick: () => app.pickPhoto() }, icn('upload'), doc.photo ? T('photo.change') : T('photo.add')),
      doc.photo ? el('button', { type: 'button', class: 'btn ghost sm', onclick: () => app.cropPhoto() }, icn('pencil'), T('photo.crop')) : null,
      doc.photo ? el('button', { type: 'button', class: 'btn ghost sm', onclick: () => app.mutate(() => { doc.photo = null; }) }, icn('trash-2'), T('photo.remove')) : null,
      el('label', { class: 'chk' }, el('input', { type: 'checkbox', checked: doc.style.photoOn, onchange: (e) => app.mutate(() => { doc.style.photoOn = e.target.checked; }, { key: 'photoOn' }) }), el('span', { text: T('photo.show') })),
      tp.photo ? null : el('small', { class: 'hint', text: T('photo.noTpl') }));
    return el('div', { class: 'rp-photoblock' }, box, col);
  }

  let list;
  function contentPane() {
    const doc = app.doc;
    if (!seeded.has(doc.id)) { seeded.add(doc.id); const b = basicOf(doc); if (b) open.add(b.id); }
    list = el('div', { class: 'rp-mods' }, doc.modules.map(modCard));
    const addMenu = el('div', { class: 'rp-add' }, el('b', { text: T('addModule') }),
      el('div', { class: 'rp-addgrid' }, ADDABLE.filter((t) => t !== 'job' || !doc.modules.some((m) => m.type === 'job')).map((t) => {
        const base = t === 'customText' ? 'custom' : t;
        const b = el('button', { type: 'button', class: 'rp-addb', onclick: () => app.mutate(() => { const m = newModule(t); doc.modules.push(m); open.add(m.id); app.scrollToMod = m.id; }) });
        b.append(icn(MODULE_TYPES[base].icon), el('span', { text: t === 'customText' ? D_.mod.customText : D_.mod[base] }));
        return b;
      })));
    return el('div', { class: 'rp-pane' }, list, addMenu);
  }

  // ---------------------------------------------------------------- design tab
  const slider = (label, key, min, max, step, fmt = (v) => v) => {
    const st = app.doc.style;
    const out = el('output', { text: fmt(st[key]) });
    const inp = el('input', { type: 'range', min, max, step, value: st[key], oninput: (e) => { st[key] = Number(e.target.value); out.textContent = fmt(st[key]); app.touchStyle(key); }, 'aria-label': label });
    return el('label', { class: 'rp-sl' }, el('span', { text: label }), inp, out);
  };
  function designPane() {
    const doc = app.doc, st = doc.style;
    const grid = el('div', { class: 'rp-tpls' });
    for (const tp of TPLS) {
      const thumb = el('div', { class: 'rp-thumb' });
      thumb.innerHTML = renderSheet({ ...doc, tpl: tp.id, style: { ...st, fit: false } }, { edit: false });
      const sheet = thumb.firstElementChild;
      sheet.style.minHeight = '1122px'; sheet.style.height = '1122px'; sheet.style.overflow = 'hidden';
      grid.append(el('button', { type: 'button', class: `rp-tpl${doc.tpl === tp.id ? ' on' : ''}`, 'data-tpl': tp.id, onclick: () => app.setTemplate(tp.id), 'aria-pressed': doc.tpl === tp.id, 'aria-label': tp[lang] }, thumb, el('span', { text: tp[lang] })));
    }
    requestAnimationFrame(() => { for (const th of grid.querySelectorAll('.rp-thumb')) { const k = th.clientWidth / 794; th.style.height = `${1122 * k}px`; th.firstElementChild.style.transform = `scale(${k})`; } });
    const cur = st.color || tplOf(doc.tpl).color;
    const swatches = el('div', { class: 'rp-sw' }, PALETTE.map((c) => el('button', { type: 'button', class: `sw${c.toLowerCase() === cur.toLowerCase() ? ' on' : ''}`, style: { background: c }, title: c, 'aria-label': c, onclick: () => { st.color = c; app.touchStyle('color', true); } })),
      el('label', { class: 'sw custom', title: T('customColor') }, el('input', { type: 'color', value: cur, oninput: (e) => { st.color = e.target.value; app.touchStyle('color'); } })),
      el('button', { type: 'button', class: 'btn ghost sm', text: T('resetColor'), onclick: () => { st.color = null; app.touchStyle('color', true); } }));
    const fid = st.font || '';
    const fonts = el('select', { 'aria-label': T('font'), onchange: (e) => { st.font = e.target.value || null; app.touchStyle('font'); } },
      el('option', { value: '', text: T('font.tpl'), selected: !fid }),
      FONTS[lang].map(([id, label]) => el('option', { value: id, text: label, selected: fid === id })));
    return el('div', { class: 'rp-pane' },
      el('h4', { text: T('design.templates') }), grid,
      el('h4', { text: T('design.color') }), swatches,
      el('h4', { text: T('design.type') }),
      el('label', { class: 'field' }, el('span', { text: T('font') }), fonts),
      slider(T('fontSize'), 'fs', 12, 16, 0.5, (v) => `${(v * 0.75).toFixed(1)} pt`),
      slider(T('lineHeight'), 'lh', 1.2, 2, 0.05, (v) => v.toFixed(2)),
      el('h4', { text: T('design.spacing') }),
      slider(T('pageMargin'), 'mg', 24, 80, 2, (v) => `${v}`),
      slider(T('modGap'), 'gap', 6, 36, 1, (v) => `${v}`),
      slider(T('entryGap'), 'egap', 2, 24, 1, (v) => `${v}`),
      el('label', { class: 'chk fitchk' }, el('input', { type: 'checkbox', checked: st.fit, onchange: (e) => app.setFit(e.target.checked) }), el('span', { text: T('fitOne') })),
      el('small', { class: 'hint', text: T('fitHint') }),
      el('h4', { text: T('photo.title') }), photoBlock());
  }

  // ---------------------------------------------------------------- assist tab
  const BUCKETS = ['work', 'skills', 'eval'];
  function assistPane() {
    const doc = app.doc;
    const bank = PHRASES.bank[state.role];
    const bucket = bank[state.bucket] || bank.work;
    const tgt = app.targetInfo();
    const chips = el('div', { class: 'rp-chips' }, bucket.map((p) => {
      const plain = htmlText(p);
      return el('button', { type: 'button', class: 'rp-chip', title: T('assist.insert'), onclick: () => app.insertPhrase(p, state.bucket), innerHTML: '' }, '+ ', plain);
    }));
    const verbs = el('div', { class: 'rp-chips verbs' }, PHRASES.verbs.map((v) => el('button', { type: 'button', class: 'rp-chip small', onpointerdown: (e) => e.preventDefault(), onclick: () => app.insertText(v + ' ') }, v)));
    const results = checkDoc(doc, app.pages());
    const sev = { bad: 0, warn: 1, ok: 2 };
    results.sort((a, b) => sev[a.level] - sev[b.level]);
    const score = Math.max(0, 100 - results.filter((r) => r.level === 'bad').length * 14 - results.filter((r) => r.level === 'warn').length * 6);
    return el('div', { class: 'rp-pane' },
      el('div', { class: 'rp-score' }, el('b', { class: score >= 80 ? 'good' : score >= 55 ? 'mid' : 'low', text: String(score) }), el('div', {}, el('strong', { text: T('chk.title') }), el('small', { text: T('chk.sub') }))),
      el('ul', { class: 'rp-checks' }, results.map((r) => el('li', { class: r.level }, icn(r.level === 'ok' ? 'circle-check' : 'triangle-alert'), el('span', { text: r.text })))),
      el('h4', { text: T('assist.title') }),
      el('div', { class: 'grid2' },
        el('label', { class: 'field' }, el('span', { text: T('assist.role') }), el('select', { onchange: (e) => { state.role = e.target.value; try { localStorage.setItem('lk-rv-role', state.role); } catch { /* ignore */ } render(); } }, ROLE_IDS.map((r) => el('option', { value: r, text: T(`role.${r}`), selected: state.role === r })))),
        el('label', { class: 'field' }, el('span', { text: T('assist.kind') }), el('select', { onchange: (e) => { state.bucket = e.target.value; render(); } }, BUCKETS.map((b) => el('option', { value: b, text: T(`bucket.${b}`), selected: state.bucket === b }))))),
      el('p', { class: 'hint', text: T('assist.target', tgt) }), chips,
      el('h4', { text: T('assist.verbs') }), verbs);
  }

  // ---------------------------------------------------------------- shell
  const tabs = [['content', 'file-text', T('tab.content')], ['design', 'palette', T('tab.design')], ['assist', 'sparkles', T('tab.assist')]];
  const head = el('div', { class: 'rp-tabs', role: 'tablist' });
  const body = el('div', { class: 'rp-body' });
  root.append(head, body);
  function render() {
    const top = body.scrollTop;
    head.replaceChildren(...tabs.map(([id, ic, label]) => { const b = el('button', { type: 'button', role: 'tab', class: tab === id ? 'on' : '', 'data-tab': id, 'aria-selected': tab === id, onclick: () => show(id) }); b.append(icn(ic), el('span', { text: label })); return b; }));
    body.replaceChildren(tab === 'content' ? contentPane() : tab === 'design' ? designPane() : assistPane());
    body.scrollTop = top;
  }
  function show(id) { tab = id; app.onTab?.(id); render(); }
  render();
  return { root, render, show, state, get tab() { return tab; }, open, body, expand(id) { open.add(id); } };
}
