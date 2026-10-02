// Real OPUS-MT translation checks. No mocked models/responses; caches live on the
// system temp drive, not in the repository. BASE_URL defaults to local port 8092.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:8092/localkit';
const OUT = path.join(ROOT, 'test/out/translate-subtitles');
const PROFILE = process.env.LK_TRANSLATION_PROFILE || path.join(os.tmpdir(), 'localkit-translate-e2e-browser');
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ userDataDir: PROFILE });
const results = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const times = ['00:00:01.125 --> 00:00:03.750', '00:00:04.000 --> 00:00:06.500', '00:00:08.050 --> 00:00:10.900'];
const english = ['Hello, how are you?', 'The weather is good today.', 'Thank you for your help.'];
const chinese = ['你好，世界。', '今天天气很好。', '谢谢你的帮助。'];
const srt = texts => texts.map((text, i) => `${i + 1}\n${times[i].replaceAll('.', ',')}\n${text}\n`).join('\n');
const vtt = texts => `WEBVTT\n\n${texts.map((text, i) => `${times[i]}\n${text}\n`).join('\n')}`;
const englishFile = path.join(OUT, 'english-input.srt');
fs.writeFileSync(englishFile, srt(english));

async function open(lang = 'en', width = 1280) {
  const page = await browser.newPage();
  page.errors = [];
  page.downloadJobs = [];
  page.externalWrites = [];
  page.on('pageerror', error => page.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') page.errors.push(message.text()); });
  page.on('request', request => {
    if (request.url().startsWith('http') && new URL(request.url()).origin !== new URL(BASE).origin && !['GET', 'HEAD'].includes(request.method())) page.externalWrites.push(request.url());
  });
  await page.setViewport({ width, height: 900 });
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: OUT, eventsEnabled: true });
  client.on('Browser.downloadWillBegin', event => page.downloadJobs.push({ guid: event.guid, name: path.basename(event.suggestedFilename), state: 'inProgress' }));
  client.on('Browser.downloadProgress', event => { const job = page.downloadJobs.find(x => x.guid === event.guid); if (job) job.state = event.state; });
  await page.goto(`${BASE}/${lang}/translate-subtitles/`, { waitUntil: 'networkidle0' });
  return page;
}

async function download(page, selector, expectedName) {
  const index = page.downloadJobs.length;
  await page.click(selector);
  const deadline = Date.now() + 30000;
  while ((!page.downloadJobs[index] || page.downloadJobs[index].state === 'inProgress') && Date.now() < deadline) await sleep(100);
  const job = page.downloadJobs[index];
  assert.equal(job?.state, 'completed', `Chrome did not complete ${expectedName}`);
  assert.equal(job.name, expectedName);
  const file = path.join(OUT, job.guid);
  while (!fs.existsSync(file) && Date.now() < deadline) await sleep(50);
  assert(fs.existsSync(file), `Missing completed GUID download ${job.guid}`);
  const text = fs.readFileSync(file, 'utf8');
  fs.copyFileSync(file, path.join(OUT, expectedName));
  fs.unlinkSync(file);
  return text;
}

function verifyCues(text, format) {
  if (format === 'vtt') assert(text.startsWith('WEBVTT\n'), 'VTT header');
  const found = [...text.matchAll(/(\d{2}:\d{2}:\d{2}[.,]\d{3}) --> (\d{2}:\d{2}:\d{2}[.,]\d{3})/g)].map(m => `${m[1]} --> ${m[2]}`.replaceAll(',', '.'));
  assert.deepEqual(found, times, `${format}: cue count and exact timestamps must survive`);
  return text.split(/\n\s*\n/).filter(block => block.includes('-->')).map(block => block.split('\n').slice(block.split('\n').findIndex(line => line.includes('-->')) + 1).join('\n').trim());
}

async function waitResult(page) {
  const deadline = Date.now() + 600000;
  let logged = 0;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => ({ done: !!document.querySelector('#ts-result .result'), error: document.querySelector('#ts-alert .alert.error')?.textContent, progress: document.querySelector('#ts-task')?.innerText }));
    if (state.error) throw new Error(state.error);
    if (state.done) return;
    if (Date.now() - logged > 15000) { console.log(state.progress?.replace(/\s+/g, ' ').trim()); logged = Date.now(); }
    await sleep(300);
  }
  throw new Error('Real model translation timed out after 10 minutes');
}

