// End-to-end checks: drives every tool in headless Chrome and verifies the output files.
//   node build/serve.mjs 8090 &   then   node test/e2e.mjs [--only=compress-video,merge-pdf] [--shots] [--skip-ai]
//   BASE_URL=https://jliushi.github.io/localkit node test/e2e.mjs      (against the live site)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { PDFDocument, PDFName } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

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

async function open(p, lang = 'en', width = 1280) {
  const page = await browser.newPage();
  lastPage = page;
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource.*(favicon|404)/.test(m.text())) page.errors.push(m.text()); });
  await page.setViewport({ width, height: 900 });
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
  await page.click('#mv-result .btn.lg');
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
  await page.click('#mv-result .btn.lg');
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
  await page.click('#cv-result .btn.lg');
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
  await page.click('#tv-result .btn.lg');
  const name = await waitDownload(page);
  const d = Number(probe(name).format.duration);
  assert(d > 3.8 && d < 6, `duration ${d}`);
  return page;
});

await test('video-to-mp3:auto+m4a+range', async () => {
  const page = await open('/video-to-mp3/', 'zh');
  await upload(page, '#va-pick', ['phone-1080p.mp4']);
  await page.waitForSelector('#va-result .result', { timeout: 60000 });
  await page.click('#va-result .btn.lg');
  const n1 = await waitDownload(page, 1);
  assert(probe(n1).streams[0].codec_name === 'mp3', 'mp3');
  await page.click('input[name="va-fmt"][value="m4a"] + span');
  await waitText(page, '#va-result', /M4A/);
  await page.click('#va-result .btn.lg');
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
  await page.click('#cx-result .btn.lg');
  const n1 = await waitDownload(page, 1);
  assert(probe(n1).format.format_name.includes('mp4'), 'mp4 container');
  await upload(page, '#cx-pick', ['clip-zh.mp4']);
  await waitText(page, '#cx-mode', /re-encoding/);
  await page.click('#cx-go');
  await waitText(page, '#cx-result', /WEBM/, 120000);
  await page.click('#cx-result .btn.lg');
  const n2 = await waitDownload(page, 2);
  assert(probe(n2).streams.find((s) => s.codec_type === 'video').codec_name === 'vp9', 'vp9');
  return page;
});

await test('convert-video:legacy-avi', async () => {
  const page = await open('/convert-video/');
  await upload(page, '#cx-pick', ['clip.avi']);
  await page.waitForSelector('#cx-file .meta small');
  await page.click('#cx-go');
  await page.waitForSelector('#cx-result .result', { timeout: 180000 });
  await page.click('#cx-result .btn.lg');
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
  await page.click('#vg-result .btn.lg');
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

await test('merge-pdf:merge', async () => {
  const page = await open('/merge-pdf/');
  await upload(page, '#pm-pick', ['a.pdf', 'b.pdf', 'sample.pdf']);
  await page.waitForFunction(() => document.querySelectorAll('#pm-list canvas').length === 3, { timeout: 30000 });
  await page.click('#pm-list li:nth-child(2) button[title="Move up"]');
  assert((await text(page, '#pm-list li:first-child .name')) === 'b.pdf', 'reorder');
  await page.click('#pm-go');
  await page.waitForSelector('#pm-result .result');
  assert(await pdfPages(await waitDownload(page)) === 9, 'page count');
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

// ---- PDF editor helpers
async function pdfTexts(file) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(outFile(file))), standardFontDataUrl: `${ROOT.split(path.sep).join('/')}/node_modules/pdfjs-dist/standard_fonts/`, verbosity: 0 }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) out.push((await (await doc.getPage(i)).getTextContent()).items.map((it) => it.str).join(''));
  return out;
}
async function peLoad(page, file) {
  await upload(page, '#pe-pick', [file]);
  await page.waitForFunction(() => document.querySelectorAll('#pe-pages canvas').length >= 1, { timeout: 30000 });
  await sleep(600);
}
/** Scrolls page `i` below the sticky toolbar and returns a mapper from page points (y from the top) to viewport pixels. */
async function peView(page, i = 0, width = 595) {
  const top = await page.$eval('#pe-tools', (e) => { const t = e.closest('.pe-top'); return parseFloat(getComputedStyle(t).top) + t.offsetHeight; });
  await page.evaluate((k, t) => { const e = document.querySelectorAll('.epage')[k]; window.scrollBy(0, e.getBoundingClientRect().top - t - 20); }, i, top);
  await sleep(400);
  const v = { s: 1, b: null, async sync() { v.b = await (await page.$$('.epage'))[i].boundingBox(); v.s = v.b.width / width; }, at: (x, y) => [v.b.x + x * v.s, v.b.y + y * v.s] };
  await v.sync();
  curView = v;
  return v;
}
let curView = null;
async function peTool(page, t) { await page.click(`#pe-tools [data-tool="${t}"]`); await sleep(100); await curView?.sync(); }
async function peDrag(page, [x1, y1], [x2, y2], steps = 8) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps });
  await page.mouse.up();
  await sleep(150);
}
const peClick = async (page, v, x, y) => { await v.sync(); await page.mouse.click(...v.at(x, y)); await sleep(250); };
const peSelectAll = async (page) => { await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); };
const peSave = async (page, n = 1) => { await page.click('#pe-save'); await waitText(page, '#pe-result', /Saved|已保存/, 60000); return waitDownload(page, n); };

