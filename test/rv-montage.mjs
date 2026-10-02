import puppeteer from 'puppeteer';
import fs from 'node:fs';
const [,, lang='en', names='classic,sidebar,timeline,minimal', out='test/out/m1.png'] = process.argv;
const imgs = names.split(',').map(n => 'data:image/png;base64,' + fs.readFileSync(`test/out/rv-${lang}-${n}.png`).toString('base64'));
const b = await puppeteer.launch(); const p = await b.newPage();
await p.setViewport({ width: 1700, height: 1200 });
await p.setContent(`<body style="margin:0;background:#888;display:flex;gap:10px;padding:10px">${imgs.map(s=>`<img src="${s}" style="width:${Math.floor(1680/imgs.length)}px;height:auto;align-self:flex-start">`).join('')}</body>`);
await p.screenshot({ path: out, fullPage: true }); await b.close();
