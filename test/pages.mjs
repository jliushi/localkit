// Loads every page (both languages) at phone and desktop width: no console errors, no sideways scroll,
// valid hreflang pairs. Saves screenshots of the home pages.  node test/pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.TEST_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'localkit-pages-'));
const BASE = process.env.BASE_URL || 'http://localhost:8090/localkit';
fs.mkdirSync(OUT, { recursive: true });
const sitemap = fs.readFileSync(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8');
const paths = [...sitemap.matchAll(/<loc>[^<]*?\/localkit(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
if (!paths.length) throw new Error('No pages found in sitemap');

const browser = await puppeteer.launch();
const problems = [];
for (const [w, h, tag] of [[390, 844, 'm'], [1280, 900, 'd']]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  let current = '';
  page.on('pageerror', (e) => problems.push(`${current} (${w}): ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${current} (${w}): ${m.text()}`); });
  for (const p of paths) {
    current = p;
    const res = await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle0' });
    if (res.status() !== 200) problems.push(`${p}: HTTP ${res.status()}`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) problems.push(`${p} (${w}): ${over}px horizontal overflow`);
    if (tag === 'd') {
      const alt = await page.$$eval('link[rel=alternate][hreflang]', (ls) => ls.length);
      if (alt !== 3) problems.push(`${p}: ${alt} hreflang links`);
    }
    if (p === '/en/' || p === '/zh/' || p === '/zh/ai-subtitles/') await page.screenshot({ path: path.join(OUT, `page-${tag}${p.replace(/\//g, '_')}.png`), fullPage: true });
  }
  await page.close();
}
await browser.close();
console.log(`${paths.length} pages × 2 widths checked`);
console.log(problems.length ? problems.join('\n') : 'no problems');
process.exit(problems.length ? 1 : 0);