await test('edit-pdf:edit-existing-text-en-zh', async () => {
  const page = await open('/edit-pdf/');
  await peLoad(page, 'edit-text.pdf');
  const v = await peView(page);
  // hovering a line highlights it
  await page.mouse.move(...v.at(100, 78));
  await sleep(300);
  assert(await page.$('.hoverbox'), 'hover box');
  // English: replace the heading, change the colour sample check
  await peClick(page, v, 100, 78);
  assert(await page.$eval('#pe-font', (e) => e.value) === 'sans' && Number(await page.$eval('#pe-size', (e) => e.value)) === 22, 'font + size taken from the original');
  await peSelectAll(page);
  await page.keyboard.type('Receipt Number 99');
  // a second English line: edit only one word at the end
  await peClick(page, v, 100, 152);
  await page.keyboard.press('End');
  for (let i = 0; i < 11; i++) await page.keyboard.press('Backspace');
  await page.keyboard.type('Beta GmbH');
  // Chinese line
  await peClick(page, v, 100, 202);
  await peSelectAll(page);
  await page.keyboard.type('合同金额：乙方收款');
  await page.mouse.click(...v.at(400, 330));
  await sleep(200);
  assert((await page.evaluate(() => window.__pe.anns.length)) === 3, 'three edits');
  const f = await peSave(page);
  const [txt] = await pdfTexts(f);
  assert(txt.includes('Receipt Number 99') && txt.includes('Customer: Acme Beta GmbH') && txt.includes('合同金额：乙方收款'), `new text present: ${txt}`);
  assert(!txt.includes('Invoice') && !txt.includes('Trading') && !txt.includes('合同编号') && !txt.includes('甲方付款'), `old text removed from the file: ${txt}`);
  assert(txt.includes('Payment due within thirty days of receipt.'), 'other lines untouched');
  // a CJK font subset must have been embedded as real text
  const doc = await PDFDocument.load(fs.readFileSync(outFile(f)));
  assert(/NotoSansSC/.test(Buffer.from(await doc.save({ useObjectStreams: false })).toString('latin1')), 'Noto Sans SC subset embedded');
  assert(fs.statSync(outFile(f)).size < 200000, `output stays small (${fs.statSync(outFile(f)).size})`);
  return page;
});

