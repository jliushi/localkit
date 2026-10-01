import { diffLines, diffWordsWithSpace, diffChars, createTwoFilesPatch } from 'diff';
import { $, $$, t, el, alertBox, copyText } from './lib.js';

const A = $('#dt-a'), B = $('#dt-b'), out = $('#dt-out');
const CONTEXT = 3;
const CJK = /[　-鿿가-힯＀-￯]/;
const inner = (a, b) => (CJK.test(a + b) ? diffChars(a, b) : diffWordsWithSpace(a, b));
const lines = (text) => { const ls = text.split('\n'); if (ls[ls.length - 1] === '') ls.pop(); return ls; };
const norm = (s) => s.replace(/\r\n?/g, '\n');

/** diffLines output → rows { type: same|change, left, right }. */
function rows(parts) {
  const res = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p.added && !p.removed) { for (const l of lines(p.value)) res.push({ type: 'same', left: l, right: l }); continue; }
    let rem = [], add = [];
    if (p.removed) { rem = lines(p.value); if (parts[i + 1]?.added) add = lines(parts[++i].value); } else add = lines(p.value);
    const n = Math.max(rem.length, add.length);
    for (let k = 0; k < n; k++) res.push({ type: 'change', left: rem[k] ?? null, right: add[k] ?? null });
  }
  return res;
}

function marked(a, b, side) {
  if (a == null || b == null) return [document.createTextNode((side === 'l' ? a : b) ?? '')];
  return inner(a, b).filter((p) => (side === 'l' ? !p.added : !p.removed)).map((p) => (p.added || p.removed ? el('mark', { text: p.value }) : document.createTextNode(p.value)));
}

const expanded = new Set();
let timer = 0;

function compare() {
  const a = norm(A.value), b = norm(B.value);
  $('#dt-ca').textContent = a ? `${lines(a).length}` : '';
  $('#dt-cb').textContent = b ? `${lines(b).length}` : '';
  if (!a && !b) { out.replaceChildren(alertBox(t('empty'), 'info')); $('#dt-stats').textContent = ''; return; }
  const opts = { ignoreCase: $('#dt-case').checked, ignoreWhitespace: $('#dt-ws').checked };
  const parts = diffLines(a.endsWith('\n') ? a : `${a}\n`, b.endsWith('\n') ? b : `${b}\n`, opts);
  let add = 0, del = 0, same = 0;
  for (const p of parts) { if (p.added) add += p.count; else if (p.removed) del += p.count; else same += p.count; }
  $('#dt-stats').textContent = t('stats', add, del, same);
  if (!add && !del) { out.replaceChildren(alertBox(t('identical'), 'info')); return; }
  const view = $$('input[name="dt-view"]').find((r) => r.checked).value;
  const rs = rows(parts);
  // Line numbers for each row.
  let ln = 0, rn = 0;
  for (const r of rs) { r.ln = r.left != null ? ++ln : ''; r.rn = r.right != null ? ++rn : ''; }
  // Which "same" rows are within CONTEXT of a change (always shown).
  const near = new Array(rs.length).fill(false);
  rs.forEach((r, i) => { if (r.type === 'change') for (let k = Math.max(0, i - CONTEXT); k <= Math.min(rs.length - 1, i + CONTEXT); k++) near[k] = true; });
  const body = el('tbody');
  for (let i = 0; i < rs.length;) {
    if (rs[i].type === 'same' && !near[i] && !expanded.has(i)) {
      let j = i;
      while (j < rs.length && rs[j].type === 'same' && !near[j]) j++;
      const start = i;
      body.append(el('tr', { class: 'fold', onclick: () => { for (let k = start; k < j; k++) expanded.add(k); compare(); } },
        el('td', { colspan: view === 'split' ? 4 : 4, text: `⋯ ${t('unchanged', j - i)} ⋯` })));
      i = j;
      continue;
    }
    const r = rs[i];
    if (view === 'split') {
      body.append(el('tr', {},
        el('td', { class: 'n', text: r.ln }),
        el('td', { class: `c ${r.type === 'same' ? '' : r.left == null ? 'empty' : 'del'}` }, r.type === 'same' ? r.left : marked(r.left, r.right, 'l')),
        el('td', { class: 'n', text: r.rn }),
        el('td', { class: `c ${r.type === 'same' ? '' : r.right == null ? 'empty' : 'add'}` }, r.type === 'same' ? r.right : marked(r.left, r.right, 'r'))));
    } else if (r.type === 'same') {
      body.append(el('tr', {}, el('td', { class: 'n', text: r.ln }), el('td', { class: 'n', text: r.rn }), el('td', { class: 's', text: ' ' }), el('td', {}, r.left)));
    } else {
      if (r.left != null) body.append(el('tr', {}, el('td', { class: 'n', text: r.ln }), el('td', { class: 'n' }), el('td', { class: 's', text: '−' }), el('td', { class: 'del' }, marked(r.left, r.right, 'l'))));
      if (r.right != null) body.append(el('tr', {}, el('td', { class: 'n' }), el('td', { class: 'n', text: r.rn }), el('td', { class: 's', text: '+' }), el('td', { class: 'add' }, marked(r.left, r.right, 'r'))));
    }
    i++;
  }
  out.replaceChildren(el('div', { class: 'table-scroll' }, el('table', { class: `diff ${view}` }, body)));
}

const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { expanded.clear(); compare(); }, A.value.length + B.value.length > 200000 ? 400 : 120); };
A.addEventListener('input', schedule);
B.addEventListener('input', schedule);
for (const x of $$('input[name="dt-view"], #dt-case, #dt-ws')) x.addEventListener('change', compare);
$('#dt-swap').addEventListener('click', () => { [A.value, B.value] = [B.value, A.value]; schedule(); });
$('#dt-clear').addEventListener('click', () => { A.value = B.value = ''; schedule(); A.focus(); });
$('#dt-copy').addEventListener('click', (e) => copyText(createTwoFilesPatch('original', 'changed', norm(A.value), norm(B.value), '', '', { context: CONTEXT }), e.currentTarget));
for (const ta of [A, B]) {
  ta.addEventListener('dragover', (e) => e.preventDefault());
  ta.addEventListener('drop', async (e) => {
    const f = e.dataTransfer.files[0];
    if (!f) return;
    e.preventDefault();
    ta.value = await f.text();
    schedule();
  });
}
compare();
