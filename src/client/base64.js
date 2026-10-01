import { $, t, el, dropzone, download, fmtBytes, status, copyText } from './lib.js';

const input = $('#b64-in');
const output = $('#b64-out');
const urlSafe = $('#b64-url');
const dataUri = $('#b64-uri');
const st = status($('#b64-status'));
const count = $('#b64-count');
let fileBytes = null; // bytes of a dropped file, encoded instead of the text box
let fileMeta = null;

function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  let b64 = btoa(bin);
  if (urlSafe.checked) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}

export function b64ToBytes(text) {
  let s = text.trim().replace(/^data:[^,]*;base64,/, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (s.length % 4 === 1 || /[^A-Za-z0-9+/=]/.test(s)) throw new Error(t('invalid'));
  s = s.replace(/=+$/, '');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function show(text) {
  output.value = text;
  count.textContent = t('chars', text.length.toLocaleString());
}

function encode() {
  st.clear();
  const bytes = fileBytes || new TextEncoder().encode(input.value);
  let b64 = bytesToB64(bytes);
  if (dataUri.checked) b64 = `data:${fileMeta?.type || 'text/plain;charset=utf-8'};base64,${bytesToB64(bytes)}`;
  show(b64);
  if (fileBytes) st.ok(t('fileEncoded', fileMeta.name, fmtBytes(fileMeta.size)));
}

function decode() {
  st.clear();
  fileBytes = null;
  let bytes;
  try {
    bytes = b64ToBytes(input.value);
  } catch (e) {
    show('');
    st.error(e);
    return;
  }
  const mime = (input.value.trim().match(/^data:([^;,]+)/) || [])[1];
  let text = null;
  if (!mime || mime.startsWith('text/')) {
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { text = null; }
    if (text != null && /[\x00-\x08\x0E-\x1F]/.test(text)) text = null; // control characters: treat as binary
  }
  if (text != null) { show(text); return; }
  show('');
  const ext = mime ? `.${mime.split('/')[1].replace(/[^a-z0-9]/gi, '')}` : '.bin';
  st.ok(t('decodedBinary', fmtBytes(bytes.length)), ' ',
    el('button', { class: 'btn ghost', text: t('saveAs'), onclick: () => download(new Blob([bytes], { type: mime || 'application/octet-stream' }), `decoded${ext}`) }));
}

$('#b64-enc').addEventListener('click', encode);
$('#b64-dec').addEventListener('click', decode);
$('#b64-copy').addEventListener('click', (e) => copyText(output.value, e.target));
$('#b64-swap').addEventListener('click', () => { fileBytes = null; input.value = output.value; show(''); });
input.addEventListener('input', () => { fileBytes = null; });
urlSafe.addEventListener('change', () => output.value && !dataUri.checked && encode());

dropzone($('#b64-drop'), {
  onFiles: async ([file]) => {
    fileBytes = new Uint8Array(await file.arrayBuffer());
    fileMeta = { name: file.name, size: file.size, type: file.type || 'application/octet-stream' };
    input.value = `[${file.name} · ${fmtBytes(file.size)}]`;
    encode();
  },
});