await test('edit-pdf:edit-revert-undo-delete-line', async () => {
  const page = await open('/edit-pdf/');
  await peLoad(page, 'edit-text.pdf');
  const v = await peView(page);
  await peClick(page, v, 100, 122);
  await page.mouse.click(...v.at(400, 330)); // click away without changing → nothing is recorded
  await sleep(200);
  assert((await page.evaluate(() => window.__pe.anns.length)) === 0, 'unchanged edit is dropped');
  await peClick(page, v, 100, 122);
  await peSelectAll(page);
  await page.keyboard.press('Backspace'); // empty the line = delete the text
  await page.mouse.click(...v.at(400, 330));
  await sleep(200);
  assert((await page.evaluate(() => window.__pe.anns.length)) === 1, 'emptied line kept as a deletion');
  const f = await peSave(page);
  const [txt] = await pdfTexts(f);
  assert(!txt.includes('Payment due') && txt.includes('Invoice Number 20458'), `line deleted only: ${txt}`);
  await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control');
  assert((await page.evaluate(() => window.__pe.anns.length)) === 0, 'undo restores the original line');
  await page.keyboard.down('Control'); await page.keyboard.press('y'); await page.keyboard.up('Control');
  assert((await page.evaluate(() => window.__pe.anns.length)) === 1, 'redo');
  return page;
});

await test('edit-pdf:annotations-text-signature', async () => {
  const page = await open('/edit-pdf/', 'en');
  await peLoad(page, 'a.pdf');
  const v = await peView(page);
  // highlight over the title text, underline another click, strikeout
  await peTool(page, 'hl');
  await peDrag(page, v.at(60, 62), v.at(250, 62));
  await peTool(page, 'ul');
  await peClick(page, v, 100, 62);
  await peTool(page, 'st');
  await peClick(page, v, 100, 62);
  // pen, rectangle, ellipse, arrow, line
  await peTool(page, 'pen');
  await peDrag(page, v.at(80, 200), v.at(200, 260), 15);
  for (const [t, a, b] of [['rect', [300, 200], [380, 260]], ['ell', [300, 300], [380, 340]], ['arrow', [100, 400], [220, 450]], ['line', [100, 440], [220, 440]]]) {
    await peTool(page, t);
    await peDrag(page, v.at(...a), v.at(...b))
  }
  // sticky note
  await peTool(page, 'note');
  await peClick(page, v, 450, 120);
  await page.keyboard.type('Check this 请核对');
  // bold serif text box with Chinese, then a date stamp
  await peTool(page, 'text');
  await page.select('#pe-font', 'serif');
  await page.click('#pe-bold');
  await peClick(page, v, 100, 330);
  await page.keyboard.type('Approved 已批准');
  await peTool(page, 'select');
  await peTool(page, 'date');
  await peClick(page, v, 100, 380);
  await peTool(page, 'select');
  // signature, remembered for next time
  await peTool(page, 'sign');
  await page.click('#pe-sig [data-tab="type"]');
  await page.type('#pe-sigtext', 'Alex Chen');
  await page.click('#pe-sig-use');
  await peClick(page, v, 380, 430);
  const counts = await page.evaluate(() => Object.fromEntries(['hl', 'ul', 'st', 'ink', 'rect', 'ell', 'arrow', 'line', 'note', 'text', 'image'].map((t) => [t, window.__pe.anns.filter((a) => a.type === t).length])));
  for (const [k, n] of Object.entries(counts)) assert(n >= (k === 'text' ? 2 : 1), `${k} count ${n}`);
  assert(await page.evaluate(() => JSON.parse(localStorage.getItem('lk-pe-signatures') || '[]').length) === 1, 'signature remembered');
  const f = await peSave(page);
  const doc = await PDFDocument.load(fs.readFileSync(outFile(f)));
  const p0 = doc.getPage(0);
  const res = p0.node.Resources();
  const xo = res.lookup(PDFName.of('XObject'));
  assert(xo && xo.keys().length >= 1, 'signature image');
  assert(res.lookup(PDFName.of('ExtGState')), 'highlight blend state');
  const annots = p0.node.Annots();
  assert(annots && annots.size() === 1 && /Check this/.test(Buffer.from(annots.lookup(0).lookup(PDFName.of('Contents')).asBytes()).toString('latin1')), 'sticky note annotation');
  const [txt] = await pdfTexts(f);
  assert(txt.includes('Approved 已批准') && /\d{4}/.test(txt.replace('A page 1', '')), `text + date are real text: ${txt}`);
  assert(txt.includes('A page 1'), 'original text kept');
  // the signature is offered again in a new session
  await page.click('#pe-tools [data-tool="sign"]');
  assert((await page.$$('#pe-saved .sv')).length === 1, 'saved signature listed');
  await page.click('#pe-sig-cancel');
  return page;
});

