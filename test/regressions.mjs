// Behavioral regressions: invalid inputs, cancellation, retries and saved draft safety.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import JSZip from 'jszip';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixtures = path.join(root, 'test/fixtures');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'localkit-regressions-'));
const base = process.env.BASE_URL || 'http://localhost:8090/localkit';
fs.writeFileSync(path.join(out, 'broken.pdf'), 'not a PDF');
fs.writeFileSync(path.join(out, 'broken.png'), 'not an image');
const browser = await puppeteer.launch();
let passed = 0;
async function check(name, fn) {
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const downloads = [];
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out, eventsEnabled: true });
  cdp.on('Browser.downloadWillBegin', e => downloads.push(e.suggestedFilename));
  try {
    await fn(page, downloads);
    assert.deepEqual(errors, [], 'unexpected page errors');
    console.log(`PASS regression: ${name}`);
    passed++;
  } finally { await page.close(); }
}
const open = (page, tool) => page.goto(`${base}/en/${tool}/`, { waitUntil: 'networkidle0' });
const upload = async (page, zone, files) => (await page.$(`${zone} input[type=file]`)).uploadFile(...files);
const fixture = name => path.join(fixtures, name);
const idle = page => page.waitForFunction(() => document.querySelector('#tool').getAttribute('aria-busy') !== 'true');
const waitDownload = async downloads => {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    const name = downloads.at(-1);
    if (name && fs.existsSync(path.join(out, name)) && !fs.existsSync(path.join(out, name + '.crdownload'))) return path.join(out, name);
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Download did not complete');
};

