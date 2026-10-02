// End-to-end checks: drives every tool in headless Chrome and verifies the output files.
//   node build/serve.mjs 8090 &   then   node test/e2e.mjs [--only=compress-video,merge-pdf] [--shots] [--skip-ai]
//   BASE_URL=https://jliushi.github.io/localkit node test/e2e.mjs      (against the live site)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { PDFDocument, PDFName } from 'pdf-lib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'test', 'out');
const FIX = path.join(ROOT, 'test', 'fixtures');
const SAMPLES = path.join(ROOT, 'src', 'assets', 'samples');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:8090/localkit';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const only = args.only ? new Set(String(args.only).split(',')) : null;

const browser = await puppeteer.launch();
const results = [];
let lastPage = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const fixture = (f) => (path.isAbsolute(f) ? f : fs.existsSync(path.join(FIX, f)) ? path.join(FIX, f) : path.join(SAMPLES, f));
const outFile = (name) => path.join(OUT, name);
const probe = (file) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', outFile(file)]).toString());
const pdfPages = async (file) => (await PDFDocument.load(fs.readFileSync(outFile(file)))).getPageCount();

async function open(p, lang = 'en') {
  const page = await browser.newPage();
  lastPage = page;
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource.*(favicon|404)/.test(m.text())) page.errors.push(m.text()); });
  await page.setViewport({ width: 1280, height: 900 });
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT, eventsEnabled: true });
  page.downloads = [];
  client.on('Browser.downloadWillBegin', (e) => page.downloads.push(e.suggestedFilename));
  await page.goto(`${BASE}/${lang}${p}`, { waitUntil: 'networkidle0' });
  return page;
}
const upload = async (page, picker, files) => (await page.$(`${picker} input[type=file]`)).uploadFile(...files.map(fixture));
const text = (page, sel) => page.$eval(sel, (e) => e.innerText.replace(/\s+/g, ' ').trim());
const waitText = (page, sel, re, timeout = 60000) => page.waitForFunction((s, src) => new RegExp(src).test(document.querySelector(s)?.innerText || ''), { timeout, polling: 200 }, sel, re.source);
async function waitDownload(page, n = 1, timeout = 30000) {
  const end = Date.now() + timeout;
  while (page.downloads.length < n && Date.now() < end) await sleep(200);
  assert(page.downloads.length >= n, `expected ${n} downloads, got ${page.downloads.length}`);
  const name = page.downloads[n - 1];
  for (let i = 0; i < 50 && !fs.existsSync(outFile(name)); i++) await sleep(200);
  await sleep(300);
  return name;
}

// Result panels scroll themselves into view (smooth) and the main thread can stall while the first <video>/<canvas>
// initialises, so the target moves after Puppeteer has computed its click point. Wait until the element and the
// scroll position have stopped moving (300 ms) before clicking, otherwise the click lands on the wrong spot.
async function clickSettled(page, sel) {
  await page.waitForSelector(sel);
  await page.evaluate((s) => new Promise((resolve) => {
    let last = '', same = 0;
    const timer = setInterval(() => {
      const r = document.querySelector(s)?.getBoundingClientRect();
      const key = r ? `${Math.round(r.top + scrollY)}|${Math.round(r.left)}|${Math.round(scrollY)}` : '';
      same = key && key === last ? same + 1 : 0;
      last = key;
      if (same >= 6) { clearInterval(timer); resolve(); }
    }, 50);
  }), sel);
  await page.click(sel);
}