async function test(name, body, lang = 'en', width = 1280) {
  const start = Date.now();
  const page = await open(lang, width);
  try {
    await body(page);
    assert.deepEqual(page.externalWrites, [], 'Subtitle text must never be sent to a server');
    assert.deepEqual(page.errors, [], 'Unexpected browser errors');
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    console.log(`PASS ${name} (${((Date.now() - start) / 1000).toFixed(1)} s)`);
    results.push({ name, passed: true, milliseconds: Date.now() - start });
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    await page.screenshot({ path: path.join(OUT, `FAIL-${name}.png`), fullPage: true }).catch(() => {});
    results.push({ name, passed: false, error: error.message, milliseconds: Date.now() - start });
  } finally { await page.close(); }
}

try {
  await test('cancel-during-connection', async page => {
    await (await page.$('#ts-pick input')).uploadFile(englishFile);
    await page.select('#ts-to', 'zh');
    // Both genuine click handlers run before the asynchronous host probe resolves.
    await page.evaluate(() => { document.querySelector('#ts-go').click(); document.querySelector('#ts-task button').click(); });
    await page.waitForFunction(() => !document.querySelector('#ts-go').disabled && !document.querySelector('#ts-task .task'), { timeout: 4000 });
    assert.match(await page.$eval('#ts-alert', el => el.innerText), /cancel/i);
    assert.equal(await page.$('#ts-result .result'), null);
  });

  await test('english-srt-to-chinese-edit-bilingual', async page => {
    await (await page.$('#ts-pick input')).uploadFile(englishFile);
    assert.equal(await page.$eval('#ts-from', el => el.value), 'en');
    await page.select('#ts-to', 'zh');
    await page.click('#ts-go');
    await waitResult(page);
    const translations = await page.$$eval('#ts-result textarea', els => els.map(el => el.value));
    assert.equal(translations.length, 3);
    assert(translations.every(value => /[\u4e00-\u9fff]/.test(value)), JSON.stringify(translations));
    assert(/天气|天氣/.test(translations[1]), `Weather meaning lost: ${translations[1]}`);
    assert(/谢|謝|感激/.test(translations[2]), `Thanks meaning lost: ${translations[2]}`);
    console.log('EN → ZH:', JSON.stringify(translations));
    const only = verifyCues(await download(page, '#ts-result .actions button:nth-child(1)', 'english-input.zh.srt'), 'srt');
    assert.deepEqual(only, translations);
    await page.$eval('#ts-result textarea', el => { el.value = '你好，今天过得怎么样？'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('input[name="ts-mode"][value="bi"] + span');
    const bilingual = verifyCues(await download(page, '#ts-result .actions button:nth-child(2)', 'english-input.zh.vtt'), 'vtt');
    assert.equal(bilingual[0], `${english[0]}\n你好，今天过得怎么样？`);
    for (let i = 1; i < bilingual.length; i++) assert.equal(bilingual[i], `${english[i]}\n${translations[i]}`);
  });

  await test('chinese-vtt-to-english-mobile', async page => {
    await page.click('#ts-paste-box summary');
    await page.$eval('#ts-paste', (el, text) => { el.value = text; }, vtt(chinese));
    await page.click('#ts-paste-go');
    assert.equal(await page.$eval('#ts-from', el => el.value), 'zh');
    assert.equal(await page.$eval('#ts-to', el => el.value), 'en');
    await page.click('#ts-go');
    await waitResult(page);
    const translations = await page.$$eval('#ts-result textarea', els => els.map(el => el.value));
    assert.equal(translations.length, 3);
    assert(translations.every(value => /[a-z]{3}/i.test(value) && !/[\u4e00-\u9fff]/.test(value)), JSON.stringify(translations));
    assert(/hello|hi|world/i.test(translations[0]), translations[0]);
    assert(/weather|day|today/i.test(translations[1]), translations[1]);
    assert(/thank|help|grateful/i.test(translations[2]), translations[2]);
    console.log('ZH → EN:', JSON.stringify(translations));
    assert.deepEqual(verifyCues(await download(page, '#ts-result .actions button:nth-child(2)', 'subtitles.en.vtt'), 'vtt'), translations);
    assert.deepEqual(verifyCues(await download(page, '#ts-result .actions button:nth-child(1)', 'subtitles.en.srt'), 'srt'), translations);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390px horizontal overflow');
  }, 'zh', 390);
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
}
console.log(`${results.filter(r => r.passed).length}/${results.length} passed`);
if (results.some(r => !r.passed)) process.exitCode = 1;
