// Offline resume checklist: flags weak or incomplete resumes without any server.
import { lang, basicOf, htmlText } from './resume-data.js';
import { T } from './resume-i18n.js';

const NUM = /\d/;
const WEAK_EN = /\b(responsible for|worked on|helped with|duties included|various|etc\.?|hard[- ]working|team player)\b/i;
const WEAK_ZH = /(负责一些|协助完成|参与了|等等|吃苦耐劳|勤奋好学|工作认真)/;

/** Returns [{ level: 'ok'|'warn'|'bad', text }] */
export function checkDoc(doc, pages) {
  const out = [];
  const add = (level, text) => out.push({ level, text });
  const b = basicOf(doc)?.d || {};
  const visible = doc.modules.filter((m) => !m.hidden);
  // identity
  if (!b.name?.trim()) add('bad', T('chk.name')); else add('ok', T('chk.nameOk'));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((b.email || '').trim());
  if (!b.email?.trim()) add('bad', T('chk.email')); else if (!emailOk) add('bad', T('chk.emailBad')); else add('ok', T('chk.emailOk'));
  const phoneDigits = (b.phone || '').replace(/\D/g, '');
  if (!b.phone?.trim()) add('bad', T('chk.phone')); else if (phoneDigits.length < 7) add('warn', T('chk.phoneBad'));
  if (!b.headline?.trim() && !visible.find((m) => m.type === 'job')?.d?.pos) add('warn', T('chk.headline'));
  // structure
  const has = (t) => visible.some((m) => m.type === t && (m.entries?.some((e) => e.org || e.role) || m.items?.some((i) => i.t) || (m.text || '').trim()));
  if (!has('education')) add('warn', T('chk.edu'));
  if (!has('work') && !has('intern') && !has('project') && !has('campus')) add('warn', T('chk.exp'));
  if (!has('skills')) add('warn', T('chk.skills'));
  // bullets
  const bullets = [];
  for (const m of visible) for (const e of m.entries || []) {
    const d = document.createElement('div'); d.innerHTML = e.desc || '';
    const li = [...d.querySelectorAll('li,p')].map((n) => n.textContent.trim()).filter(Boolean);
    for (const t of li) bullets.push({ t, m });
    if ((e.org || e.role) && !li.length && ['work', 'intern', 'project'].includes(m.type)) add('warn', T('chk.noDesc', e.org || e.role));
    if ((e.org || e.role) && !e.start && ['work', 'intern', 'education'].includes(m.type)) add('warn', T('chk.noDate', e.org || e.role));
  }
  const exp = bullets.filter((x) => ['work', 'intern', 'project'].includes(x.m.type));
  if (exp.length >= 3) {
    const share = exp.filter((x) => NUM.test(x.t)).length / exp.length;
    if (share < 0.3) add('warn', T('chk.numbers', Math.round(share * 100))); else add('ok', T('chk.numbersOk'));
  }
  const long = bullets.filter((x) => (lang === 'zh' ? x.t.length > 90 : x.t.split(/\s+/).length > 36));
  if (long.length) add('warn', T('chk.long', long.length));
  const weakRe = lang === 'zh' ? WEAK_ZH : WEAK_EN;
  const weak = bullets.filter((x) => weakRe.test(x.t));
  if (weak.length) add('warn', T('chk.weak', weak.length));
  // leftover template brackets + length
  const allText = visible.map((m) => [m.title, ...(m.entries || []).map((e) => `${e.org} ${e.role} ${htmlText(e.desc)}`), ...(m.items || []).map((i) => i.t), htmlText(m.text)].join(" ")).join(" ");
  if (/\[[^\]\n]{1,30}\]/.test(allText)) add('bad', T('chk.brackets'));
  const words = allText.replace(/\s+/g, lang === 'zh' ? '' : ' ').length;
  if (words < (lang === 'zh' ? 250 : 180)) add('warn', T('chk.short'));
  if (pages > 2) add('bad', T('chk.pages', pages)); else if (pages === 2) add('warn', T('chk.pages2')); else if (words > 0) add('ok', T('chk.onePage'));
  return out;
}
