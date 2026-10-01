// Renders icon-180.png and the social preview images (og-en.png, og-zh.png) into src/assets.
// Dev-only (needs the puppeteer devDependency):  node scripts/make-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets');
const svg = `data:image/svg+xml;base64,${fs.readFileSync(path.join(ASSETS, 'icon.svg')).toString('base64')}`;
const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.setViewport({ width: 180, height: 180 });
await page.setContent(`<body style="margin:0"><img src="${svg}" width="180" height="180"></body>`);
await page.screenshot({ path: path.join(ASSETS, 'icon-180.png'), omitBackground: true });

const og = {
  en: ['LocalKit', 'Free online tools that never upload your files', ['AI subtitles', 'PDF tools', 'Image converter', 'Video tools', 'Resume builder']],
  zh: ['LocalKit 本地工具箱', '文件不上传的免费在线工具', ['AI 字幕', 'PDF 工具', '图片转换', '视频工具', '简历制作']],
};
await page.setViewport({ width: 1200, height: 630 });
for (const [lang, [name, line, chips]] of Object.entries(og)) {
  await page.setContent(`<body style="margin:0;width:1200px;height:630px;box-sizing:border-box;padding:70px 90px;display:flex;flex-direction:column;justify-content:center;
    background:linear-gradient(135deg,#14b8a6,#0f766e);color:#fff;font-family:'Segoe UI','Microsoft YaHei',system-ui,sans-serif">
    <div style="display:flex;align-items:center;gap:22px"><img src="${svg}" width="92" height="92" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.25))"><span style="font-size:46px;font-weight:700">${name}</span></div>
    <div style="font-size:${lang === 'zh' ? 70 : 62}px;font-weight:800;line-height:1.15;margin:38px 0 34px;max-width:1000px">${line}</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap">${chips.map((c) => `<span style="background:rgba(255,255,255,.18);border-radius:999px;padding:8px 20px;font-size:28px">${c}</span>`).join('')}</div>
  </body>`);
  await page.screenshot({ path: path.join(ASSETS, `og-${lang}.png`) });
}
await browser.close();
console.log('images written');
