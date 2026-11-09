// UI kit shared by every tool. Everything runs locally in the browser.
import { icon } from './icons.js';

export { icon };

const dataEl = document.getElementById('lk-data');
export const LK = dataEl ? JSON.parse(dataEl.textContent) : { lang: 'en', s: {}, c: {}, base: '' };
export const lang = LK.lang;

const fill = (str, args) => String(str ?? '').replace(/\$(\d)/g, (_, i) => args[Number(i) - 1] ?? '');
/** Tool string. */
export const t = (key, ...args) => fill(LK.s[key] ?? key, args);
/** Common string. */
export const c = (key, ...args) => fill(LK.c[key] ?? key, args);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'text') e.textContent = v;
    else if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const ch of children.flat(Infinity)) if (ch != null && ch !== false) e.append(ch instanceof Node ? ch : String(ch));
  return e;
}

// ---------------------------------------------------------------- formatting

const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 1 });
export const fmtNum = (n) => nf.format(n);

export function fmtBytes(b) {
  if (b == null || !Number.isFinite(b)) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (b >= 999.5 && i < u.length - 1) { b /= 1024; i++; }
  return `${i ? b.toFixed(b < 10 ? 1 : 0) : Math.round(b)} ${u[i]}`;
}

/** 75.4 → "1:15", 3725 → "1:02:05" (for durations shown to people). */
export function fmtDuration(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

/** Precise editable time: "01:02.35" or "1:01:02.35". */
export function fmtTime(sec, digits = 2) {
  if (sec == null || !Number.isFinite(sec)) return '--:--';
  const neg = sec < 0;
  sec = Math.abs(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  const s = (sec % 60).toFixed(digits).padStart(digits ? digits + 3 : 2, '0');
  return `${neg ? '-' : ''}${h ? `${h}:${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')}:${s}`;
}

/** Parses "1:02.5", "62.5", "00:01:02,500" into seconds; null when invalid. */
export function parseTime(text) {
  const value = String(text).trim().replace(',', '.');
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(value)) return null;
  const parts = value.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part)) || parts.slice(1).some((part) => part >= 60)) return null;
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return Number.isFinite(seconds) ? seconds : null;
}

export const baseName = (name) => name.replace(/\.[^.]+$/, '');
export const extOf = (name) => (name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || '';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

// ---------------------------------------------------------------- downloads

export function download(blob, name) {
  const a = el('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 120000);
}

/** Zips [{ name, blob }] (duplicate names get "-2", "-3"…) and downloads the archive. */
export async function downloadZip(files, zipName) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const used = new Set();
  for (const f of files) {
    let name = f.name;
    for (let i = 2; used.has(name.toLowerCase()); i++) name = f.name.replace(/(\.[^.]+)?$/, `-${i}$1`);
    used.add(name.toLowerCase());
    zip.file(name, f.blob);
  }
  download(await zip.generateAsync({ type: 'blob', compression: 'STORE' }), zipName);
}

export function toast(msg, ms = 2600) {
  const n = el('div', { class: 'toast', role: 'status', text: msg });
  document.body.append(n);
  setTimeout(() => n.remove(), ms);
}

export async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = el('textarea', { style: { position: 'fixed', opacity: '0' } }, text);
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(c('copied'));
  if (button) button.blur();
}

// ---------------------------------------------------------------- file picker

function accepts(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(',').map((a) => a.trim().toLowerCase()).some((a) =>
    a.startsWith('.') ? name.endsWith(a) : a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a);
}

/**
 * Big drop zone: drag & drop, click, paste, keyboard, and an optional "try a sample" link.
 * opts: { accept, multiple, iconName, title, hint, button, sample: { url, name, type }, compact, onFiles(files) }
 */
