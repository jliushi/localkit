// Helpers shared by the tool scripts. Everything here runs locally in the browser.
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
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const ch of children.flat(Infinity)) if (ch != null && ch !== false) e.append(ch instanceof Node ? ch : String(ch));
  return e;
}

export function fmtBytes(b) {
  if (b == null) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (b >= 999.5 && i < u.length - 1) { b /= 1024; i++; }
  return `${i ? b.toFixed(b < 10 ? 1 : 0) : b} ${u[i]}`;
}

export const baseName = (name) => name.replace(/\.[^.]+$/, '');
export const extOf = (name) => (name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || '';

/** Saves a Blob as a file. */
export function download(blob, name) {
  const a = el('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

/** Zips [{ name, blob }] and downloads the archive. */
export async function downloadZip(files, zipName) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const used = new Set();
  for (const f of files) {
    let name = f.name;
    for (let i = 2; used.has(name); i++) name = f.name.replace(/(\.[^.]+)?$/, `-${i}$1`);
    used.add(name);
    zip.file(name, f.blob);
  }
  download(await zip.generateAsync({ type: 'blob' }), zipName);
}

/**
 * Turns an element into a file drop zone with a hidden <input type=file>.
 * opts: { accept, multiple, onFiles(files[]) }
 */
export function dropzone(zone, { accept = '', multiple = false, onFiles }) {
  const input = el('input', { type: 'file', accept, multiple, hidden: true });
  zone.append(input);
  zone.tabIndex = 0;
  zone.setAttribute('role', 'button');
  const take = async (list) => {
    if (zone.closest('[aria-busy="true"]') || zone.closest('[hidden]')) return;
    const files = [...list].filter((f) => matches(f, accept));
    const node = document.querySelector('#tool .status');
    if (!files.length) { if (node) status(node).error(new Error(c('wrongFile'))); return; }
    const task = beginTask();
    try { await onFiles(multiple ? files : files.slice(0, 1)); }
    catch (err) { if (node) status(node).error(err); }
    finally { task.finish(); }
  };
  zone.addEventListener('click', (e) => { if (e.target === input) return; input.click(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { take(input.files); input.value = ''; });
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('over'); take(e.dataTransfer.files); });
  // Pasting files (e.g. screenshots) also works.
  document.addEventListener('paste', (e) => { if (e.clipboardData?.files?.length) take(e.clipboardData.files); });
}

function matches(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(',').map((a) => a.trim().toLowerCase()).some((a) =>
    a.startsWith('.') ? name.endsWith(a) : a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a);
}

/** Status line helper: status(el).busy('…') / .ok('…') / .error(err) / .clear() */
export function status(node) {
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  const set = (cls, ...content) => { node.className = `status ${cls}`; node.replaceChildren(...content); node.hidden = false; };
  return {
    busy: (msg, pct) => set('busy', el('span', { class: 'spinner' }), msg, pct != null ? el('span', { class: 'pct', text: ` ${Math.round(pct)}%` }) : ''),
    ok: (...content) => set('ok', ...content),
    error: (err) => { if (err?.name === 'AbortError') set('', c('cancelled')); else { console.warn(err); set('error', c('error', err?.message || String(err))); } },
    clear: () => { node.hidden = true; node.replaceChildren(); },
  };
}

export async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = el('textarea', {}, text);
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (button) {
    const old = button.textContent;
    button.textContent = c('copied');
    setTimeout(() => { button.textContent = old; }, 1500);
  }
}

export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/** Keep a job's input and settings stable, including drag/drop and clipboard input. */
export function beginTask({ cancellable = false } = {}) {
  const root = $('#tool');
  const controller = new AbortController();
  const children = [...root.children].filter(node => !node.matches('.status, .progress, [role="status"]')).map((node) => [node, node.inert]);
  const focused = document.activeElement;
  root.setAttribute('aria-busy', 'true');
  for (const [node] of children) node.inert = true;
  const cancel = cancellable ? el('button', {
    type: 'button', class: 'btn secondary task-cancel', text: c('cancel'),
    onclick: () => { controller.abort(); cancel.disabled = true; },
  }) : null;
  if (cancel) root.append(cancel);
  let finished = false;
  return {
    signal: controller.signal,
    finish() {
      if (finished) return;
      finished = true;
      for (const [node, inert] of children) node.inert = inert;
      root.removeAttribute('aria-busy');
      cancel?.remove();
      if (focused?.isConnected && focused !== document.body) focused.focus({ preventScroll: true });
    },
  };
}

/** Stop waiting immediately when cancelled; late work cannot update the UI. */
export function abortable(promise, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export function releaseUrls(root) {
  for (const node of root.querySelectorAll('[src]')) {
    if (node.src?.startsWith('blob:')) URL.revokeObjectURL(node.src);
  }
}