await test('edit-pdf:select-move-copy-delete-undo', async () => {
  const page = await open('/edit-pdf/');
  await peLoad(page, 'a.pdf');
  const v = await peView(page);
  await peTool(page, 'rect');
  await peDrag(page, v.at(300, 200), v.at(380, 260));
  await peTool(page, 'ell');
  await peDrag(page, v.at(300, 300), v.at(380, 340));
  await peTool(page, 'select');
  await page.mouse.click(...v.at(340, 200)); // rubber band over both
  await peDrag(page, v.at(280, 180), v.at(420, 360));
  assert((await page.$$('.ann.on')).length === 2, 'multi-select');
  const before = await page.evaluate(() => window.__pe.anns.map((a) => a.x));
  await page.keyboard.press('ArrowRight');
  await page.keyboard.down('Shift'); await page.keyboard.press('ArrowDown'); await page.keyboard.up('Shift');
  const after = await page.evaluate(() => window.__pe.anns.map((a) => a.x));
  assert(after[0] - before[0] === 1, 'nudged');
  await page.keyboard.down('Control'); await page.keyboard.press('c'); await page.keyboard.press('v'); await page.keyboard.up('Control');
  assert(await page.evaluate(() => window.__pe.anns.length) === 4, 'pasted copies');
  await page.keyboard.press('Delete');
  assert(await page.evaluate(() => window.__pe.anns.length) === 2, 'deleted selection');
  await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control');
  assert(await page.evaluate(() => window.__pe.anns.length) === 4, 'undo delete');
  // move by dragging one
  await peTool(page, 'select');
  const [bx, by] = v.at(340, 200);
  await peDrag(page, [bx, by], [bx + 60, by + 30]);
  assert(await page.evaluate(() => window.__pe.anns.some((a) => a.type === 'rect' && a.x > 310)), 'dragged');
  return page;
});

await test('edit-pdf:fill-form', async () => {
  const page = await open('/edit-pdf/');
  await peLoad(page, 'form.pdf');
  await waitText(page, '#pe-formbar', /4/);
  const v = await peView(page);
  await page.type('.fl input[type=text]', 'Ada Lovelace');
  await page.click('.fl input[type=checkbox]');
  await page.click('.fl input[type=radio][value="pro"]');
  await page.select('.fl select', 'China');
  const f = await peSave(page);
  const form = (await PDFDocument.load(fs.readFileSync(outFile(f)))).getForm();
  assert(form.getTextField('fullName').getText() === 'Ada Lovelace', 'text field');
  assert(form.getCheckBox('subscribe').isChecked(), 'checkbox');
  assert(form.getRadioGroup('plan').getSelected() === 'pro', 'radio');
  assert(form.getDropdown('country').getSelected()[0] === 'China', 'dropdown');
  // flatten: values become page content
  fs.rmSync(outFile(f));
  await page.$eval('#pe-flatten', (e) => e.click());
  const g = await peSave(page, 2);
  const flat = await PDFDocument.load(fs.readFileSync(outFile(g)));
  assert(flat.getForm().getFields().length === 0, 'flattened');
  assert((await pdfTexts(g))[0].includes('Ada Lovelace'), 'flattened text visible');
  return page;
});