async function test(name, fn) {
  if (only && !only.has(name.split(':')[0])) return;
  if (args['skip-ai'] && name.startsWith('ai-')) return;
  const started = Date.now();
  let page;
  lastPage = null;
  try {
    page = await fn();
    if (page?.errors?.length) throw new Error(`console errors: ${page.errors.join(' | ')}`);
    results.push([name, 'PASS', Date.now() - started]);
    if (args.shots && page) await page.screenshot({ path: outFile(`${name.replace(/[^a-z0-9]+/gi, '_')}.png`), fullPage: true });
  } catch (e) {
    results.push([name, `FAIL: ${e.message.split('\n')[0]}`, Date.now() - started]);
    page ||= lastPage;
    if (page) await page.screenshot({ path: outFile(`FAIL_${name.replace(/[^a-z0-9]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  } finally {
    if (page) await page.close().catch(() => {});
    if (lastPage) await lastPage.close().catch(() => {});
  }
}

// ================================================================ video & audio

await test('merge-video:3clips+mixedres+silent', async () => {
  const page = await open('/merge-video/');
  await upload(page, '#mv-pick', ['merge-a-720p.mp4', 'merge-b-portrait.mp4', 'merge-c-silent.mp4']);
  await page.waitForFunction(() => [...document.querySelectorAll('#mv-list .meta')].length === 3
    && [...document.querySelectorAll('#mv-list .meta')].every((m) => /\d+:\d+/.test(m.innerText)), { timeout: 30000 });
  // Reorder via the "move down" button on the first clip, then back, to exercise the buttons.
  await page.click('#mv-list li:first-child .pg-tools button:nth-child(2)');
  await page.waitForFunction(() => document.querySelector('#mv-list li:nth-child(1) .name').innerText.includes('portrait'));
  await page.click('#mv-list li:nth-child(2) .pg-tools button:nth-child(1)');
  await page.waitForFunction(() => document.querySelector('#mv-list li:nth-child(1) .name').innerText.includes('720p'));
  const total = await text(page, '#mv-total');
  assert(/3/.test(total), `total: ${total}`);
  await page.click('#mv-go');
  await page.waitForSelector('#mv-result .result', { timeout: 180000 });
  await clickSettled(page, '#mv-result .btn.lg');
  const name = await waitDownload(page);
  const info = probe(name);
  const v = info.streams.filter((s) => s.codec_type === 'video');
  const a = info.streams.filter((s) => s.codec_type === 'audio');
  assert(v.length === 1 && a.length === 1, `streams: ${info.streams.map((s) => s.codec_type).join(',')}`);
  assert(v[0].codec_name === 'h264' && v[0].width === 1280 && v[0].height === 720, `${v[0].codec_name} ${v[0].width}x${v[0].height}`);
  const d = Number(info.format.duration);
  assert(Math.abs(d - 7.5) <= 0.5, `duration ${d}`);
  // Audio must actually cover the whole timeline (the silent clip contributes silence): the last
  // audio packet should end near the total duration, not stop at 5.5s (the clips that have sound).
  const lastAudio = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_entries', 'packet=pts_time,duration_time', '-select_streams', 'a', outFile(name)]).toString());
  const packets = lastAudio.packets || [];
  assert(packets.length > 5, `audio packets: ${packets.length}`);
  const end = Number(packets[packets.length - 1].pts_time) + Number(packets[packets.length - 1].duration_time || 0.02);
  assert(end > d - 0.5, `audio ends at ${end} but duration is ${d}`);
  return page;
});

await test('merge-video:720p-preset-portrait-first', async () => {
  const page = await open('/merge-video/');
  await upload(page, '#mv-pick', ['merge-b-portrait.mp4', 'merge-c-silent.mp4']);
  await page.waitForFunction(() => [...document.querySelectorAll('#mv-list .meta')].length === 2
    && [...document.querySelectorAll('#mv-list .meta')].every((m) => /\d+:\d+/.test(m.innerText)), { timeout: 30000 });
  await page.select('#mv-size', '1280x720');
  await page.click('#mv-go');
  await page.waitForSelector('#mv-result .result', { timeout: 180000 });
  await clickSettled(page, '#mv-result .btn.lg');
  const info = probe(await waitDownload(page));
  const v = info.streams.find((s) => s.codec_type === 'video');
  assert(v.width === 1280 && v.height === 720, `${v.width}x${v.height}`);
  assert(info.streams.some((s) => s.codec_type === 'audio'), 'no audio stream');
  return page;
});

await test('compress-video:target', async () => {
  const page = await open('/compress-video/');
  await upload(page, '#cv-pick', ['phone-1080p.mp4']);
  await page.waitForSelector('#cv-targets .chip');
  const chips = await page.$$eval('#cv-targets .chip', (cs) => cs.map((c) => c.innerText));
  const idx = chips.findIndex((c) => /^10 MB/.test(c));
  assert(idx > 0, `10 MB preset missing: ${chips}`);
  await page.click(`#cv-targets .chip:nth-child(${idx + 1}) span`);
  await page.click('#cv-go');
  await page.waitForSelector('#cv-result .compare', { timeout: 180000 });
  await clickSettled(page, '#cv-result .btn.lg');
  const name = await waitDownload(page);
  const size = fs.statSync(outFile(name)).size;
  assert(size <= 10 * 1024 * 1024 && size > 4 * 1024 * 1024, `size ${size}`);
  const v = probe(name).streams.find((s) => s.codec_type === 'video');
  assert(v.codec_name === 'h264', v.codec_name);
  return page;
});

await test('trim-video:handles', async () => {
  const page = await open('/trim-video/');
  await upload(page, '#tv-pick', ['clip-en.mp4']);
  await page.waitForFunction(() => document.querySelectorAll('.tl-strip canvas').length > 3, { timeout: 30000 });
  await page.$eval('.tl', (e) => e.scrollIntoView({ block: 'center' }));
  const tr = await (await page.$('.tl-track')).boundingBox();
  for (const [sel, frac] of [['.tl-h.s', 0.25], ['.tl-h.e', 0.6]]) {
    const h = await (await page.$(sel)).boundingBox();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(tr.x + tr.width * frac, h.y + 10, { steps: 6 });
    await page.mouse.up();
  }
  await page.click('#tv-go');
  await page.waitForSelector('#tv-result .result', { timeout: 60000 });
  await clickSettled(page, '#tv-result .btn.lg');
  const name = await waitDownload(page);
  const d = Number(probe(name).format.duration);
  assert(d > 3.8 && d < 6, `duration ${d}`);
  return page;
});

await test('video-to-mp3:auto+m4a+range', async () => {
  const page = await open('/video-to-mp3/', 'zh');
  await upload(page, '#va-pick', ['phone-1080p.mp4']);
  await page.waitForSelector('#va-result .result', { timeout: 60000 });
  await clickSettled(page, '#va-result .btn.lg');
  const n1 = await waitDownload(page, 1);
  assert(probe(n1).streams[0].codec_name === 'mp3', 'mp3');
  await page.click('input[name="va-fmt"][value="m4a"] + span');
  await waitText(page, '#va-result', /M4A/);
  await clickSettled(page, '#va-result .btn.lg');
  const n2 = await waitDownload(page, 2);
  assert(probe(n2).streams[0].codec_name === 'aac', 'aac');
  await page.click('input[name="va-fmt"][value="mp3"] + span');
  await page.click('#va-part');
  await page.waitForSelector('.tl-track');
  await page.$eval('.tl-time input', (i) => { i.value = '00:20'; i.dispatchEvent(new Event('change')); });
  await waitText(page, '#va-result', /0:10/);
  return page;
});

await test('convert-video:remux+reencode', async () => {
  const page = await open('/convert-video/');
  await upload(page, '#cx-pick', ['clip.mkv']);
  await waitText(page, '#cx-mode', /Instant/);
  await page.click('#cx-go');
  await page.waitForSelector('#cx-result .result', { timeout: 60000 });
  await clickSettled(page, '#cx-result .btn.lg');
  const n1 = await waitDownload(page, 1);
  assert(probe(n1).format.format_name.includes('mp4'), 'mp4 container');
  await upload(page, '#cx-pick', ['clip-zh.mp4']);
  // Wait for state unique to the new file (its card, Convert enabled), not the stale mode text of the previous file.
  await page.waitForFunction(() => /clip-zh.mp4/.test(document.querySelector('#cx-file')?.innerText || '') && !document.querySelector('#cx-go').disabled && /re-encoding/.test(document.querySelector('#cx-mode')?.innerText || '') && !/Instant/.test(document.querySelector('#cx-mode')?.innerText || ''), { timeout: 60000, polling: 200 });
  await page.click('#cx-go');
  await waitText(page, '#cx-result', /WEBM/, 120000);
  await clickSettled(page, '#cx-result .btn.lg');
  const n2 = await waitDownload(page, 2);
  assert(probe(n2).streams.find((s) => s.codec_type === 'video').codec_name === 'vp9', 'vp9');
  return page;
});

await test('convert-video:legacy-avi', async () => {
  const page = await open('/convert-video/');
  await upload(page, '#cx-pick', ['clip.avi']);
  await page.waitForFunction(() => /clip.avi/.test(document.querySelector('#cx-file')?.innerText || '') && !document.querySelector('#cx-go').disabled, { timeout: 60000, polling: 200 });
  await page.click('#cx-go');
  await page.waitForSelector('#cx-result .result', { timeout: 180000 });
  await clickSettled(page, '#cx-result .btn.lg');
  const n = await waitDownload(page);
  assert(probe(n).streams.find((s) => s.codec_type === 'video').codec_name === 'h264', 'h264 from avi');
  return page;
});

await test('video-to-gif:make', async () => {
  const page = await open('/video-to-gif/');
  await page.click('#vg-pick .sample');
  await page.waitForSelector('.tl-track', { timeout: 30000 });
  await page.click('#vg-go');
  await page.waitForSelector('#vg-result .result', { timeout: 120000 });
  await clickSettled(page, '#vg-result .btn.lg');
  const n = await waitDownload(page);
  const s = probe(n).streams[0];
  assert(s.codec_name === 'gif' && s.width === 480, `${s.codec_name} ${s.width}`);
  return page;
});

await test('ai-subtitle-generator:en+burn', async () => {
  const page = await open('/ai-subtitle-generator/');
  await page.click('#as-pick .sample');
  await page.waitForSelector('#as-file .thumb canvas', { timeout: 30000 });
  await page.click('input[name="as-model"][value="onnx-community/whisper-tiny"] + span');
  await page.select('#as-engine', 'wasm');
  await page.click('#as-go');
  await page.waitForSelector('#as-editor:not([hidden])', { timeout: 600000 });
  const all = await page.$$eval('.sub-row textarea', (t) => t.map((x) => x.value).join(' '));
  assert(/welcome/i.test(all) && /browser/i.test(all), `transcript: ${all}`);
  await page.click('#as-srt');
  const srt = fs.readFileSync(outFile(await waitDownload(page, 1)), 'utf8');
  assert(/^1\n00:00:\d\d,\d{3} --> 00:00:\d\d,\d{3}\n/.test(srt), 'srt format');
  await page.click('#as-burn');
  await page.waitForSelector('#as-burned .result', { timeout: 300000 });
  await page.click('#as-burned .btn.lg');
  const vid = await waitDownload(page, 2);
  assert(probe(vid).streams.some((s) => s.codec_type === 'audio'), 'audio kept');
  return page;
});

await test('ai-subtitle-generator:zh-autodetect', async () => {
  const page = await open('/ai-subtitle-generator/');
  await upload(page, '#as-pick', ['clip-zh.mp4']);
  await page.waitForSelector('#as-file .thumb canvas', { timeout: 30000 });
  await page.select('#as-engine', 'wasm');
  await page.click('#as-go');
  await page.waitForSelector('#as-editor:not([hidden])', { timeout: 600000 });
  const all = await page.$$eval('.sub-row textarea', (t) => t.map((x) => x.value).join(''));
  assert(/欢迎/.test(all) && !/[這歡來們]/.test(all), `transcript: ${all}`);
  return page;
});

await test('ai-subtitle-generator:import-srt', async () => {
  const page = await open('/ai-subtitle-generator/', 'zh');
  await page.click('#as-pick .sample');
  await page.waitForSelector('#as-file .thumb canvas', { timeout: 30000 });
  fs.writeFileSync(outFile('in.srt'), '1\n00:00:01,000 --> 00:00:03,000\n你好，世界\n\n2\n00:00:04,000 --> 00:00:06,500\nSecond line\n');
  await (await page.$('#as-srtfile')).uploadFile(outFile('in.srt'));
  await page.waitForSelector('#as-editor:not([hidden])');
  assert((await page.$$('.sub-row')).length === 2, 'two rows');
  return page;
});

// ================================================================ PDF

// Fixtures for the page-level merge tests: every page carries its label as text and a unique width.
async function labelledPdf(file, label, n) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont('Helvetica');
  for (let i = 1; i <= n; i++) {
    const pg = doc.addPage([300 + i * 10 + (label === 'B' ? 100 : 0), 400]);
    pg.drawText(`${label}${i}`, { x: 40, y: 200, size: 40, font });
  }
  fs.writeFileSync(path.join(FIX, file), await doc.save());
}
if (!only || only.has('merge-pdf')) {
  await labelledPdf('lbl-a.pdf', 'A', 3);
  await labelledPdf('lbl-b.pdf', 'B', 3);
  fs.writeFileSync(path.join(FIX, 'broken.pdf'), 'this is definitely not a pdf file');
}
let pdfjsNode;
async function pageTexts(file) {
  pdfjsNode ||= await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsNode.getDocument({ data: new Uint8Array(fs.readFileSync(outFile(file))), isEvalSupported: false }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) out.push((await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join(' ').trim());
  return out;
}
const pmUpload = async (page, files) => { await upload(page, '#pm-pick', files); await page.waitForFunction((n) => document.querySelectorAll('#pm-list li').length === n && !document.querySelector('#pm-list .spinner'), { timeout: 30000 }, files.length); };
const pmSetName = (page, n) => page.$eval('#pm-name', (e, v) => { e.value = v; }, n);
const pmRange = (page, i, v) => page.$eval(`#pm-list li:nth-child(${i}) .pm-range input`, (e, val) => { e.value = val; e.dispatchEvent(new Event('change')); }, v);
const pmMerge = async (page, name) => { const n = page.downloads.length + 1; await pmSetName(page, name); await page.click('#pm-go'); await page.waitForSelector('#pm-result .result', { timeout: 60000 }); return waitDownload(page, n); };
// Synthetic HTML5 drag & drop of page card `from` onto page card `to` (before = left half).
const pmDrag = (page, from, to, before = true) => page.evaluate((f, t, bf) => {
  const cards = document.querySelectorAll('#pm-pages .pg');
  const src = cards[f], dst = cards[t];
  const dt = new DataTransfer();
  const r = dst.getBoundingClientRect();
  const x = bf ? r.left + 4 : r.right - 4, y = r.top + r.height / 2;
  src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  dst.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
  dst.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
  src.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
}, from, to, before);

await test('merge-pdf:merge', async () => {
  const page = await open('/merge-pdf/');
  await upload(page, '#pm-pick', ['a.pdf', 'b.pdf', 'sample.pdf']);
  await page.waitForFunction(() => document.querySelectorAll('#pm-list canvas').length === 3, { timeout: 30000 });
  await page.click('#pm-list li:nth-child(2) button[title="Move up"]');
  assert((await text(page, '#pm-list li:first-child .name')) === 'b.pdf', 'reorder');
  await page.click('#pm-go');
  await page.waitForSelector('#pm-result .result');
  assert(await pdfPages(await waitDownload(page)) === 9, 'page count');
  await page.waitForFunction(() => document.querySelectorAll('#pm-result .pm-prev canvas').length > 0, { timeout: 15000 });
  return page;
});

await test('merge-pdf:ranges+page-drag+rotate+delete', async () => {
  const page = await open('/merge-pdf/');
  await pmUpload(page, ['lbl-a.pdf', 'lbl-b.pdf']);
  await pmRange(page, 1, '1-2');
  await pmRange(page, 2, '3');
  await page.click('#pm-tab-pages');
  await page.waitForFunction(() => document.querySelectorAll('#pm-pages .pg').length === 3);
  await pmDrag(page, 2, 0, true); // B3 to the front, across files
  await page.waitForFunction(() => document.querySelector('#pm-pages .pg:first-child .pm-src').innerText === 'lbl-b.pdf');
  await page.click('#pm-pages .pg:nth-child(2) button[title="Rotate right"]'); // A1
  await page.click('#pm-pages .pg:nth-child(3) button[title="Delete page"]'); // A2
  await page.click('#pm-pages .pg:nth-child(1) button[title="Insert a blank page after this one"]');
  const name = await pmMerge(page, 'ranges');
  assert((await pdfPages(name)) === 3, 'three pages');
  const texts = await pageTexts(name);
  assert(texts[0] === 'B3' && texts[1] === '' && texts[2] === 'A1', `order ${texts}`);
  const doc = await PDFDocument.load(fs.readFileSync(outFile(name)));
  assert(doc.getPage(2).getRotation().angle === 90, 'A1 rotated');
  assert(Math.round(doc.getPage(0).getWidth()) === 430, `B3 width ${doc.getPage(0).getWidth()}`);
  await page.click('#pm-undo');
  return page;
});

await test('merge-pdf:interleave-reverse', async () => {
  const page = await open('/merge-pdf/');
  await pmUpload(page, ['lbl-a.pdf', 'lbl-b.pdf']);
  await page.click('input[name="pm-mode"][value="inter"] + span');
  await page.click('#pm-irev');
  await page.click('#pm-arrange');
  const name = await pmMerge(page, 'inter');
  const texts = await pageTexts(name);
  assert(texts.join(',') === 'A1,B3,A2,B2,A3,B1', `interleave ${texts}`);
  return page;
});

await test('merge-pdf:alternate+odd-even-ranges', async () => {
  const page = await open('/merge-pdf/', 'zh');
  await pmUpload(page, ['lbl-a.pdf', 'lbl-b.pdf']);
  await pmRange(page, 1, 'odd');
  await pmRange(page, 2, '偶数');
  await page.click('input[name="pm-mode"][value="alt"] + span');
  await page.click('#pm-arrange');
  const texts = await pageTexts(await pmMerge(page, 'alt'));
  assert(texts.join(',') === 'A1,B2,A3', `alt ${texts}`);
  return page;
});

await test('merge-pdf:image+blank+normalise+numbers+bookmarks', async () => {
  const page = await open('/merge-pdf/');
  await pmUpload(page, ['lbl-a.pdf', 'sample.jpg', 'lbl-b.pdf']);
  await pmRange(page, 1, '1');
  await pmRange(page, 3, '2-3');
  await page.click('#pm-tab-pages');
  await page.click('#pm-pages .pg:nth-child(2)');
  await page.click('#pm-blank');
  await page.click('input[name="pm-size"][value="letter"] + span');
  await page.click('#pm-bm');
  await page.click('#pm-num');
  await page.click('input[name="pm-nfmt"][value="of"] + span');
  const name = await pmMerge(page, 'full');
  const bytes = fs.readFileSync(outFile(name));
  const doc = await PDFDocument.load(bytes);
  assert(doc.getPageCount() === 5, `pages ${doc.getPageCount()}`);
  const texts = await pageTexts(name);
  assert(texts[0].startsWith('A1') && texts[0].includes('1 / 5') && texts[4].includes('5 / 5') && texts[3].startsWith('B2'), `texts ${JSON.stringify(texts)}`);
  assert(texts[2].includes('3 / 5'), 'blank page numbered');
  assert(Math.round(doc.getPage(1).getHeight()) === 792 || Math.round(doc.getPage(1).getWidth()) === 792, 'image page is A4/Letter-sized');
  assert(doc.getPage(1).node.Resources().get(PDFName.of('XObject')), 'image on page 2');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pj = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
  const outline = await pj.getOutline();
  assert(outline && outline.map((o) => o.title).join(',') === 'lbl-a,sample,lbl-b', `outline ${JSON.stringify(outline?.map((o) => o.title))}`);
  return page;
});

await test('merge-pdf:damaged-file-and-phone', async () => {
  const page = await open('/merge-pdf/');
  await page.setViewport({ width: 390, height: 800 });
  await upload(page, '#pm-pick', ['broken.pdf', 'lbl-a.pdf']);
  await page.waitForFunction(() => document.querySelectorAll('#pm-list li').length === 2 && !document.querySelector('#pm-list .spinner'), { timeout: 30000 });
  assert(await page.$('#pm-list li.err'), 'broken file flagged');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 1, `horizontal overflow ${overflow}`);
  const name = await pmMerge(page, 'broken');
  assert((await pdfPages(name)) === 3, 'only the readable file merged');
  return page;
});

await test('split-pdf:select+every', async () => {
  const page = await open('/split-pdf/');
  await upload(page, '#ps-pick', ['long.pdf']);
  await page.waitForSelector('#ps-pages .pg canvas', { timeout: 30000 });
  await page.click('#ps-pages .pg[data-n="2"]');
  await page.keyboard.down('Shift'); await page.click('#ps-pages .pg[data-n="5"]'); await page.keyboard.up('Shift');
  await waitText(page, '#ps-info', /4 of 7/);
  await page.click('#ps-go');
  await page.waitForSelector('#ps-result .result');
  assert(await pdfPages(await waitDownload(page, 1)) === 4, 'selected pages');
  await page.click('input[name="ps-mode"][value="every"] + span');
  await page.$eval('#ps-every', (e) => { e.value = '3'; e.dispatchEvent(new Event('input')); });
  await waitText(page, '#ps-info', /3 file/);
  await page.click('#ps-go');
  assert((await waitDownload(page, 2)).endsWith('.zip'), 'zip');
  return page;
});

await test('organize-pdf:rotate-delete', async () => {
  const page = await open('/organize-pdf/', 'zh');
  await upload(page, '#po-pick', ['sample.pdf']);
  await page.waitForFunction(() => document.querySelectorAll('#po-pages canvas').length === 4, { timeout: 30000 });
  await page.click('#po-pages .pg[data-i="0"] button[title="向右旋转"]');
  await page.click('#po-pages .pg[data-i="2"] button[title="删除 / 恢复"]');
  await page.click('#po-save');
  await page.waitForSelector('#po-result .result');
  const doc = await PDFDocument.load(fs.readFileSync(outFile(await waitDownload(page))));
  assert(doc.getPageCount() === 3 && doc.getPage(0).getRotation().angle === 90, 'pages/rotation');
  return page;
});

await test('edit-pdf:text-check-white-sign-undo', async () => {
  const page = await open('/edit-pdf/');
  await upload(page, '#pe-pick', ['sample.pdf']);
  await page.waitForFunction(() => document.querySelectorAll('#pe-pages canvas').length === 4, { timeout: 30000 });
  await page.$eval('.epage[data-i="0"]', (e) => e.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -130));
  const box = await (await page.$('.epage[data-i="0"]')).boundingBox();
  await page.mouse.click(box.x + 150, box.y + 400);
  await page.keyboard.type('Approved 已批准');
  for (const [tool, x, y] of [['check', 120, 470], ['white', 400, 300]]) {
    await page.$eval(`.tool-toggle input[value="${tool}"]`, (e) => e.click());
    await page.mouse.click(box.x + x, box.y + y);
  }
  await page.$eval('.tool-toggle input[value="sign"]', (e) => e.click());
  await page.click('#pe-sig [data-tab="type"]');
  await page.type('#pe-sigtext', 'Alex Chen');
  await page.click('#pe-sig-use');
  await page.mouse.click(box.x + 420, box.y + 520);
  assert((await page.$$('.ann')).length === 4, 'four items');
  await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control');
  assert((await page.$$('.ann')).length === 3, 'undo');
  await page.$eval('#pe-save', (e) => e.click());
  await page.waitForSelector('#pe-result .result');
  const doc = await PDFDocument.load(fs.readFileSync(outFile(await waitDownload(page))));
  const xo = doc.getPage(0).node.Resources().lookup(PDFName.of('XObject'));
  assert(xo && xo.keys().length === 2, 'text + check images');
  return page;
});

await test('compress-pdf:images', async () => {
  const page = await open('/compress-pdf/');
  await upload(page, '#cp-pick', ['heavy.pdf']);
  await page.waitForSelector('#cp-file .thumb canvas', { timeout: 30000 });
  await page.click('#cp-go');
  await page.waitForSelector('#cp-result .result', { timeout: 120000 });
  await clickSettled(page, '#cp-result .btn.lg');
  const n = await waitDownload(page);
  const size = fs.statSync(outFile(n)).size;
  assert(size < fs.statSync(fixture('heavy.pdf')).size * 0.2, `size ${size}`);
  assert(await pdfPages(n) === 3, 'pages kept');
  return page;
});

await test('pdf-to-jpg:selected', async () => {
  const page = await open('/pdf-to-jpg/');
  await upload(page, '#pj-pick', ['a.pdf']);
  await page.waitForSelector('#pj-pages .pg canvas', { timeout: 30000 });
  await page.click('#pj-none');
  await page.click('#pj-pages .pg[data-n="2"]');
  await page.click('#pj-go');
  await page.waitForSelector('#pj-result .result');
  const n = await waitDownload(page);
  assert(n === 'a-page2.jpg', n);
  const s = probe(n).streams[0];
  assert(s.width === 1240 && s.height === 1754, `${s.width}x${s.height}`);
  return page;
});

await test('jpg-to-pdf:mixed', async () => {
  const page = await open('/jpg-to-pdf/');
  await upload(page, '#ip-pick', ['sample.png', 'photo.jpg', 'photo.heic']);
  await page.waitForFunction(() => document.querySelectorAll('#ip-pages .pg canvas').length === 3, { timeout: 60000 });
  await page.click('#ip-go');
  await page.waitForSelector('#ip-result .result', { timeout: 60000 });
  const doc = await PDFDocument.load(fs.readFileSync(outFile(await waitDownload(page))));
  assert(doc.getPageCount() === 3, 'pages');
  assert(Math.round(doc.getPage(1).getWidth()) === 842, 'landscape photo → landscape A4');
  return page;
});

await test('scan-to-pdf:detect+bw', async () => {
  const page = await open('/scan-to-pdf/');
  await page.click('#sc-pick .sample');
  await page.waitForSelector('#sc-pages .pg canvas', { timeout: 30000 });
  await page.click('input[name="sc-f"][value="bw"] + span');
  await sleep(800);
  await page.click('#sc-go');
  await page.waitForSelector('#sc-result .result', { timeout: 60000 });
  const doc = await PDFDocument.load(fs.readFileSync(outFile(await waitDownload(page))));
  assert(doc.getPageCount() === 1 && Math.round(doc.getPage(0).getWidth()) === 595, 'A4 portrait');
  return page;
});

// ================================================================ images

await test('compress-image:batch+target', async () => {
  const page = await open('/compress-image/');
  await upload(page, '#ci-pick', ['bigphoto.jpg', 'bigshot.png']);
  await page.waitForFunction(() => document.querySelectorAll('#ci-grid .out .actions').length === 2, { timeout: 60000 });
  await page.click('input[name="ci-l"][value="target"] + span');
  await page.$eval('#ci-kb', (e) => { e.value = '100'; e.dispatchEvent(new Event('input')); });
  await sleep(600);
  await page.waitForFunction(() => document.querySelectorAll('#ci-grid .out .actions').length === 2, { timeout: 90000 });
  await page.click('#ci-zip');
  assert((await waitDownload(page)) === 'compressed-images.zip', 'zip');
  const sizes = await page.$$eval('#ci-grid .sizes', (x) => x.map((e) => e.innerText));
  assert(sizes.every((s) => /→ (\d{1,2}|100) KB|→ \d{2,3} B/.test(s)), `sizes ${sizes}`);
  return page;
});

await test('heic-to-jpg:sample', async () => {
  const page = await open('/heic-to-jpg/', 'zh');
  await page.click('#hj-pick .sample');
  await page.waitForSelector('#hj-grid .out .actions', { timeout: 60000 });
  await page.click('#hj-grid .out .btn');
  const n = await waitDownload(page);
  assert(n === 'sample.jpg' && probe(n).streams[0].codec_name === 'mjpeg', n);
  return page;
});

await test('convert-image:ico+webp', async () => {
  const page = await open('/convert-image/');
  await page.click('input[name="cm-f"][value="image/x-icon"] + span');
  await upload(page, '#cm-pick', ['sample.png']);
  await page.waitForSelector('#cm-grid .out .actions', { timeout: 30000 });
  await page.click('#cm-grid .out .btn');
  const buf = fs.readFileSync(outFile(await waitDownload(page, 1)));
  assert(buf.readUInt16LE(2) === 1 && buf.readUInt16LE(4) === 1, 'ico header');
  await page.click('input[name="cm-f"][value="image/webp"] + span');
  await waitText(page, '#cm-grid', /sample\.webp/);
  return page;
});

// ================================================================ documents & text

// ---- resume builder v2
const rvOpen = async (lang, start = 'pm', mobile = false) => {
  const page = await open('/resume-builder/', lang);
  if (mobile) { await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); await page.reload({ waitUntil: 'networkidle0' }); }
  await page.waitForSelector('.rv-host .rv-sheet');
  await sleep(500);
  if (!(await page.$('#rv-starter[open]'))) {
    await page.click('#rv-docs');
    await page.evaluate(() => [...document.querySelectorAll('.rv-menu button')].find((b) => /New|新建/.test(b.textContent)).click());
    await page.waitForSelector('#rv-starter[open]');
  }
  await page.click(`[data-start=${start}]`);
  await sleep(300);
  await page.waitForSelector('.rv-host .rv-sheet .rv-name');
  return page;
};
const rvReplace = async (page, sel, str) => {
  await page.click(sel);
  await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control');
  await page.keyboard.type(str);
};
const rvDoc = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__rv.doc())));
const rvMenu = async (page, openSel, label) => {
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.rv').getBoundingClientRect().top + scrollY - 90));
  await sleep(100);
  await page.click(openSel);
  await page.waitForSelector('.rv-menu');
  const ok = await page.evaluate((l) => { const b = [...document.querySelectorAll('.rv-menu button')].find((x) => x.textContent.includes(l)); if (b) b.click(); return !!b; }, label);
  assert(ok, `menu item ${label}`);
};
const pdfText = async (file) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), useSystemFonts: true, verbosity: 0 }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) out += (await (await doc.getPage(i)).getTextContent()).items.map((t) => t.str).join(' ') + '\n';
  return { pages: doc.numPages, text: out };
};

