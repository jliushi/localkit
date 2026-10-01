// Rich-text helper: the document model, exports and the WYSIWYG layer all
// understand the same "runs" format — a plain array of paragraphs, each a
// { bullet, runs:[{ text, b, u, i, st, link }] }. Plain strings are reduced
// to runs at the boundary (empty runs array means "render the raw string")
// so legacy plain-text content still works everywhere it is passed around.
import { el, $ } from './lib.js';

export const P = (runs = [], bullet = false) => ({ bullet, runs });
export const R = (text, fmt = {}) => ({ text, ...fmt });

const FMT_KEYS = ['b', 'u', 'i', 'st', 'link'];
export const cleanRuns = (rs) => rs.filter((r) => r.text).map((r) => { const c = {}; for (const k of FMT_KEYS) if (r[k]) c[k] = r[k]; return { text: r.text, ...c }; });
export const plainOf = (para) => (para?.runs || []).map((r) => r.text).join('');
export const hasRuns = (para) => para != null && Array.isArray(para.runs) && para.runs.length > 0;

/** Turns legacy free text ("• one per line") into paragraphs of runs. */
export function textToParas(text, { bullets = true } = {}) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/^\s*([-•*·])\s*(.*)$/) || [null, null, line];
    const content = m[2].trimEnd();
    if (!content.trim() && bullets) continue;
    if (bullets && !m[1]) {
      if (!content.trim()) continue;
      out.push(P(cleanRuns([R(content)])));
    } else {
      out.push(P(cleanRuns([R(content)]), bullets && !!m[1]));
    }
  }
  return out;
}

/** Renders paragraphs of runs to elements (kept inside <ul>/<p> wrappers by callers). */
export function renderRuns(para) {
  const text = para.__raw ?? null; // callers may stash raw text: plain mode render
  if (text != null && !hasRuns(para)) return document.createTextNode(text);
  return (para.runs || []).map((r) => {
    let node = r.text;
    if (r.i) node = el('em', { text: r.text });
    if (r.st) node = el('del', { text: r.text });
    if (r.b) node = el('strong', {}, node);
    if (r.u) node = el('u', {}, node);
    if (r.link) node = el('a', { href: ensureUrl(r.link), target: '_blank', rel: 'noopener', class: 'cv-link' }, node);
    return node;
  });
}

const ensureUrl = (u) => (/^[a-z]+:/i.test(u) ? u : `https://${u}`);

