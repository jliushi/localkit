// Renders icon-180.png and the social preview images in src/assets/og/ (one per tool and language).
// Dev-only (needs the puppeteer devDependency):  node scripts/make-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import { COMMON } from '../src/common-strings.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'src', 'assets');
const OG = path.join(ASSETS, 'og');
fs.mkdirSync(OG, { recursive: true });
const svg64 = (file) => `data:image/svg+xml;base64,${fs.readFileSync(file).toString('base64')}`;
const appIcon = svg64(path.join(ASSETS, 'icon.svg'));
const lucide = (name) => fs.readFileSync(path.join(ROOT, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8').replace(/<!--.*?-->/s, '').replace(/width="24"\s*height="24"/, 'width="120" height="120"').replace('stroke="currentColor"', 'stroke="#fff"');

const tools = [];
for (const f of fs.readdirSync(path.join(ROOT, 'src/tools'))) tools.push((await import(pathToFileURL(path.join(ROOT, 'src/tools', f)).href)).default);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 180, height: 180 });
await page.setContent(`<body style="margin:0"><img src="${appIcon}" width="180" height="180"></body>`);
await page.screenshot({ path: path.join(ASSETS, 'icon-180.png'), omitBackground: true });

await page.setViewport({ width: 1200, height: 630 });
const card = (lang, title, line, color, iconSvg) => `<body style="margin:0;width:1200px;height:630px;box-sizing:border-box;padding:70px 84px;display:flex;flex-direction:column;justify-content:space-between;
  background:radial-gradient(circle at 85% 20%, ${color}55, transparent 55%), linear-gradient(135deg,#0f172a,#111827);color:#fff;font-family:'Segoe UI','Microsoft YaHei',system-ui,sans-serif">
  <div style="display:flex;align-items:center;gap:16px;font-size:34px;font-weight:700;opacity:.92"><img src="${appIcon}" width="58" height="58">${COMMON[lang].siteName}</div>
  <div style="display:flex;align-items:center;gap:46px">
    ${iconSvg ? `<div style="flex:0 0 auto;width:190px;height:190px;border-radius:48px;background:${color};display:grid;place-items:center;box-shadow:0 20px 50px ${color}66">${iconSvg}</div>` : ''}
    <div><div style="font-size:${lang === 'zh' ? 76 : 70}px;font-weight:800;line-height:1.08;letter-spacing:-1px">${title}</div>
    <div style="font-size:${lang === 'zh' ? 34 : 31}px;margin-top:22px;color:#cbd5e1;max-width:760px;line-height:1.35">${line}</div></div>
  </div>
  <div style="display:flex;gap:14px;font-size:26px;color:#e2e8f0">${COMMON[lang].trust.slice(0, 3).map((x) => `<span style="background:rgba(255,255,255,.1);border-radius:999px;padding:8px 20px">✓ ${x}</span>`).join('')}</div>
</body>`;
for (const lang of ['en', 'zh']) {
  await page.setContent(card(lang, COMMON[lang].homeH1, COMMON[lang].homeLead.split(/(?<=[.。])/)[0], '#14b8a6', null));
  await page.screenshot({ path: path.join(OG, `home-${lang}.jpg`), type: 'jpeg', quality: 86 });
  for (const t of tools) {
    const s = t.strings[lang];
    await page.setContent(card(lang, s.name, s.short, t.color, lucide(t.iconName)));
    await page.screenshot({ path: path.join(OG, `${t.id}-${lang}.jpg`), type: 'jpeg', quality: 86 });
  }
}
await browser.close();
console.log(`${tools.length * 2 + 2} images`);