await test('resume-builder:create+edit-in-place+template', async () => {
  const page = await rvOpen('zh', 'pm');
  assert((await text(page, '.rv-host .rv-sheet .rv-name')) === '林雅婷', 'sample name');
  assert((await page.$$('.rv-host .rv-sheet .rv-mod')).length >= 5, 'modules rendered');
  // edit directly on the sheet
  await rvReplace(page, '.rv-host .rv-sheet .rv-name .f', '张三丰');
  await sleep(500);
  assert((await text(page, '.rv-host .rv-sheet .rv-name')) === '张三丰', 'sheet text');
  assert(await page.$$eval('.rp input[data-ref]', (els) => els.some((e) => e.value === '张三丰')), 'side panel synced from sheet');
  // bold via floating toolbar
  const desc = '.rv-host .rv-sheet .rv-entry .rv-desc li';
  await page.click(desc, { clickCount: 3 });
  await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control');
  await page.waitForSelector('.rv-ftb:not([hidden])');
  await page.click('.rv-ftb [data-cmd=bold]');
  await sleep(300);
  assert((await rvDoc(page)).modules.some((m) => (m.entries || []).some((e) => /<(b|strong)>/.test(e.desc))), 'bold stored');
  // edit in the panel and see it on the sheet
  const sel = await page.$eval('.rp input[data-ref$="|headline"]', (e) => e.dataset.ref);
  await page.$eval(`.rp input[data-ref="${sel}"]`, (e) => { e.focus(); e.select(); });
  await page.keyboard.type('首席产品官');
  await sleep(300);
  assert((await text(page, '.rv-host .rv-sheet .rv-hl')) === '首席产品官', 'panel -> sheet');
  // switch template: content unchanged
  await page.click('.rp-tabs [data-tab=design]');
  for (const t of ['banner', 'table', 'sidebar', 'tech', 'academic']) {
    await page.click(`.rp-tpl[data-tpl=${t}]`);
    await sleep(150);
    assert(await page.$eval('.rv-host .rv-sheet', (e, id) => e.classList.contains(`t-${id}`), t), `template ${t}`);
    assert(/张三丰/.test(await page.$eval('.rv-host .rv-sheet', (e) => e.innerText)), `content kept on ${t}`);
  }
  assert((await page.$$('.rp-tpl')).length >= 10, 'at least 10 templates');
  // persistence
  await sleep(600);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.rv-host .rv-sheet .rv-name');
  assert((await text(page, '.rv-host .rv-sheet .rv-name')) === '张三丰', 'autosave');
  assert(await page.$eval('.rv-host .rv-sheet', (e) => e.classList.contains('t-academic')), 'template persisted');
  return page;
});

