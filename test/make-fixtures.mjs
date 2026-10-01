// Generates the test fixtures (images and PDFs).  node test/make-fixtures.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
fs.mkdirSync(FIX, { recursive: true });

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 640, height: 480 });
await page.setContent(`<body style="margin:0;width:640px;height:480px;background:linear-gradient(135deg,#f97316,#7c3aed);display:flex;align-items:center;justify-content:center;font:bold 64px sans-serif;color:#fff">LocalKit 测试</body>`);
await page.screenshot({ path: path.join(FIX, 'sample.png') });
await page.screenshot({ path: path.join(FIX, 'sample.jpg'), type: 'jpeg', quality: 90 });
// A "document photo": grey paper with dark text, slightly uneven lighting.
await page.setViewport({ width: 600, height: 800 });
await page.setContent(`<body style="margin:0;width:600px;height:800px;background:radial-gradient(circle at 30% 20%,#d8d4cc,#9d988f);font:22px Georgia,serif;color:#333;padding:60px;box-sizing:border-box">
<h2>Receipt / 收据</h2><p>Item one ........ 12.00</p><p>Item two ........ 8.50</p><p>Total ........... 20.50</p></body>`);
await page.screenshot({ path: path.join(FIX, 'doc-photo.jpg'), type: 'jpeg', quality: 85 });
await browser.close();

async function makePdf(name, pages, label) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= pages; i++) {
    const p = doc.addPage([595, 842]);
    p.drawText(`${label} page ${i}`, { x: 60, y: 760, size: 36, font, color: rgb(0.1, 0.2, 0.5) });
    p.drawRectangle({ x: 60, y: 300, width: 200 + i * 40, height: 120, color: rgb(0.9, 0.5 - i * 0.05, 0.2) });
  }
  fs.writeFileSync(path.join(FIX, name), await doc.save());
}
await makePdf('a.pdf', 3, 'A');
await makePdf('b.pdf', 2, 'B');
await makePdf('long.pdf', 7, 'L');
console.log(fs.readdirSync(FIX).join(', '));
