// Shared app-level UI pieces too big for lib.js: a cards-based multi-mode
// picker ("Sticker wall") and a promise-based modal prompt. Used so far by
// the resume builder; written generically so future tools can reuse them.
import { el, icon } from './lib.js';

/**
 * @param {HTMLElement} root
 * @param {object} def { cols: [{key, title}[]|'reset'], sections?: [{key, title, items}], newItem?, onPick(key||item), onReset?(), hint? }
 *   item: { preview?: HTMLElement, glyph?: 'layout-etc' (glyphs drawn by caller-render fn), name, sub? }
 * opts.renderGlyph?: (g) => svg — glyphs resolved lazily by the caller.
 */
export function multiPicker(root, def, opts = {}) {
  const cards = [];
  const wall = el('div', { class: 'mp' });
  let activeKey = def.newItem ? '__new__' : null;

  const selectKey = (key) => {
    activeKey = key;
    for (const [k, c] of cards) c.closest('[hidden], [hidden] *') || c.classList.toggle('on', k === activeKey);
  };

  for (const col of def.cols) {
    if (col === 'reset') {
      const b = el('button', { type: 'button', class: 'mp-reset', text: def.resetText, onclick: () => def.onReset?.() });
      // strip "× " prefix into an icon-like look
      b.textContent = '';
      b.append(icon('rotateCcw'), document.createTextNode(def.resetText.replace(/^×\s*/, '')));
      wall.append(b);
      continue;
    }
    const colEl = el('section', { class: 'mp-col' }, el('h4', { text: col.title }));
    const grid = el('div', { class: 'mp-grid' });
    const items = col.key === 'new' ? [def.newItem] : (def.sections.find((s) => s.key === col.key)?.items || []);
    for (const item of items) {
      const key = item.id || item.key || '__new__';
      const card = el('button', { type: 'button', class: 'mp-card', 'data-key': key, title: item.sub || item.name, onclick: () => { selectKey(key); if (col.key === 'new') def.onNew?.(item); else def.onPick?.(item); } });
      if (item.preview) card.append(item.preview);
      if (item.glyph && opts.renderGlyph) card.append(opts.renderGlyph(item.glyph));
      card.append(el('span', { class: 'mp-name', text: item.name }), item.sub ? el('small', { text: item.sub }) : null);
      if (item.id === 'new') card.classList.add('mp-new');
      grid.append(card);
      cards.push([key, card]);
    }
    colEl.append(grid);
    wall.append(colEl);
  }
  if (def.hint) wall.append(el('p', { class: 'mp-hint', text: def.hint }));
  root.replaceChildren(wall);
  return { selectKey: (k) => selectKey(k || activeKey), root: wall };
}

/** Promise-based modal prompt: promptDialog({title, fields:[{key,label,value,ph,hint,text?}], okText}) → values|null */
export function promptDialog({ title, fields, okText = 'OK' }) {
  return new Promise((resolve) => {
    const inputs = {};
    const dlg = el('dialog', {},
      el('h3', { text: title }),
      fields.filter((f) => !f.text).map((f) => el('label', { class: 'field', style: { marginBottom: '12px' } },
        el('span', { text: f.label }),
        inputs[f.key] = el('input', { type: 'text', value: f.value || '', placeholder: f.ph || '' }))),
      fields.filter((f) => f.text).map((f) => el('p', { class: 'hint', text: f.text })),
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'btn ghost', text: cancelText(), onclick: () => close(null) }),
        el('button', { type: 'button', class: 'btn', text: okText, onclick: () => close(Object.fromEntries(fields.filter((f) => !f.text).map((f) => [f.key, inputs[f.key].value]))) })));
    document.body.append(dlg);
    const close = (v) => { dlg.close(); dlg.remove(); resolve(v); };
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
    dlg.showModal();
    inputs[fields.find((f) => !f.text)?.key]?.focus();
  });
}
const cancelText = () => document.documentElement.lang === 'zh' ? '取消' : 'Cancel';
