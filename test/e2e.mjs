// End-to-end checks: drives each tool in a real browser and verifies the output.
//   node build/serve.mjs 8090 &   then   node test/e2e.mjs [--only=base64,text-diff] [--shots]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'test', 'out');
const FIX = path.join(ROOT, 'test', 'fixtures');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:8090/localkit';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const only = args.only ? new Set(String(args.only).split(',')) : null;

const browser = await puppeteer.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const results = [];
let lastPage = null;

async function open(p, lang = 'en') {
  const page = await browser.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.setViewport({ width: 1280, height: 900 });
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT, eventsEnabled: true });
  page.downloads = [];
  client.on('Browser.downloadWillBegin', (e) => page.downloads.push(e.suggestedFilename));
  lastPage = page;
  await page.goto(`${BASE}/${lang}${p}`, { waitUntil: 'networkidle0' });
  return page;
}

async function upload(page, selector, files) {
  const input = await page.$(`${selector} input[type=file]`);
  await input.uploadFile(...files.map((f) => (path.isAbsolute(f) ? f : path.join(FIX, f))));
}

const waitText = (page, selector, re, timeout = 60000) =>
  page.waitForFunction((sel, src) => new RegExp(src).test(document.querySelector(sel)?.textContent || ''), { timeout, polling: 200 }, selector, re.source);

async function test(name, fn) {
  if (only && !only.has(name.split(':')[0])) return;
  const started = Date.now();
  let page;
  lastPage = null;
  try {
    page = await fn();
    if (page?.errors?.length) throw new Error(`console errors: ${page.errors.join(' | ')}`);
    results.push([name, 'PASS', Date.now() - started]);
    if (args.shots && page) await page.screenshot({ path: path.join(OUT, `${name.replace(/[^a-z0-9]+/gi, '_')}.png`), fullPage: true });
  } catch (e) {
    results.push([name, `FAIL: ${e.message.split('\n')[0]}`, Date.now() - started]);
    page ||= lastPage;
    if (page) await page.screenshot({ path: path.join(OUT, `FAIL_${name.replace(/[^a-z0-9]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

// ---------------------------------------------------------------- base64
await test('base64:roundtrip', async () => {
  const page = await open('/base64/');
  await page.type('#b64-in', 'Hello 你好 👋');
  await page.click('#b64-enc');
  const enc = await page.$eval('#b64-out', (e) => e.value);
  assert(enc === 'SGVsbG8g5L2g5aW9IPCfkYs=', `encoded ${enc}`);
  await page.click('#b64-swap');
  await page.click('#b64-dec');
  const dec = await page.$eval('#b64-out', (e) => e.value);
  assert(dec === 'Hello 你好 👋', `decoded ${dec}`);
  await page.click('#b64-url');
  await page.$eval('#b64-in', (e) => { e.value = 'ÿþ?>'; });
  await page.click('#b64-enc');
  const url = await page.$eval('#b64-out', (e) => e.value);
  assert(!/[+/=]/.test(url), `url-safe ${url}`);
  await page.$eval('#b64-in', (e) => { e.value = 'not base64!!'; });
  await page.click('#b64-dec');
  await waitText(page, '#b64-status', /valid Base64/);
  return page;
});

await test('base64:file', async () => {
  const page = await open('/base64/', 'zh');
  await upload(page, '#b64-drop', ['sample.png']);
  await page.waitForFunction(() => document.querySelector('#b64-out').value.length > 100);
  const enc = await page.$eval('#b64-out', (e) => e.value);
  assert(enc.startsWith('iVBORw0KGgo'), 'png base64');
  await page.click('#b64-swap');
  await page.click('#b64-dec');
  await page.waitForSelector('#b64-status button');
  await page.click('#b64-status button');
  await new Promise((r) => setTimeout(r, 800));
  assert(page.downloads.length === 1, 'binary download');
  return page;
});

// ---------------------------------------------------------------- diff
await test('text-diff:split', async () => {
  const page = await open('/text-diff/');
  await page.$eval('#d-a', (e) => { e.value = 'line one\nline two\nsame\n第三行文字'; });
  await page.$eval('#d-b', (e) => { e.value = 'line one\nline 2\nsame\n第三行文本\nnew line'; });
  await page.click('#d-go');
  await waitText(page, '#d-status', /3 lines added, 2 lines removed/);
  const marks = await page.$$eval('#d-out mark', (ms) => ms.map((m) => m.textContent));
  assert(marks.includes('two') && marks.includes('2'), `word marks ${marks}`);
  assert(marks.includes('字') && marks.includes('本'), `cjk marks ${marks}`);
  await page.click('input[name="d-view"][value="inline"]');
  const signs = await page.$$eval('#d-out td.sign.add', (s) => s.length);
  assert(signs === 3, `inline adds ${signs}`);
  return page;
});

await test('text-diff:identical', async () => {
  const page = await open('/text-diff/', 'zh');
  await page.$eval('#d-a', (e) => { e.value = 'A\nb'; });
  await page.$eval('#d-b', (e) => { e.value = 'a\nb'; });
  await page.click('#d-case');
  await page.click('#d-go');
  await waitText(page, '#d-status', /完全相同/);
  return page;
});

// ---------------------------------------------------------------- extra tests are appended by later tools
const extra = path.join(ROOT, 'test', 'e2e-tools.mjs');
if (fs.existsSync(extra)) await (await import(`file://${extra}`)).default({ test, open, upload, waitText, assert, FIX, OUT, browser, args });

await browser.close();
let failed = 0;
for (const [name, res, ms] of results) {
  if (res !== 'PASS') failed++;
  console.log(`${res === 'PASS' ? '✓' : '✗'} ${name.padEnd(34)} ${res === 'PASS' ? '' : res} ${(ms / 1000).toFixed(1)}s`);
}
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