await test('resume-builder:modules+undo', async () => {
  const page = await rvOpen('en', 'se');
  const order = async () => (await rvDoc(page)).modules.map((m) => m.type).join();
  const before = await order();
  // move the 3rd module down via the on-page toolbar
  await page.evaluate(() => { const mods = [...document.querySelectorAll('.rv-host .rv-sheet .rv-mod')]; mods[1].querySelector('[data-act=mdown]').click(); });
  await sleep(200);
  assert((await order()) !== before, 'module moved');
  await page.click('#rv-undo');
  await sleep(200);
  assert((await order()) === before, 'undo restores order');
  await page.click('#rv-redo');
  await sleep(200);
  assert((await order()) !== before, 'redo');
  // drag a module in the panel (pointer events)
  const g = await page.$$('.rp-mod .rp-grip:not(.off)');
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.rv').getBoundingClientRect().top + scrollY - 20));
  await sleep(150);
  const a = await g[1].boundingBox(), b = await g[3].boundingBox();
  const o1 = await order();
  await page.mouse.move(a.x + 5, a.y + 5); await page.mouse.down(); await page.mouse.move(a.x + 5, b.y + 60, { steps: 8 }); await page.mouse.up();
  await sleep(300);
  assert((await order()) !== o1, 'panel drag reorders');
  // hide, rename, add custom module
  await page.click('.rp-mod:nth-child(3) .rp-ib[title="Hide"]');
  await sleep(200);
  assert((await rvDoc(page)).modules.filter((m) => m.hidden).length === 1, 'hidden');
  await page.click('.rp-addb:last-child');
  await sleep(200);
  const d = await rvDoc(page);
  assert(d.modules[d.modules.length - 1].type === 'custom', 'custom module added');
  await page.$eval('.rp-mod:last-of-type .rp-title', (e) => { e.focus(); e.select(); });
  await page.keyboard.type('Publications');
  await sleep(300);
  assert(/publications/i.test(await page.$eval('.rv-host .rv-sheet', (e) => e.innerText)), 'renamed module on sheet');
  // multiple resumes
  const n0 = await page.evaluate(() => window.__rv.store.docs.length);
  await rvMenu(page, '#rv-docs', 'Duplicate');
  await sleep(300);
  assert((await page.evaluate(() => window.__rv.store.docs.length)) === n0 + 1, 'duplicate resume');
  return page;
});

