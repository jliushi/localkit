// dev helper: node test/rv-shot.mjs <lang> <sample> <tpl,tpl|all> [w] [h]  -> test/out/rv-<lang>-<tpl>.png (sheet only)
import puppeteer from 'puppeteer';
const [,, lang='en', sample='se', tpls='all', w='1280', h='900'] = process.argv;
const ALL = 'classic,sidebar,timeline,minimal,banner,compact,table,tech,academic,intl,elegant,bold'.split(',');
const b = await puppeteer.launch();
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h });
p.on('pageerror', e => console.log('PAGEERR', e.message));
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
await p.goto(`http://localhost:8092/localkit/${lang}/resume-builder/`, { waitUntil: 'networkidle0' });
await p.waitForSelector('.rv-sheet');
await new Promise(r=>setTimeout(r,400));
await p.click('[data-start=' + sample + ']');
await new Promise(r=>setTimeout(r,300));
await p.click('.rp-tabs [data-tab=design]');
for (const t of (tpls === 'all' ? ALL : tpls.split(','))) {
  await p.click(`.rp-tpl[data-tpl=${t}]`);
  await new Promise(r=>setTimeout(r,250));
  const host = await p.$('.rv-host');
  await host.screenshot({ path: `test/out/rv-${lang}-${t}.png` });
  console.log(t, await p.$eval('#rv-pages', e => e.textContent));
}
await b.close();
