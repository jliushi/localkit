import { $, t, el, icon, alertBox, download, fmtBytes, copyText } from './lib.js';

const T = $('#b6-text'), B = $('#b6-b64');
let file = null; // { bytes, name, type } when a file was dropped on the text side
let previewURL = null;

function bytesToB64(bytes, urlSafe = $('#b6-url').checked) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  let s = btoa(bin);
  if (urlSafe) s = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return s;
}

/** Accepts standard or URL-safe Base64, with or without padding, whitespace or a data: prefix. */
export function b64ToBytes(text) {
  const m = text.trim().match(/^data:([^;,]*)(?:;[^,;]*)*;base64,/i);
  if (/^data:/i.test(text.trim()) && !m) return null;
  let s = text.trim().slice(m ? m[0].length : 0).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!s || !/^[A-Za-z0-9+/]+={0,2}$/.test(s) || s.replace(/=+$/, '').length % 4 === 1) return null;
  s = s.replace(/=+$/, '');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return { bytes: out, mime: m?.[1] || null };
}

/** Guesses a file type from magic bytes. */
function sniff(b) {
  const h = (...xs) => xs.every((x, i) => b[i] === x);
  if (h(0x89, 0x50, 0x4e, 0x47)) return ['image/png', 'png'];
  if (h(0xff, 0xd8, 0xff)) return ['image/jpeg', 'jpg'];
  if (h(0x47, 0x49, 0x46, 0x38)) return ['image/gif', 'gif'];
  if (h(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45) return ['image/webp', 'webp'];
  if (h(0x25, 0x50, 0x44, 0x46)) return ['application/pdf', 'pdf'];
  if (h(0x50, 0x4b, 0x03, 0x04)) return ['application/zip', 'zip'];
  if (h(0x49, 0x44, 0x33) || h(0xff, 0xfb)) return ['audio/mpeg', 'mp3'];
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return ['video/mp4', 'mp4'];
  if (h(0x3c, 0x73, 0x76, 0x67) || h(0x3c, 0x3f, 0x78, 0x6d)) return ['image/svg+xml', 'svg'];
  return ['application/octet-stream', 'bin'];
}

function counts() {
  $('#b6-tc').textContent = file ? '' : T.value ? t('chars', T.value.length.toLocaleString()) : '';
  $('#b6-bc').textContent = B.value ? t('chars', B.value.length.toLocaleString()) : '';
}

function encode() {
  clearPreview();
  const bytes = file ? file.bytes : new TextEncoder().encode(T.value);
  let s = bytes.length ? bytesToB64(bytes) : '';
  if (s && $('#b6-uri').checked) s = `data:${file ? file.type : 'text/plain;charset=utf-8'};base64,${bytesToB64(bytes, false)}`;
  B.value = s;
  counts();
}

function clearPreview() {
  if (previewURL) URL.revokeObjectURL(previewURL);
  previewURL = null;
  $('#b6-bin').replaceChildren();
}

function decode() {
  file = null;
  $('#b6-file').replaceChildren();
  const box = $('#b6-bin');
  clearPreview();
  if (!B.value.trim()) { T.value = ''; counts(); return; }
  const r = b64ToBytes(B.value);
  if (!r) { T.value = ''; box.append(alertBox(t('invalid'))); counts(); return; }
  let text = null;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(r.bytes); } catch { text = null; }
  if (text != null && /[\x00-\x08\x0E-\x1F]/.test(text)) text = null;
  const [type, ext] = r.mime && !r.mime.startsWith('text/') ? [r.mime, r.mime.split('/')[1].replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin'] : sniff(r.bytes);
  if (text != null && type === 'application/octet-stream') { T.value = text; counts(); return; }
  if (text != null && type === 'image/svg+xml') T.value = text; else T.value = '';
  const blob = new Blob([r.bytes], { type });
  if (type.startsWith('image/')) previewURL = URL.createObjectURL(blob);
  box.append(el('div', { class: 'out' },
    previewURL ? el('div', { class: 'pic' }, el('img', { src: previewURL, alt: '' })) : null,
    el('div', { class: 'sizes', text: t('binary', type, fmtBytes(r.bytes.length)) }),
    el('div', {}, el('button', { class: 'btn sm', onclick: () => download(blob, `decoded.${ext}`) }, icon('download'), t('download')))));
  counts();
}

T.addEventListener('input', () => { file = null; $('#b6-file').replaceChildren(); encode(); });
B.addEventListener('input', decode);
$('#b6-url').addEventListener('change', () => { if (T.value || file) encode(); });
$('#b6-uri').addEventListener('change', () => { if (T.value || file) encode(); });
$('#b6-copyt').addEventListener('click', (e) => copyText(T.value, e.currentTarget));
$('#b6-copyb').addEventListener('click', (e) => copyText(B.value, e.currentTarget));
$('#b6-clear').addEventListener('click', () => { T.value = B.value = ''; file = null; $('#b6-file').replaceChildren(); clearPreview(); counts(); T.focus(); });

async function takeFile(f) {
  file = { bytes: new Uint8Array(await f.arrayBuffer()), name: f.name, type: f.type || 'application/octet-stream' };
  T.value = '';
  $('#b6-file').replaceChildren(el('div', { class: 'alert info', text: t('fileEncoded', f.name, fmtBytes(f.size)) }));
  encode();
}
T.addEventListener('dragover', (e) => e.preventDefault());
T.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) { e.preventDefault(); takeFile(f); } });
T.addEventListener('paste', (e) => { const f = e.clipboardData?.files?.[0]; if (f) { e.preventDefault(); takeFile(f); } });
counts();
