// Layout engine: builds a template-agnostic block list (P = plain, L = list,
// B = bullets/desc, C = columns, R = rows/tags, X = row split) and paginates it.
import { el } from './lib.js';
import { A4, whenLabel } from './resume-model.js';
import { renderRuns } from './rich.js';

const DASH = ' – ';
export const contactParts = (doc) => {
  const b = doc.modules.find((m) => m.type === 'basic');
  const e = b?.entry || {};
  const parts = [];
  if (doc.info.title) {} // title rendered separately as headline
  if (e.loc) parts.push(e.loc);
  if (e.phone) parts.push(e.phone);
  if (e.email) parts.push(e.email);
  if (e.site) parts.push(e.site);
  if (e.wechat) parts.push(`WeChat: ${e.wechat}`);
  if (e.gender) parts.push(e.gender);
  return parts;
};

/** Flattens the document into layout blocks. Strings come from t() (tool ui). */
export function buildLayout(doc, t) {
  const visible = doc.modules.filter((m) => !m.hidden);
  const blocks = [];
  const present = t('present');
  const headMod = visible.find((m) => m.type === 'basic');
  const jobMod = visible.find((m) => m.type === 'job');

  const pushModule = (m) => {
    const mods = { type: 'modhead', modId: m.id, title: m.title };
    const body = moduleBlocks(m, t, present);
    if (!body.keep.length) return; // module completely empty → skip quietly
    blocks.push(mods, ...body.blocks);
    blocks.push({ type: 'gap', modEnd: true });
  };

  const head = {
    name: doc.info.name, title: doc.info.title, birth: doc.info.birth,
    contact: contactParts(doc),
    photo: doc.photo && doc.style.photoVisible ? doc.photo : null,
    photoShape: doc.style.photoShape,
    jobs: jobMod && !jobMod.hidden ? jobFields(jobMod) : null,
    jobTitle: jobMod ? jobMod.title : '',
    basic: headMod?.entry || {},
  };

  for (const m of visible) if (!['basic', 'job'].includes(m.type)) pushModule(m);
  return { head, blocks };
}

function jobFields(m) {
  const e = m.entry || {};
  return { title: e.title || '', city: e.city || '', salary: e.salary || '', start: e.start || '' };
}

function moduleBlocks(m, t, present) {
  const out = [];
  const entryBlocks = (entry) => {
    const blocks = [];
    const head = headOf(entry, present);
    if (head.title || head.right || head.sub) blocks.push(head);
    const text = entry.text || entry.paras || [];
    if (Array.isArray(text)) blocks.push({ type: 'paras', paras: text, keepStart: true });
    return blocks;
  };
  switch (m.type) {
    case 'education': case 'work': case 'intern': case 'project': case 'campus': case 'custom': {
      const any = (m.entries || []).some((e) => entryHasContent(e));
      if (!any) return { blocks: [], keep: [] };
      out.push({ type: 'list', items: (m.entries || []).map((e) => ({ id: e.id, blocks: entryBlocks(e) })) });
      break;
    }
    case 'skills': case 'hobby': {
      const tags = (m.entry?.tags || []).filter((x) => x.name);
      if (!tags.length) return { blocks: [], keep: [] };
      out.push({ type: 'tags', kind: m.type, tags });
      break;
    }
    case 'cert': case 'award': case 'lang': {
      const rows = (m.entry?.rows || []).filter((r) => r.name || r.level || r.year || r.score);
      if (!rows.length) return { blocks: [], keep: [] };
      out.push({ type: 'rows', kind: m.type, rows });
      break;
    }
    case 'eval': {
      const paras = m.entry?.paras || [];
      if (!paras.some((p) => p.runs?.some((r) => r.text.trim()))) return { blocks: [], keep: [] };
      out.push({ type: 'paras', paras });
      break;
    }
  }
  return { blocks: out, keep: out };
}

function entryHasContent(e) {
  const h = e.head || {};
  if (h.title || h.org || h.role) return true;
  if (e.text?.some?.((p) => p.runs?.some((r) => r.text.trim()))) return true;
  if (e.extra?.name || e.extra?.level || e.extra?.year) return true;
  return false;
}

function headOf(e, present) {
  const h = e.head || {};
  const right = whenLabel(e.when, present);
  const subParts = [];
  if (h.org) subParts.push(h.org);
  if (h.role) subParts.push(h.role);
  const extra = e.extra || {};
  if (extra.name && extra.name !== h.title) subParts.push(extra.name);
  if (extra.year) subParts.push(extra.year);
  if (extra.score) subParts.push(extra.score);
  return { type: 'ehead', title: h.title || '', right, sub: subParts.join('  ·  ') };
}

// ---------------------------------------------------------------- flow