await test('resume-builder:fit+phrases+check', async () => {
  const page = await rvOpen('en', 'se');
  await page.click('.rp-tabs [data-tab=design]');
  await page.evaluate(() => { for (const [i, v] of [['fs', 16], ['lh', 2]]) { const el = [...document.querySelectorAll('.rp-sl')].find((s) => s.querySelector('input').min === (i === 'fs' ? '12' : '1.2')).querySelector('input'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } });
  await sleep(400);
  const n0 = Number(await page.$eval('#rv-pages', (e) => e.dataset.n));
  assert(n0 >= 2, `bold overflows (${n0})`);
  await page.click('#rv-fit');
  await sleep(500);
  assert(Number(await page.$eval('#rv-pages', (e) => e.dataset.n)) === 1, 'fit to one page');
  assert((await rvDoc(page)).style.fit === true, 'fit flag');
  // writing help inserts into the document
  await page.click('.rp-tabs [data-tab=assist]');
  const before = JSON.stringify((await rvDoc(page)).modules);
  await page.click('.rp-chip:not(.small)');
  await sleep(300);
  assert(JSON.stringify((await rvDoc(page)).modules) !== before, 'phrase inserted');
  assert((await page.$$('.rp-checks li')).length >= 3, 'checklist');
  assert(/placeholder/.test(await text(page, '.rp-checks')), 'check flags leftover brackets');
  return page;
});

await test('resume-builder:export', async () => {
  const page = await rvOpen('en', 'pm');
  // PNG
  await rvMenu(page, '#rv-export', 'PNG');
  const png = await waitDownload(page, 1);
  const buf = fs.readFileSync(outFile(png));
  assert(buf.slice(1, 4).toString() === 'PNG', 'png signature');
  assert(buf.readUInt32BE(16) === 1588 && buf.readUInt32BE(20) === 2244, `png size ${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`);
  // image PDF
  await rvMenu(page, '#rv-export', 'image pages');
  const pdf = await waitDownload(page, 2);
  const lib = await PDFDocument.load(fs.readFileSync(outFile(pdf)));
  const pn = Number(await page.$eval('#rv-pages', (e) => e.dataset.n));
  assert(lib.getPageCount() === pn, `image pdf pages ${lib.getPageCount()} vs ${pn}`);
  const { width, height } = lib.getPage(0).getSize();
  assert(Math.abs(width - 595.28) < 1 && Math.abs(height - 841.89) < 1, 'A4 size');
  // text PDF through the print path
  await rvMenu(page, '#rv-export', 'selectable text');
  await page.waitForSelector('#rv-print-go');
  await page.click('#rv-print-go');
  await page.waitForSelector('#rv-print .rv-page', { timeout: 5000 });
  const printed = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  fs.writeFileSync(outFile('resume-print.pdf'), printed);
  const info = await pdfText(outFile('resume-print.pdf'));
  assert(info.pages === pn, `print pdf pages ${info.pages} vs ${pn}`);
  assert(info.text.includes('Priya Raman') && /Lumen Analytics/.test(info.text), 'selectable text in pdf');
  return page;
});

await test('resume-builder:import-export-json', async () => {
  const page = await rvOpen('en', 'design');
  await rvMenu(page, '#rv-docs', 'Export data');
  const json = await waitDownload(page, 1);
  const data = JSON.parse(fs.readFileSync(outFile(json), 'utf8'));
  assert(data.v === 2 && data.modules.length > 4, 'json export');
  const c0 = await page.evaluate(() => window.__rv.store.docs.length);
  await rvMenu(page, '#rv-docs', 'Import data');
  const input = await page.$('input[type=file][accept*=json]');
  await input.uploadFile(outFile(json));
  await sleep(500);
  assert((await page.evaluate(() => window.__rv.store.docs.length)) === c0 + 1, 'imported as new resume');
  return page;
});

await test('resume-builder:phone-390', async () => {
  const page = await rvOpen('zh', 'grad', true);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(sw <= 392, `no horizontal scroll (${sw})`);
  await page.click('.rv-mseg [data-v=edit]');
  await sleep(200);
  assert(await page.$eval('.rv-panel', (e) => e.offsetParent !== null), 'panel visible on phone');
  await page.$eval('.rp input[data-ref$="|name"]', (e) => { e.focus(); e.select(); });
  await page.keyboard.type('王小明');
  await page.click('.rv-mseg [data-v=sheet]');
  await sleep(300);
  assert((await text(page, '.rv-host .rv-sheet .rv-name')) === '王小明', 'panel edit on phone');
  return page;
});


await test('compare-text:live', async () => {
  const page = await open('/compare-text/');
  await page.type('#dt-a', 'line one\nline two\nsame\n第三行文字');
  await page.type('#dt-b', 'line one\nline 2\nsame\n第三行文本\nnew line');
  await waitText(page, '#dt-stats', /3 added · 2 removed/);
  const marks = await page.$$eval('#dt-out mark', (ms) => ms.map((m) => m.textContent));
  assert(marks.includes('two') && marks.includes('字'), `marks ${marks}`);
  await page.click('input[name="dt-view"][value="inline"] + span');
  assert((await page.$$('#dt-out td.add')).length === 3, 'inline adds');
  return page;
});

await test('base64:live+file', async () => {
  const page = await open('/base64/');
  await page.type('#b6-text', 'Hello 你好 👋');
  assert(await page.$eval('#b6-b64', (e) => e.value) === 'SGVsbG8g5L2g5aW9IPCfkYs=', 'encode');
  await page.$eval('#b6-b64', (e) => { e.value = 'TG9jYWxLaXQ='; e.dispatchEvent(new Event('input')); });
  assert(await page.$eval('#b6-text', (e) => e.value) === 'LocalKit', 'decode');
  const png = fs.readFileSync(fixture('sample.png')).toString('base64');
  await page.$eval('#b6-b64', (e, v) => { e.value = `data:image/png;base64,${v}`; e.dispatchEvent(new Event('input')); }, png);
  await page.waitForSelector('#b6-bin img');
  await page.click('#b6-bin .btn');
  assert((await waitDownload(page)) === 'decoded.png', 'download');
  return page;
});

await browser.close();
let failed = 0;
for (const [name, res, ms] of results) {
  if (res !== 'PASS') failed++;
  console.log(`${res === 'PASS' ? '✓' : '✗'} ${name.padEnd(42)} ${res === 'PASS' ? '' : res} ${(ms / 1000).toFixed(1)}s`);
}
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
