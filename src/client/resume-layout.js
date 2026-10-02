// Pagination, one-page fit and page-window building.
//
// The sheet is laid out as one tall continuous column. To paginate we measure every "atom"
// (module heading, entry head, one bullet, a tag row, …) and, when an atom would cross the
// bottom margin of a page, insert a spacer in front of it that pushes it to the top of the next
// page. Atoms are never split, so no line is ever cut in half. The final pages are windows
// onto that same tall sheet (translateY), which is why the preview, print/PDF and PNG output
// are guaranteed to break at exactly the same places.
import { A4 } from './resume-data.js';
import { renderSheet, styleAttr } from './resume-tpl.js';
import { RV_CSS } from './resume-css.js';

const ATOMS = '[data-atom], .rv-desc > p, .rv-desc > ul > li, .rv-desc > ol > li, .rv-desc:not(:has(> p, > ul, > ol))';

const keepsWith = (a, b) => {
  if (a.dataset.keep === undefined || !b) return false;
  if (a.closest('.rv-mod') !== b.closest('.rv-mod')) return false;
  return a.classList.contains('rv-mh') || a.closest('.rv-entry') === b.closest('.rv-entry');
};

/** Inserts page-break spacers. Returns the number of pages. */
export function paginate(sheet) {
  const mg = parseFloat(sheet.style.getPropertyValue('--mg')) || 48;
  for (const s of sheet.querySelectorAll('.rv-brk')) s.remove();
  const H = A4.h;
  const mt = mg, mb = mg;
  const box = sheet.getBoundingClientRect();
  const k = box.width / sheet.offsetWidth || 1;
  let maxBottom = 0;
  for (const flow of sheet.querySelectorAll('[data-flow]')) {
    const atoms = [...flow.querySelectorAll(ATOMS)];
    const rects = atoms.map((a) => { const r = a.getBoundingClientRect(); return { top: (r.top - box.top) / k, bottom: (r.bottom - box.top) / k }; });
    let shift = 0;
    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i];
      let top = rects[i].top + shift, bottom = rects[i].bottom + shift;
      let ext = bottom;
      for (let j = i; keepsWith(atoms[j], atoms[j + 1]); j++) ext = rects[j + 1].bottom + shift;
      const page = Math.max(0, Math.floor((top + 0.5) / H));
      const limit = (page + 1) * H - mb;
      let need = 0;
      if (ext > limit + 0.5 && bottom - top <= H - mt - mb) need = (page + 1) * H + mt - top;
      else if (page > 0 && top < page * H + mt - 0.5) need = page * H + mt - top;
      if (need > 0.5) {
        const sp = document.createElement('div');
        sp.className = 'rv-brk';
        sp.style.height = `${need}px`;
        a.before(sp);
        shift += need; top += need; bottom += need;
      }
      if (bottom > maxBottom) maxBottom = bottom;
    }
  }
  const pages = Math.max(1, Math.ceil((maxBottom + mb - 0.5) / H));
  sheet.style.minHeight = `${pages * H}px`;
  return pages;
}

/** Finds the smallest squeeze factor (0..1) that fits one page. Returns { s, pages }. */
export function fitSearch(doc, sheet, apply) {
  const probe = (s) => { sheet.setAttribute('style', `${styleAttr(doc, s)};min-height:${A4.h}px`); return paginate(sheet); };
  const p0 = probe(0);
  if (p0 <= 1) return { s: 0, pages: p0 };
  const p1 = probe(1);
  if (p1 > 1) return { s: 1, pages: p1 };
  let lo = 0, hi = 1;
  for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (probe(mid) <= 1) hi = mid; else lo = mid; }
  const pages = probe(hi);
  return { s: hi, pages };
}

/** Builds read-only page windows for export from the document (own measurement pass). */
export function buildPages(doc) {
  const host = document.createElement('div');
  host.style.cssText = `position:absolute;left:-20000px;top:0;width:${A4.w}px;pointer-events:none`;
  host.innerHTML = renderSheet(doc, { edit: false });
  document.body.append(host);
  const sheet = host.firstElementChild;
  const count = doc.style.fit ? fitSearch(doc, sheet).pages : paginate(sheet);
  const pages = [];
  for (let i = 0; i < count; i++) {
    const page = document.createElement('div');
    page.className = 'rv-page';
    const clone = sheet.cloneNode(true);
    clone.style.top = `${-i * A4.h}px`;
    clone.style.minHeight = `${count * A4.h}px`;
    page.append(clone);
    pages.push(page);
  }
  host.remove();
  return { pages, count };
}

let cssNode = null;
export function ensureCss() {
  if (cssNode) return;
  cssNode = document.createElement('style');
  cssNode.id = 'rv-css';
  cssNode.textContent = RV_CSS;
  document.head.append(cssNode);
}