export function filePicker(root, opts) {
  const input = el('input', { type: 'file', accept: opts.accept || null, multiple: !!opts.multiple, hidden: true });
  const zone = el('div', { class: `drop${opts.compact ? ' compact' : ''}`, tabindex: 0, role: 'button', 'aria-label': opts.title },
    el('div', { class: 'drop-ic' }, icon(opts.iconName || 'upload')),
    opts.compact
      ? el('div', {}, el('strong', { text: opts.title }), opts.hint ? el('div', { class: 'hint', text: opts.hint }) : null)
      : [el('strong', { text: opts.title }),
        el('span', { class: 'btn' }, icon('upload'), opts.button || c('chooseFiles')),
        opts.hint ? el('div', { class: 'hint', text: opts.hint }) : null],
    input);
  let taking = false;
  const take = async (source) => {
    if (taking) return;
    taking = true;
    zone.setAttribute('aria-busy', 'true');
    try {
      const list = typeof source === 'function' ? await source() : source;
      const files = [...list].filter((file) => accepts(file, opts.accept));
      if (!files.length) { if (list.length) toast(c('wrongType')); return; }
      await opts.onFiles(opts.multiple ? files : files.slice(0, 1));
    } catch (error) {
      toast(errorText(error), 6000);
    } finally {
      taking = false;
      zone.removeAttribute('aria-busy');
    }
  };
  if (opts.sample && !opts.compact) {
    zone.append(el('button', { type: 'button', class: 'sample', text: c('trySample'), onclick: async (e) => {
      e.stopPropagation();
      const b = e.currentTarget;
      b.disabled = true;
      try {
        await take(async () => {
          const res = await fetch(opts.sample.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${opts.sample.name}`);
          const blob = await res.blob();
          return [new File([blob], opts.sample.name, { type: opts.sample.type || blob.type })];
        });
      } finally { b.disabled = false; }
    } }));
  }
  zone.addEventListener('click', (e) => { if (e.target === input || e.target.closest('.sample')) return; input.click(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { take(input.files); input.value = ''; });
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('over'); });
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('over'); take(e.dataTransfer.files); });
  document.addEventListener('paste', (e) => {
    if (zone.isConnected && !zone.closest('[hidden]') && e.clipboardData?.files?.length && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) take(e.clipboardData.files);
  });
  root.replaceChildren(zone);
  return { zone, input, open: () => input.click() };
}

/** Compact "selected file" card with a Change button. */
export function fileCard({ file, thumb, meta, onChange }) {
  return el('div', { class: 'filecard' },
    el('div', { class: 'thumb' }, thumb || icon('fileText')),
    el('div', { class: 'meta' }, el('strong', { text: file.name, title: file.name }), el('small', { text: meta || fmtBytes(file.size) })),
    onChange ? el('button', { type: 'button', class: 'btn ghost sm', onclick: onChange }, icon('refresh'), c('change')) : null);
}

// ---------------------------------------------------------------- progress

/**
 * Progress panel with percentage, elapsed/remaining time and an optional Cancel button.
 * const task = progress(container, { title, onCancel }); task.set(0.42); task.text('…'); task.close();
 */
export function progress(container, { title, onCancel } = {}) {
  const pct = el('span', { class: 'task-pct' });
  const bar = el('div', { class: 'bar indet' }, el('i'));
  const sub = el('span');
  const eta = el('span');
  const titleEl = el('span', { text: title || c('working') });
  const node = el('div', { class: 'task', role: 'status', 'aria-live': 'polite' },
    el('div', { class: 'task-top' }, el('div', { class: 'task-title' }, el('span', { class: 'spinner' }), titleEl), pct),
    bar,
    el('div', { class: 'task-sub' }, sub, eta),
    onCancel ? el('div', {}, el('button', { type: 'button', class: 'btn ghost sm', onclick: onCancel }, icon('x'), c('cancel'))) : null);
  container.replaceChildren(node);
  let started = 0;
  return {
    node,
    title(text) { titleEl.textContent = text; },
    text(text) { sub.textContent = text || ''; },
    set(p) {
      if (p == null || !Number.isFinite(p)) { bar.classList.add('indet'); pct.textContent = ''; eta.textContent = ''; return; }
      p = Math.max(0, Math.min(1, p));
      bar.classList.remove('indet');
      bar.firstElementChild.style.width = `${(p * 100).toFixed(1)}%`;
      pct.textContent = `${Math.floor(p * 100)}%`;
      if (!started && p > 0) started = performance.now() - 1;
      const elapsed = (performance.now() - started) / 1000;
      if (p > 0.03 && p < 1 && elapsed > 2) eta.textContent = c('remaining', fmtDuration((elapsed / p) * (1 - p)));
    },
    close() { node.remove(); },
  };
}

export function stat(label, value, good) {
  return el('div', { class: `stat${good ? ' good' : ''}` }, el('small', { text: label }), el('b', { text: value }));
}

export function alertBox(message, kind = 'error') {
  return el('div', { class: `alert ${kind}`, role: kind === 'error' ? 'alert' : 'status', text: message });
}

/** Human-friendly error text for common failures. */
export function errorText(err) {
  const msg = err?.message || String(err);
  if (/out of memory|allocation failed|Array buffer allocation/i.test(msg)) return c('errMemory');
  return c('error', msg);
}