/** Compact HTML-code the WYSIWYG editor reads/writes inside one paragraph. */
export function runsToHtml(para, raw) {
  if (raw != null && !hasRuns(para)) return escapeHtml(raw);
  return (para.runs || []).map((r) => {
    let s = escapeHtml(r.text);
    if (r.st) s = `<del>${s}</del>`;
    if (r.i) s = `<em>${s}</em>`;
    if (r.b) s = `<strong>${s}</strong>`;
    if (r.u) s = `<u>${s}</u>`;
    if (r.link) s = `<a href="${escapeHtml(r.link)}">${s}</a>`;
    return s;
  }).join('');
}
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** DOM subtree → runs (only the tags we emit ourselves are meaningful). */
export function htmlToRuns(container) {
  const runs = [];
  const walk = (node, fmt) => {
    for (const ch of node.childNodes) {
      if (ch.nodeType === Node.TEXT_NODE) {
        if (ch.nodeValue) runs.push({ text: ch.nodeValue, ...fmt });
        continue;
      }
      if (ch.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = ch.tagName;
      if (tag === 'BR') { runs.push({ text: '', ...fmt }); continue; }
      const f = { ...fmt };
      if (tag === 'STRONG' || tag === 'B') f.b = 1;
      if (tag === 'U' || (tag === 'INS')) f.u = 1;
      if (tag === 'EM' || tag === 'I') f.i = 1;
      if (tag === 'DEL' || tag === 'S' || tag === 'STRIKE') f.st = 1;
      if (tag === 'A') f.link = ch.getAttribute('href') || '';
      walk(ch, f);
    }
  };
  walk(container, {});
  // Merge adjacent runs with identical formatting, drop empty ones.
  const out = [];
  for (const r of runs) {
    if (!r.text) continue;
    const last = out[out.length - 1];
    if (last && FMT_KEYS.every((k) => last[k] === r[k])) last.text += r.text;
    else out.push(r);
  }
  return out;
}

/** Runs → plain one-per-line text (for textareas / JSON / clipboard). */
export function parasToText(paras) {
  return (paras || []).map((p) => {
    const txt = plainOf(p) || p.__raw || '';
    return p.bullet ? `• ${txt}` : txt;
  }).filter((l) => l.trim()).join('\n');
}

// ================================================================ wysiwyg

/**
 * Makes the whole resume sheet editable in place.
 * @param {object} o  – { sheet, toolbar, onEdit(penEvent), onFinish(), strings: {linkPrompt} }
 *
 * Fields use data-pen="plain|rich|title|one" and data-path="info.name" /
 * "m.ab12.i2.head.title" / "m.ab12.text" / "m.ab12.title". Committing a field
 * rebuilds the sheet; clicking next to the sheet re-opens the previous field.
 */
export class Pen {
  constructor(o) {
    this.o = o;
    this.active = null; // { el, path, kind, key }
    this.saveTimer = null;
    this.reopenTimer = null;
    this.hoverPad = el('div', { class: 'pen-pad' });
    o.sheet.addEventListener('click', (e) => this.onClick(e));
    o.sheet.addEventListener('mouseover', (e) => this.onHover(e));
    o.sheet.addEventListener('mouseout', (e) => { if (e.relatedTarget && !this.hoverPad.contains(e.relatedTarget)) this.hoverPad.remove(); });
    this.hoverPad.addEventListener('click', () => { if (this.active && this.active.kind !== 'title') this.o.onEdit({ type: 'insert', path: this.active.path }); });
    document.addEventListener('selectionchange', () => this.syncToolbar());
    this.visibleIfHover = !matchMedia('(hover: none)').matches;
  }

  fieldOf(e) { return e.target && e.target.closest ? e.target.closest('[data-pen]') : null; }

  onClick(e) {
    if (e.target.closest('.rb-sheet-ui')) return; // module chrome handles its own clicks
    const newField = this.fieldOf(e);
    // Click on empty sheet area → re-activate last field (handoff across pagination gaps).
    if (!newField || (this.active && newField === this.active.el)) return;
    this.activate(newField, false);
    // Plain text: place caret where the user clicked.
    if (newField.dataset.pen === 'plain') {
      const r = document.caretRangeFromPoint?.(e.clientX, e.clientY);
      if (r) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    } else {
      const sel = getSelection();
      if (!sel.rangeCount || !newField.contains(sel.anchorNode)) selectEnd(newField);
    }
  }

  onHover(e) {
    if (!this.visibleIfHover) return;
    const f = this.fieldOf(e);
    this.o.onEdit({ type: 'hover', path: f?.dataset.path || null, event: e });
    if (f && f.dataset.pen === 'rich' && this.active?.kind === 'rich' && f.dataset.path === this.active.path) {
      f.append(this.hoverPad);
    }
  }

  /** Begin editing a field element. presel=true → select-all (title renaming). */
  activate(field, presel) {
    if (!field) return;
    const same = this.active?.el === field;
    this.commitActive({ silent: same });
    this.active = { el: field, path: field.dataset.path, kind: field.dataset.pen, key: field.dataset.path };
    field.setAttribute('contenteditable', 'true');
    field.classList.add('editing');
    if (this.active.kind === 'rich') this.o.onEdit({ type: 'activate', path: this.active.path });
    if (presel) selectAll(field);
    const onInput = () => this.queueSave();
    const onKey = (e) => {
      if (e.key === 'Escape') { field.blur(); this.o.onEdit({ type: 'finish' }); this.commitActive({}); this.activate(null); e.preventDefault(); }
      if (e.key === 'Enter' && (this.active.kind === 'title' || this.active.kind === 'one')) { e.preventDefault(); field.blur(); }
    };
    field.addEventListener('input', onInput);
    field.addEventListener('keydown', onKey, true);
    field.addEventListener('blur', () => { this.commitActive({}); }, { once: true });
    this.active.cleanup = () => { field.removeEventListener('input', onInput); field.removeEventListener('keydown', onKey, true); };
  }

  /** Deactivates without committing (used right before a rebuild). */
  suspend() {
    if (!this.active) return null;
    const key = this.active.key;
    this._commit(true);
    this.active.cleanup?.();
    this.active = null;
    this.hideToolbar();
    return key;
  }

  commitActive() { this._commit(false); }

  _commit(silent) {
    if (!this.active) return;
    clearTimeout(this.saveTimer);
    const { el, path, kind } = this.active;
    el.removeAttribute('contenteditable');
    el.classList.remove('editing');
    const value = kind === 'rich' ? readRich(el) : el.textContent.replace(/ /g, ' ');
    this.o.onEdit({ type: 'set', path, kind, value, silent });
  }

  queueSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this._commit(false), 350);
  }

  /** Re-focus a field after the sheet was rebuilt (selection lost on rebuild). */
  refocus(key) {
    if (!key) return;
    clearTimeout(this.reopenTimer);
    this.reopenTimer = setTimeout(() => {
      const f = $(`[data-path="${CSS.escape(key)}"]`, this.o.sheet);
      if (!f) return;
      this.activate(f, false);
      selectEnd(f);
    }, 0);
  }

  // ---------------- toolbar

  exec(cmd) {
    if (!this.active) return;
    this.active.el.focus();
    const map = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough' };
    if (cmd === 'bullet') {
      if (this.active.kind !== 'rich') return;
      this.o.onEdit({ type: 'bullet', path: this.active.path });
      return;
    }
    if (cmd === 'link') {
      const sel = getSelection();
      if (!sel.rangeCount || sel.isCollapsed || !this.active.el.contains(sel.anchorNode)) return;
      const current = sel.anchorNode.parentElement?.closest('a')?.getAttribute('href') || '';
      const url = prompt(this.o.strings.linkPrompt, current);
      if (url == null) return;
      if (url === '') { document.execCommand('unlink', false, null); }
      else { document.execCommand('createLink', false, null, ensureUrl(url)); normalizeLinks(this.active.el); }
      this._commit(false);
      return;
    }
    if (map[cmd]) {
      document.execCommand(map[cmd], false, null);
      normalizeEm(this.active.el);
      this._commit(false);
    }
  }

  syncToolbar() {
    if (!this.o.toolbar) return;
    const inHere = this.active && (() => { const s = getSelection(); return s.rangeCount && this.active.el.contains(s.anchorNode); })();
    this.o.toolbar.hidden = !inHere || this.active?.kind === 'one' || this.active?.kind === 'title';
    if (!inHere) return;
    for (const b of this.o.toolbar.querySelectorAll('[data-cmd]')) {
      const cmd = b.dataset.cmd;
      const state = cmd === 'bold' ? document.queryCommandState('bold')
        : cmd === 'italic' ? document.queryCommandState('italic')
        : cmd === 'underline' ? document.queryCommandState('underline') : null;
      b.classList.toggle('on', !!state);
    }
  }

  hideToolbar() { if (this.o.toolbar) this.o.toolbar.hidden = true; }
}

