import { diffLines, diffWordsWithSpace, diffChars } from 'diff';
import { $, $$, t, el, status } from './lib.js';

const A = $('#d-a');
const B = $('#d-b');
const out = $('#d-out');
const st = status($('#d-status'));

const CJK = /[　-鿿가-힯＀-￯]/;
// Word-level diff, falling back to characters for CJK text (no spaces between words).
const inner = (a, b) => (CJK.test(a + b) ? diffChars(a, b) : diffWordsWithSpace(a, b));

function lines(text) {
  const ls = text.split('\n');
  if (ls[ls.length - 1] === '') ls.pop();
  return ls;
}

/** Groups diffLines() output into rows: { type: 'same'|'change', left: [], right: [] } */
function rows(parts) {
  const res = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p.added && !p.removed) { for (const l of lines(p.value)) res.push({ type: 'same', left: l, right: l }); continue; }
    let removed = [], added = [];
    if (p.removed) { removed = lines(p.value); if (parts[i + 1]?.added) added = lines(parts[++i].value); } else added = lines(p.value);
    const n = Math.max(removed.length, added.length);
    for (let k = 0; k < n; k++) res.push({ type: 'change', left: removed[k] ?? null, right: added[k] ?? null });
  }
  return res;
}

function highlight(a, b, side) {
  if (a == null || b == null) return [document.createTextNode((side === 'left' ? a : b) ?? '')];
  return inner(a, b).filter((p) => (side === 'left' ? !p.added : !p.removed)).map((p) =>
    p.added || p.removed ? el('mark', { text: p.value }) : document.createTextNode(p.value));
}

function compare() {
  st.clear();
  const opts = { ignoreCase: $('#d-case').checked, ignoreWhitespace: $('#d-ws').checked };
  const a = A.value.replace(/\r\n?/g, '\n');
  const b = B.value.replace(/\r\n?/g, '\n');
  const parts = diffLines(a.endsWith('\n') ? a : `${a}\n`, b.endsWith('\n') ? b : `${b}\n`, opts);
  let add = 0, del = 0;
  for (const p of parts) { if (p.added) add += p.count; if (p.removed) del += p.count; }
  if (!add && !del) { out.replaceChildren(); st.ok(t('identical')); return; }
  st.ok(t('summary', add, del));
  const view = $$('input[name="d-view"]').find((r) => r.checked).value;
  const rs = rows(parts);
  let ln = 0, rn = 0;
  const table = el('table', { class: `diff ${view}` });
  const body = el('tbody');
  for (const r of rs) {
    const lnum = r.left != null ? ++ln : '';
    const rnum = r.right != null ? ++rn : '';
    if (view === 'split') {
      body.append(el('tr', {},
        el('td', { class: 'n', text: lnum }),
        el('td', { class: r.type === 'same' ? '' : r.left == null ? 'empty' : 'del' }, r.type === 'same' ? r.left : highlight(r.left, r.right, 'left')),
        el('td', { class: 'n', text: rnum }),
        el('td', { class: r.type === 'same' ? '' : r.right == null ? 'empty' : 'add' }, r.type === 'same' ? r.right : highlight(r.left, r.right, 'right'))));
    } else if (r.type === 'same') {
      body.append(el('tr', {}, el('td', { class: 'n', text: lnum }), el('td', { class: 'n', text: rnum }), el('td', { class: 'sign', text: ' ' }), el('td', {}, r.left)));
    } else {
      if (r.left != null) body.append(el('tr', {}, el('td', { class: 'n', text: lnum }), el('td', { class: 'n' }), el('td', { class: 'sign del', text: '−' }), el('td', { class: 'del' }, highlight(r.left, r.right, 'left'))));
      if (r.right != null) body.append(el('tr', {}, el('td', { class: 'n' }), el('td', { class: 'n', text: rnum }), el('td', { class: 'sign add', text: '+' }), el('td', { class: 'add' }, highlight(r.left, r.right, 'right'))));
    }
  }
  table.append(body);
  out.replaceChildren(el('div', { class: 'table-scroll' }, table));
}

$('#d-go').addEventListener('click', compare);
for (const r of $$('input[name="d-view"], #d-case, #d-ws')) r.addEventListener('change', () => out.childElementCount && compare());
$('#d-swap').addEventListener('click', () => { [A.value, B.value] = [B.value, A.value]; if (out.childElementCount) compare(); });
for (const ta of [A, B]) {
  ta.addEventListener('dragover', (e) => e.preventDefault());
  ta.addEventListener('drop', async (e) => {
    const f = e.dataTransfer.files[0];
    if (!f) return;
    e.preventDefault();
    ta.value = await f.text();
  });
}
