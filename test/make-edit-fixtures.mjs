// Fixtures for the PDF editor tests: text with English + Chinese lines, and a fillable form.  node test/make-edit-fixtures.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'test', 'fixtures');
const NOTO = path.join(ROOT, 'node_modules/@fontsource/noto-sans-sc');

function sliceFor(ch) {
  const css = fs.readFileSync(path.join(NOTO, '400.css'), 'utf8');
  const cp = ch.codePointAt(0);
  for (const m of css.matchAll(/url\(\.\/files\/(noto-sans-sc-[^)]*?-400-normal\.woff2)\)[^}]*?unicode-range:\s*([^;]+);/g)) {
    for (const r of m[2].split(',')) {
      const [a, b] = r.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16));
      if (cp >= a && cp <= (b ?? a)) return path.join(NOTO, 'files', m[1].replace('.woff2', '.woff'));
    }
  }
  throw new Error(`no slice for ${ch}`);
}

// --- edit-text.pdf: one page, Helvetica + Times lines and a Chinese line
{
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([595, 842]);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const cjkFiles = new Map();
  const cjk = async (ch) => { const f = sliceFor(ch); if (!cjkFiles.has(f)) cjkFiles.set(f, await doc.embedFont(fs.readFileSync(f), { subset: true })); return cjkFiles.get(f); };
  page.drawText('Invoice Number 20458', { x: 60, y: 760, size: 22, font: helv, color: rgb(0.1, 0.2, 0.5) });
  page.drawText('Payment due within thirty days of receipt.', { x: 60, y: 720, size: 12, font: times, color: rgb(0, 0, 0) });
  page.drawText('Customer: Acme Trading Ltd', { x: 60, y: 690, size: 12, font: helv, color: rgb(0.8, 0.1, 0.1) });
  // CJK glyphs may come from different slices: draw character by character.
  let x = 60;
  for (const ch of '合同编号：甲方付款') { const f = await cjk(ch); page.drawText(ch, { x, y: 640, size: 16, font: f, color: rgb(0, 0, 0) }); x += 16; }
  fs.writeFileSync(path.join(FIX, 'edit-text.pdf'), await doc.save());
}

// --- form.pdf: text, checkbox, radio, dropdown
{
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();
  page.drawText('Application form', { x: 60, y: 780, size: 22, font });
  page.drawText('Full name', { x: 60, y: 735, size: 11, font });
  form.createTextField('fullName').addToPage(page, { x: 150, y: 725, width: 250, height: 22 });
  page.drawText('Subscribe', { x: 60, y: 690, size: 11, font });
  form.createCheckBox('subscribe').addToPage(page, { x: 150, y: 685, width: 18, height: 18 });
  page.drawText('Plan', { x: 60, y: 650, size: 11, font });
  const radio = form.createRadioGroup('plan');
  radio.addOptionToPage('basic', page, { x: 150, y: 645, width: 16, height: 16 });
  radio.addOptionToPage('pro', page, { x: 230, y: 645, width: 16, height: 16 });
  page.drawText('Country', { x: 60, y: 610, size: 11, font });
  const dd = form.createDropdown('country');
  dd.addOptions(['Canada', 'China', 'France']);
  dd.addToPage(page, { x: 150, y: 600, width: 160, height: 22 });
  fs.writeFileSync(path.join(FIX, 'form.pdf'), await doc.save());
}
console.log('ok');