function readRich(root) {
  const paras = [];
  const blocks = [...root.children];
  const blocksAreParas = blocks.length > 0 && blocks.every((n) => n.matches('.pv-p, .pv-li'));
  const src = blocksAreParas ? blocks : [root];
  for (const block of src) {
    if (block.matches('br')) continue;
    const isLi = block.matches('.pv-li, li');
    const runs = cleanRuns(htmlToRuns(block));
    const bullet = isLi || block.classList.contains('bullet') || (block.matches('div, p') && /^\s*[-•*·]\s+/.test(block.textContent));
    if (!runs.length && ![...block.childNodes].some((n) => n.nodeName === 'BR') && !block.textContent.trim()) continue;
    paras.push(P(runs, bullet));
  }
  if (!paras.length && root.textContent.trim()) paras.push(P(cleanRuns([{ text: root.textContent }])));
  // Keep at least one empty paragraph so the empty field stays focusable.
  if (!paras.length) paras.push(P([]));
  return paras;
}

function normalizeLinks(root) {
  for (const a of root.querySelectorAll('a')) {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    a.classList.add('cv-link');
  }
}
function normalizeEm(root) { /* execCommand may leave font-weight on <span>; strip spans, keep semantic tags */
  for (const span of [...root.querySelectorAll('span')]) { while (span.firstChild) span.before(span.firstChild); span.remove(); }
}

/** Replaces the active field's DOM with its paragraphized form (keeps focus). */
export function rebuildActive(pen, paraEls) {
  if (!pen.active) return;
  const sel = getSelection();
  const elv = pen.active.el;
  const hadCaret = sel.rangeCount > 0 && elv.contains(sel.anchorNode);
  const offset = hadCaret ? caretOffset(elv, sel.getRangeAt(0)) : null;
  elv.replaceChildren(...paraEls);
  if (hadCaret && offset != null) restoreCaret(elv, Math.min(offset, elv.textContent.length));
}

export function caretOffset(root, range) {
  const pre = range.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}
export function restoreCaret(root, chars) {
  const sel = getSelection();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n, acc = 0;
  while ((n = walker.nextNode())) {
    if (acc + n.nodeValue.length >= chars) {
      sel.setBaseAndExtent(n, chars - acc, n, chars - acc);
      return;
    }
    acc += n.nodeValue.length;
  }
  selectEnd(root);
}

export function selectEnd(node) {
  const sel = getSelection();
  const r = document.createRange();
  r.selectNodeContents(node);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
}
export function selectAll(node) {
  const sel = getSelection();
  const r = document.createRange();
  r.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(r);
}

// ================================================================ toolbar

/** Builds the floating format toolbar once the svg string map is available. */
export function toolbarEl(svgs, strings, pen) {
  const bar = el('div', { class: 'pen-toolbar', hidden: true });
  const defs = [['bold', 'bold', strings.bold], ['italic', 'italic', strings.italic], ['underline', 'underline', strings.underline], ['strike', 'strikethrough', strings.strike], [null], ['bullet', 'list', strings.bullet], ['link', 'link-2', strings.link]];
  for (const [cmd, ic, title] of defs) {
    if (!cmd) { bar.append(el('i', { class: 'tb-sep' })); continue; }
    const b = el('button', { type: 'button', 'data-cmd': cmd, title, onmousedown: (e) => { e.preventDefault(); pen.exec(cmd); } });
    b.innerHTML = svgs[ic];
    const svg = b.firstElementChild;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('class', 'ic');
    bar.append(b);
  }
  return bar;
}