/** Per-module flow blocks used by the renderer/paginator (heights computed there). */
export function flowOfModule(m, t, lane) {
  const present = t('present');
  const entryFlow = (e) => {
    const blocks = [{ type: 'ehead', entry: e, head: headOf(e, present) }];
    if (e.text?.length) blocks.push({ type: 'paras', entry: e, paras: e.text });
    return blocks;
  };
  switch (m.type) {
    case 'education': case 'work': case 'intern': case 'project': case 'campus': case 'custom': { {
      const entries = (m.entries || []).filter((e) => entryHasContent(e));
      return [{ type: 'list', mod: m, items: entries.map((e) => ({ id: e.id, entry: e, blocks: entryFlow(e) })) }];
    } }
    case 'skills': case 'hobby': {
      const tags = (m.entry?.tags || []).filter((x) => x.name);
      return [{ type: 'tags', mod: m, kind: m.type, entry: m.entry, tags: withLevels(tags) }];
    }
    case 'cert': case 'award': case 'lang': {
      const rows = (m.entry?.rows || []).filter((r) => r.name || r.level || r.year || r.score);
      return [{ type: 'rows', mod: m, kind: m.type, entry: m.entry, rows }];
    }
    case 'eval': return [{ type: 'paras', mod: m, paras: m.entry?.paras || [] }];
    case 'basic': return [{ type: 'cr', mod: m, entry: m.entry, rows: contactRows(m, t) }];
    default: return [];
  }
}
const withLevels = (tags) => tags.map((x) => ({ name: x.name, level: clampLevel(x.level) }));
const clampLevel = (n) => Math.max(0, Math.min(5, Math.round(Number(n) || 0)));

/** Job-intention module as key/value rows (勤工俭学用户的右侧简历单元). */
export function jobRows(m) {
  const e = m?.entry || {};
  return [['title', e.title], ['city', e.city], ['salary', e.salary], ['start', e.start]].filter(([, v]) => v);
}

function contactRows(m, t) {
  const e = m?.entry || {};
  const rows = [];
  if (e.loc) rows.push([t('f.loc'), e.loc]);
  if (e.phone) rows.push([t('f.phone'), e.phone]);
  if (e.email) rows.push([t('f.email'), e.email]);
  if (e.site) rows.push([t('f.site'), e.site]);
  if (e.wechat) rows.push([t('f.wechat'), e.wechat]);
  if (e.gender) rows.push([t('f.gender'), e.gender]);
  return rows;
}

// ---------------------------------------------------------------- measure model

/** Rough East-Asian-width based line estimator (uniform font): CJK = 1, ASCII ≈ 0.55 em. */
export const textUnits = (s) => {
  let u = 0;
  for (const ch of String(s || '')) u += ch.charCodeAt(0) > 0xff ? 1 : ch === ' ' ? 0.3 : 0.56;
  return u;
};
export const lineCount = (text, unitsPerLine) => Math.max(1, Math.ceil(textUnits(text) / Math.max(6, unitsPerLine)));

/**
 * Flow → marked atom list with pageBreak markers. measure(b) returns px height
 * (external margins folded into the caller's measure); startUsed lets a lane
 * begin mid-page after a template head.
 */
export function paginateFlow(blocks, pageH, measure) {
  const out = [];
  let used = 0;
  const brk = () => { out.push({ type: 'pageBreak' }); used = 0; };
  const place = (atom) => {
    if (used > 0.5 && atom.h > pageH - used) brk();
    out.push(atom);
    used += atom.h;
  };
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'pageBreak') { brk(); continue; }
    if (block.type === 'modhead') {
      const h = measure(block);
      const next = blocks.slice(i + 1).find((b) => b.type !== 'pageBreak');
      const nextH = next ? firstAtomHeight(next, measure) : 0;
      if (used > 0.5 && h + nextH > pageH - used) brk();
      out.push({ type: 'block', block, h });
      used += h;
      continue;
    }
    if (block.type === 'list') {
      for (const item of block.items) {
        const h = item.__h ?? 0;
        place({ type: 'item', mod: block.mod, item, h, fresh: true });
      }
      continue;
    }
    if (block.type === 'cols') {
      for (const pair of block.pairs) {
        const h = pair.__h ?? Math.max(pair.leftH || 0, pair.rightH || 0);
        place({ type: 'pair', mod: block.mod, pair, h });
      }
      continue;
    }
    if (block.type === 'paras') {
      for (let pi = 0; pi < block.paras.length; pi++) {
        const h = block.paraHs?.[pi] ?? 0;
        place({ type: 'para', mod: block.mod, entry: block.entry, para: block.paras[pi], i: pi, first: pi === 0, h });
      }
      continue;
    }
    place({ type: 'block', block, h: measure(block) });
  }
  return out;
}
function firstAtomHeight(block, measure) {
  if (block.type === 'list') return block.items[0]?.__h ?? 0;
  if (block.type === 'cols') return block.pairs[0]?.__h ?? Math.max(block.pairs[0]?.leftH || 0, block.pairs[0]?.rightH || 0);
  if (block.type === 'paras') return block.paraHs?.[0] ?? 0;
  return measure(block);
}

export { headOf, entryHasContent };