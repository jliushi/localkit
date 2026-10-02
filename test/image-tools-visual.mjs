import fs from 'node:fs';
import puppeteer from 'puppeteer';
const base = process.env.BASE_URL || 'http://localhost:8092/localkit';
const browser = await puppeteer.launch();
fs.mkdirSync('test/out/image-tools', { recursive: true });
try {
  for (const tool of ['remove-background', 'image-to-text']) for (const lang of ['en', 'zh']) for (const width of [1280, 390]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });
    await page.goto(`${base}/${lang}/${tool}/`, { waitUntil: 'networkidle0' });
    if (tool === 'remove-background') {
      await page.click('#rb-pick .sample');
      await page.waitForSelector('.rb-view', { timeout: 60000 });
    } else {
      await page.click('#ocr-pick .sample');
      await page.click('#ocr-go');
      await page.waitForSelector('#ocr-list .ocr-text:not([disabled])', { timeout: 60000 });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflow) throw new Error(`${tool}/${lang}/${width} overflows`);
    await page.evaluate(tool => { const el = document.querySelector(tool === 'remove-background' ? '#rb-work' : '#ocr-work'); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 75); }, tool);
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: `test/out/image-tools/${tool}-${lang}-${width}.png` });
    console.log(`${tool} ${lang} ${width}: OK`);
    await page.close();
  }
} finally { await browser.close(); }