await test('edit-pdf:page-panel-operations', async () => {
  const page = await open('/edit-pdf/');
  await peLoad(page, 'a.pdf');
  await page.waitForFunction(() => document.querySelectorAll('#pe-thumbs .th canvas').length === 3, { timeout: 20000 });
  const th = (i, title) => page.click(`#pe-thumbs .th:nth-child(${i}) button[title="${title}"]`);
  await th(2, 'Duplicate page'); // 1 2 2' 3
  await th(4, 'Delete page'); // 1 2 2'
  await th(1, 'Rotate page'); // rotate first
  await page.click('#pe-addpage'); // blank after the current page
  await sleep(300);
  assert((await page.$$('#pe-thumbs .th')).length === 4, 'four pages');
  // reorder: move the last page up
  await th(4, 'Move up');
  await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control'); // undo the move
  await page.keyboard.down('Control'); await page.keyboard.press('y'); await page.keyboard.up('Control'); // redo it
  const order = await page.evaluate(() => window.__pe.pgs.map((p) => (p.src == null ? 'blank' : p.src + (p.rot ? 'r' : ''))).join());
  assert(order === '0r,blank,1,1' || order === '0r,1,blank,1' || order.split(',').length === 4, order);
  const f = await peSave(page);
  const doc = await PDFDocument.load(fs.readFileSync(outFile(f)));
  assert(doc.getPageCount() === 4, 'page count');
  assert(doc.getPage(0).getRotation().angle === 90, 'rotated');
  const txt = await pdfTexts(f);
  assert(txt.filter((t) => t.includes('A page 2')).length === 2 && txt.filter((t) => t === '').length === 1 && txt.some((t) => t.includes('A page 1')) && !txt.some((t) => t.includes('A page 3')), `pages ${JSON.stringify(txt)}`);
  return page;
});

await test('edit-pdf:large-document-lazy', async () => {
  const big = outFile('big-120.pdf');
  const doc = await PDFDocument.create();
  for (let i = 1; i <= 120; i++) doc.addPage([595, 842]).drawText(`Page ${i}`, { x: 60, y: 760, size: 30 });
  fs.writeFileSync(big, await doc.save());
  const page = await open('/edit-pdf/');
  await upload(page, '#pe-pick', [big]);
  await page.waitForFunction(() => document.querySelectorAll('#pe-pages .epage').length === 120, { timeout: 60000 });
  await sleep(1500);
  const canvases = await page.$$eval('#pe-pages canvas', (c) => c.length);
  assert(canvases > 0 && canvases < 25, `lazy rendering (${canvases} canvases)`);
  await page.click('#pe-thumbs .th:nth-child(100)');
  await sleep(1500);
  const n2 = await page.$$eval('#pe-pages canvas', (c) => c.length);
  assert(n2 < 25, `canvases released (${n2})`);
  return page;
});

await test('edit-pdf:phone-layout', async () => {
  const page = await open('/edit-pdf/', 'zh', 390);
  await peLoad(page, 'edit-text.pdf');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 391), 'no horizontal page scroll');
  await page.click('#pe-panel');
  assert(await page.$eval('#pe-side', (e) => getComputedStyle(e).display !== 'none'), 'panel opens');
  await page.click('#pe-panel');
  const v = await peView(page);
  await peClick(page, v, 100, 78);
  assert(await page.$('.ann .tx'), 'tap edits text on the phone layout');
  return page;
});

await test('compress-pdf:images', async () => {
  const page = await open('/compress-pdf/');
  await upload(page, '#cp-pick', ['heavy.pdf']);
  await page.waitForSelector('#cp-file .thumb canvas', { timeout: 30000 });
  await page.click('#cp-go');
  await page.waitForSelector('#cp-result .result', { timeout: 120000 });
  await page.click('#cp-result .btn.lg');
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

await test('resume-builder:example+pdf', async () => {
  const page = await open('/resume-builder/', 'zh');
  await page.click('#rb-example');
  await page.waitForFunction(() => document.querySelector('#rb-paper h1')?.textContent === '陈晓明');
  await page.select('select[name="template"]', 'modern');
  await page.waitForSelector('#rb-paper .cv-modern .cv-side');
  await page.reload({ waitUntil: 'networkidle0' });
  assert(await page.$eval('select[name="template"]', (e) => e.value) === 'modern', 'autosave');
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.id = 'print-root';
    root.append(document.querySelector('#rb-paper .cv').cloneNode(true));
    document.body.append(root);
    document.body.classList.add('printing');
  });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  assert((await PDFDocument.load(pdf)).getPageCount() === 1, 'one page');
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
