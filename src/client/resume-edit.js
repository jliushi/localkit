// In-place editing engine: contenteditable fields, paste sanitising, the floating format toolbar.
import { el } from './lib.js';
import { cleanHtml } from './resume-data.js';
import { ri } from './resume-icons.js';
import { T } from './resume-i18n.js';

const isRich = (e) => e && e.closest?.('[data-rich]');
const fieldOf = (t) => (t instanceof Element ? t.closest('[data-ref][contenteditable]') : null);

export function initEditing({ onField, onEnter, onFocus }) {
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* ignore */ }

  // ---- floating toolbar
  let linkMode = false, saved = null;
  const btn = (cmd, icon, title) => el('button', { type: 'button', class: 'ftb-b', 'data-cmd': cmd, title }, '');
  const bar = el('div', { class: 'rv-ftb', hidden: true, role: 'toolbar', 'aria-label': T('ftb.label') });
  const mk = (cmd, icon, title) => { const b = btn(cmd, icon, title); b.innerHTML = ri(icon, 'ic'); b.setAttribute('aria-label', title); return b; };
  const linkInput = el('input', { type: 'text', placeholder: 'https://…', class: 'ftb-in' });
  const linkRow = el('div', { class: 'ftb-link', hidden: true }, linkInput,
    el('button', { type: 'button', class: 'ftb-ok', text: 'OK', onclick: () => applyLink() }),
    el('button', { type: 'button', class: 'ftb-ok', text: '×', onclick: () => closeLink() }));
  const row = el('div', { class: 'ftb-row' },
    mk('bold', 'bold', T('ftb.bold')), mk('italic', 'italic', T('ftb.italic')), mk('underline', 'underline', T('ftb.underline')),
    el('i', { class: 'ftb-sep' }), mk('insertUnorderedList', 'list', T('ftb.list')), mk('link', 'link', T('ftb.link')), mk('removeFormat', 'remove-formatting', T('ftb.clear')));
  bar.append(row, linkRow);
  document.body.append(bar);

  const selInside = (f) => { const s = getSelection(); return s && s.rangeCount && f.contains(s.anchorNode); };
  function closeLink() { linkMode = false; linkRow.hidden = true; row.hidden = false; saved = null; }
  function applyLink() {
    const v = linkInput.value.trim();
    const f = document.querySelector('[data-rich]:focus, [data-rich]:focus-within') || saved?.field;
    if (f) { f.focus(); const s = getSelection(); if (saved) { s.removeAllRanges(); s.addRange(saved.range); } }
    if (v) document.execCommand('createLink', false, v); else document.execCommand('unlink');
    closeLink();
    place();
  }
  function place() {
    const f = isRich(document.activeElement);
    if (!f || !document.activeElement.isConnected) { if (!linkMode) bar.hidden = true; return; }
    const s = getSelection();
    let r = null;
    if (s && s.rangeCount && selInside(f)) { r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width && !r.height) r = null; }
    const fr = f.getBoundingClientRect();
    const target = r || fr;
    bar.hidden = false;
    const bw = bar.offsetWidth, bh = bar.offsetHeight;
    let x = Math.min(Math.max(8, (r ? r.left + r.width / 2 : fr.left + 40) - bw / 2), innerWidth - bw - 8);
    let y = target.top - bh - 8;
    if (y < 8) y = Math.min(innerHeight - bh - 8, (r ? r.bottom : fr.top + 24) + 8);
    bar.style.left = `${x}px`; bar.style.top = `${y}px`;
    for (const b of row.querySelectorAll('[data-cmd]')) {
      const c = b.dataset.cmd;
      if (['bold', 'italic', 'underline', 'insertUnorderedList'].includes(c)) { let on = false; try { on = document.queryCommandState(c); } catch { /* ignore */ } b.classList.toggle('on', on); }
    }
  }
  bar.addEventListener('pointerdown', (e) => { if (e.target.closest('.ftb-in')) return; e.preventDefault(); });
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (!b) return;
    const f = isRich(document.activeElement);
    if (!f) return;
    const cmd = b.dataset.cmd;
    if (cmd === 'link') {
      const s = getSelection();
      saved = { range: s.rangeCount ? s.getRangeAt(0).cloneRange() : null, field: f };
      linkMode = true; row.hidden = true; linkRow.hidden = false;
      const a = s.anchorNode?.parentElement?.closest('a');
      linkInput.value = a ? a.getAttribute('href') : '';
      linkInput.focus();
      return;
    }
    document.execCommand(cmd, false, null);
    place();
  });
  linkInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') closeLink(); });
  document.addEventListener('selectionchange', () => { if (!linkMode) requestAnimationFrame(place); });
  addEventListener('scroll', () => { if (!bar.hidden && !linkMode) place(); }, true);
  addEventListener('resize', () => { if (!bar.hidden) place(); });
  document.addEventListener('focusout', (e) => {
    if (linkMode) return;
    setTimeout(() => { if (!isRich(document.activeElement)) bar.hidden = true; }, 0);
  });

  // ---- field events
  document.addEventListener('input', (e) => {
    const f = fieldOf(e.target);
    if (!f) return;
    if (!isRich(f) && f.textContent === '' && f.innerHTML !== '') f.innerHTML = '';
    onField(f);
  });
  document.addEventListener('focusin', (e) => { const f = fieldOf(e.target); if (f) onFocus?.(f); });
  document.addEventListener('keydown', (e) => {
    const f = fieldOf(e.target);
    if (!f) return;
    if (!isRich(f)) {
      if (e.key === 'Enter') { e.preventDefault(); onEnter?.(f); return; }
      if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) { e.preventDefault(); return; }
    }
    if (e.key === 'Escape') f.blur();
  });
  document.addEventListener('paste', (e) => {
    const f = fieldOf(e.target);
    if (!f) return;
    e.preventDefault();
    const cd = e.clipboardData;
    if (isRich(f) && cd.getData('text/html')) {
      const clean = cleanHtml(cd.getData('text/html').replace(/<!--.*?-->/gs, ''));
      document.execCommand('insertHTML', false, clean.replace(/<\/?(p|ul|ol)>/g, (m) => (m[1] === '/' ? '<br>' : '')).replace(/<li>/g, '• ').replace(/<\/li>/g, '<br>'));
    } else {
      let text = cd.getData('text/plain');
      if (!isRich(f)) text = text.replace(/\s*[\r\n]+\s*/g, ' ');
      document.execCommand('insertText', false, text);
    }
  });
  return { hide: () => { bar.hidden = true; } };
}