try {
  await check('Base64 data URI uses standard encoding and clears stale file MIME', async page => {
    await open(page, 'base64');
    await upload(page, '#b64-drop', [fixture('sample.png')]); await idle(page);
    await page.$eval('#b64-in', e => { e.value = 'ÿþ?>'; e.dispatchEvent(new Event('input')); });
    await page.click('#b64-url');
    await page.click('#b64-uri');
    await page.click('#b64-enc');
    const output = await page.$eval('#b64-out', e => e.value);
    assert.equal(output, 'data:text/plain;charset=utf-8;base64,' + Buffer.from('ÿþ?>').toString('base64'));
    assert.equal(await page.evaluate(async uri => (await fetch(uri)).text(), output), 'ÿþ?>');
  });
  await check('PDF editor errors remain visible; changing font does not delete text', async page => {
    await open(page, 'pdf-edit');
    await upload(page, '#pe-drop', [path.join(out, 'broken.pdf')]); await idle(page);
    assert.equal(await page.$eval('#pe-status', e => e.getBoundingClientRect().height > 0), true);
    await upload(page, '#pe-drop', [fixture('a.pdf')]); await idle(page);
    const box = await (await page.$('.epage')).boundingBox();
    await page.mouse.click(box.x + 70, box.y + 100);
    await page.keyboard.type('Keep annotation');
    await page.click('#pe-size');
    await page.keyboard.press('Backspace');
    assert.equal(await page.$$eval('.ann', e => e.length), 1);
    page.once('dialog', dialog => dialog.accept());
    await page.click('#pe-reset');
    assert.equal(await page.$eval('#pe-drop', e => e.hidden), false);
    await upload(page, '#pe-drop', [fixture('b.pdf')]); await idle(page);
    assert.equal(await page.$$eval('.epage', e => e.length), 2);
    assert.equal(await page.$$eval('.ann', e => e.length), 0);
  });
  await check('PDF failed replacement clears old document and recovers', async page => {
    await open(page, 'pdf-to-images');
    await upload(page, '#pi-drop', [fixture('a.pdf')]); await idle(page);
    assert.equal(await page.$eval('#pi-go', e => e.disabled), false);
    await upload(page, '#pi-drop', [path.join(out, 'broken.pdf')]); await idle(page);
    assert.equal(await page.$eval('#pi-go', e => e.disabled), true);
    assert.equal(await page.$eval('#pi-info', e => e.textContent), '');
    await upload(page, '#pi-drop', [fixture('b.pdf')]); await idle(page);
    assert.match(await page.$eval('#pi-info', e => e.textContent), /b.pdf/);
    assert.equal(await page.$eval('#pi-go', e => e.disabled), false);
  });
  await check('PDF split hides stale controls after bad input', async page => {
    await open(page, 'pdf-split');
    await upload(page, '#ps-drop', [fixture('a.pdf')]); await idle(page);
    await upload(page, '#ps-drop', [path.join(out, 'broken.pdf')]); await idle(page);
    assert.equal(await page.$eval('#ps-work', e => e.hidden), true);
    await upload(page, '#ps-drop', [fixture('b.pdf')]); await idle(page);
    assert.equal(await page.$$eval('#ps-thumbs canvas', e => e.length), 2);
    await page.click('#ps-all');
    assert.equal(await page.$$eval('#ps-thumbs [aria-checked="true"]', e => e.length), 2);
  });
  await check('page ranges tolerate whitespace and export actual pages', async (page, downloads) => {
    await open(page, 'pdf-split');
    await upload(page, '#ps-drop', [fixture('long.pdf')]); await idle(page);
    await page.select('#ps-mode', 'ranges');
    await page.type('#ps-ranges', ' 1 - 3 , 6 - 7 ');
    await page.click('#ps-go'); await idle(page);
    const zip = await JSZip.loadAsync(fs.readFileSync(await waitDownload(downloads)));
    const { PDFDocument } = await import('pdf-lib');
    const counts = [];
    for (const file of Object.values(zip.files)) counts.push((await PDFDocument.load(await file.async('uint8array'))).getPageCount());
    assert.deepEqual(counts.sort(), [2, 3]);
  });
  await check('image partial failure is visible; duplicate filenames survive ZIP', async (page, downloads) => {
    await open(page, 'image-converter');
    await upload(page, '#ic-drop', [fixture('sample.png'), fixture('sample.jpg'), path.join(out, 'broken.png')]); await idle(page);
    await page.select('#ic-format', 'image/jpeg');
    await page.click('#ic-go'); await idle(page);
    assert.match(await page.$eval('#ic-status', e => e.textContent), /2 converted, 1 failed/);
    await page.click('#ic-zip');
    const zip = await JSZip.loadAsync(fs.readFileSync(await waitDownload(downloads)));
    assert.deepEqual(Object.keys(zip.files).sort(), ['sample-2.jpg', 'sample.jpg']);
    for (const entry of Object.values(zip.files)) {
      const data = await entry.async('uint8array');
      assert.equal(data[0], 0xff); assert.equal(data[1], 0xd8);
    }
  });
  await check('unsupported file drop has actionable feedback', async page => {
    await open(page, 'pdf-merge');
    await upload(page, '#pm-drop', [fixture('sample.png')]);
    assert.match(await page.$eval('#pm-status', e => e.textContent), /file type is not supported/);
    assert.equal(await page.$$eval('#pm-files li', e => e.length), 0);
  });
  await check('media cancellation prevents file replacement and allows retry', async page => {
    await open(page, 'video-converter');
    await upload(page, '#vc-drop', [fixture('clip-en.mp4')]); await idle(page);
    await page.click('#vc-go');
    await page.waitForSelector('.task-cancel');
    await upload(page, '#vc-drop', [fixture('clip-zh.mp4')]);
    await page.click('.task-cancel'); await idle(page);
    assert.match(await page.$eval('#vc-status', e => e.textContent), /cancelled/);
    assert.match(await page.$eval('#vc-info', e => e.textContent), /clip-en.mp4/);
    assert.equal(await page.$$eval('#vc-result button', e => e.length), 0);
    await page.click('#vc-go');
    await page.waitForSelector('#vc-result video', { timeout: 120000 }); await idle(page);
    assert.match(await page.$eval('#vc-result button', e => e.textContent), /clip-en.mp4/);
  });
  await check('M4A failed stream copy retries with AAC and downloads valid audio', async (page, downloads) => {
    await open(page, 'extract-audio');
    await upload(page, '#ea-drop', [fixture('speech-en.wav')]); await idle(page);
    await page.select('#ea-fmt', 'm4a');
    await page.click('#ea-go');
    await page.waitForSelector('#ea-result button', { timeout: 120000 }); await idle(page);
    await page.click('#ea-result button');
    const file = await waitDownload(downloads);
    const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', file]).toString());
    assert.equal(info.streams[0].codec_name, 'aac');
    assert.ok(Number(info.streams[0].duration) > 1);
  });
  await check('trim rejects empty, malformed and out-of-bounds times', async page => {
    await open(page, 'video-trim');
    await upload(page, '#vt-drop', [fixture('clip-en.mp4')]); await idle(page);
    await page.waitForFunction(() => Number.isFinite(document.querySelector('#vt-video').duration));
    for (const [start, end] of [['', '5'], ['1::2', '5'], ['0', '99:99'], ['0', '99999']]) {
      await page.$eval('#vt-start', (e, value) => { e.value = value; }, start);
      await page.$eval('#vt-end', (e, value) => { e.value = value; }, end);
      await page.click('#vt-go');
      assert.equal(await page.$eval('#vt-status', e => e.classList.contains('error')), true);
      assert.equal(await page.$$eval('.task-cancel', e => e.length), 0);
    }
  });
  await check('resume invalid or remote-image import preserves existing draft', async page => {
    await open(page, 'resume-builder');
    await page.type('input[name="name"]', 'Keep this draft');
    await page.waitForFunction(() => document.querySelector('#rb-paper h1').textContent === 'Keep this draft');
    const requests = [];
    page.on('request', req => { if (req.url().startsWith('https://example.invalid')) requests.push(req.url()); });
    for (const bad of [{ localkitResume: 1, exp: 'not a list' }, { localkitResume: 1, photo: 'https://example.invalid/photo.png' }, { localkitResume: 1, name: { invalid: true } }]) {
      const file = path.join(out, 'bad-resume.json');
      fs.writeFileSync(file, JSON.stringify(bad));
      await (await page.$('#rb-import')).uploadFile(file);
      await page.waitForFunction(() => document.querySelector('#rb-status').classList.contains('error'));
      assert.equal(await page.$eval('input[name="name"]', e => e.value), 'Keep this draft');
    }
    assert.deepEqual(requests, []);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('input[name="name"]', e => e.value), 'Keep this draft');
  });
  await check('corrupted saved draft does not break resume page', async page => {
    await open(page, 'resume-builder');
    await page.evaluateOnNewDocument(() => localStorage.setItem('lk-resume-en', JSON.stringify({ exp: null })));
    await page.reload({ waitUntil: 'networkidle0' });
    await page.type('input[name="name"]', 'Recovered');
    await page.waitForFunction(() => document.querySelector('#rb-paper h1').textContent === 'Recovered');
  });
  await check('AI can cancel a stalled model connection without late results', async page => {
    await open(page, 'ai-subtitles');
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (/huggingface.co|hf-mirror.com/.test(req.url())) setTimeout(() => req.abort().catch(() => {}), 2500);
      else req.continue();
    });
    await upload(page, '#as-drop', [fixture('speech-en.wav')]); await idle(page);
    await page.click('#as-go');
    await page.waitForFunction(() => /Connecting/.test(document.querySelector('#as-status').textContent));
    await page.click('.task-cancel'); await idle(page);
    assert.match(await page.$eval('#as-status', e => e.textContent), /cancelled/);
    assert.equal(await page.$eval('#as-out', e => e.hidden), true);
    await upload(page, '#as-drop', [fixture('speech-zh.wav')]); await idle(page);
    assert.match(await page.$eval('#as-info', e => e.textContent), /speech-zh.wav/);
  });
  console.log(`${passed} behavioral regressions passed`);
} finally { await browser.close(); }
