import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import puppeteer from 'puppeteer';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = process.env.BASE_URL || 'http://localhost:8090/localkit';
const helpers = await build({
  stdin: { contents: 'export { parseTime, filePicker } from "./src/client/lib.js"; export { parseRanges, closeDoc } from "./src/client/pdf-common.js"; export { probeMedia } from "./src/client/ffmpeg-common.js";', resolveDir: root },
  bundle: true, format: 'iife', globalName: 'LKValidation', write: false, loader: { '.svg': 'text' },
});
const browser = await puppeteer.launch();
let passed = 0;
const check = async (name, callback) => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`${base}/en/base64/`, { waitUntil: 'networkidle0' });
    await callback(page);
    assert.deepEqual(errors, [], name);
    passed++;
    console.log(`PASS ${name}`);
  } finally { await page.close(); }
};

try {
  await check('malformed Base64 never throws and valid input recovers', async (page) => {
    for (const value of ['=', '====', 'Y=Q=', 'AAAA===', 'A', '@@', 'data:text/plain,abcd']) {
      await page.$eval('#b6-b64', (node, text) => { node.value = text; node.dispatchEvent(new Event('input')); }, value);
      assert.equal(await page.$$eval('#b6-bin .alert', (nodes) => nodes.length), 1, value);
      assert.equal(await page.$eval('#b6-text', (node) => node.value), '');
    }
    await page.$eval('#b6-b64', (node) => { node.value = 'SGVsbG8='; node.dispatchEvent(new Event('input')); });
    assert.equal(await page.$eval('#b6-text', (node) => node.value), 'Hello');
  });

  await check('data URIs remain standard Base64 with URL-safe mode enabled', async (page) => {
    await page.click('#b6-url');
    await page.click('#b6-uri');
    await page.$eval('#b6-text', (node) => { node.value = '😀 中文'; node.dispatchEvent(new Event('input')); });
    const result = await page.$eval('#b6-b64', async (node) => ({ uri: node.value, text: await (await fetch(node.value)).text() }));
    assert.equal(result.text, '😀 中文');
    assert.match(result.uri, /^data:text\/plain;charset=utf-8;base64,/);
    assert.equal(result.uri.split(',')[1], Buffer.from('😀 中文').toString('base64'));
  });

  await check('replacing and clearing decoded images releases preview URLs', async (page) => {
    await page.evaluate(() => {
      window.revoked = [];
      const revoke = URL.revokeObjectURL.bind(URL);
      URL.revokeObjectURL = (url) => { window.revoked.push(url); revoke(url); };
    });
    const image = fs.readFileSync(new URL('./fixtures/sample.png', import.meta.url)).toString('base64');
    const decode = () => page.$eval('#b6-b64', (node, text) => { node.value = text; node.dispatchEvent(new Event('input')); }, image);
    await decode();
    const first = await page.$eval('#b6-bin img', (node) => node.src);
    await decode();
    const second = await page.$eval('#b6-bin img', (node) => node.src);
    await page.click('#b6-clear');
    assert.deepEqual(await page.evaluate(() => window.revoked), [first, second]);
  });

  await check('time and page ranges reject malformed input and accept spaced ranges', async (page) => {
    await page.addScriptTag({ content: helpers.outputFiles[0].text });
    const result = await page.evaluate(async () => {
      const valid = ['62.5', '01:02.5', '00:01:02,500'].map(LKValidation.parseTime);
      const invalid = ['', '1::2', '1.2:03', '00:60', '0:99:00', '-1', 'Infinity', '9'.repeat(400)].map(LKValidation.parseTime);
      const ranges = LKValidation.parseRanges('1 - 3，5 ～ 6', 6);
      const rejected = ['', '0', '7', '3 - 2'].map((value) => {
        try { LKValidation.parseRanges(value, 6); return false; } catch { return true; }
      });
      LKValidation.closeDoc({ destroy: () => Promise.reject(new Error('Already destroyed')) });
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { valid, invalid, ranges, rejected };
    });
    assert.deepEqual(result, { valid: [62.5, 62.5, 62.5], invalid: Array(8).fill(null), ranges: [[1, 2, 3], [5, 6]], rejected: Array(4).fill(true) });
  });

  await check('file picker catches read errors and accepts a retry', async (page) => {
    await page.addScriptTag({ content: helpers.outputFiles[0].text });
    await page.evaluate(() => {
      const root = document.createElement('div');
      root.id = 'regression-picker';
      document.body.append(root);
      window.pickCount = 0;
      const picker = LKValidation.filePicker(root, { title: 'Test file', accept: '.txt', onFiles: async () => { if (++window.pickCount === 1) throw new Error('Unreadable file'); } });
      window.pickFile = () => {
        const data = new DataTransfer();
        data.items.add(new File(['test'], 'test.txt', { type: 'text/plain' }));
        picker.zone.dispatchEvent(new DragEvent('drop', { dataTransfer: data }));
      };
      window.pickFile();
    });
    await page.waitForFunction(() => !document.querySelector('#regression-picker [aria-busy]'));
    assert.match(await page.$eval('.toast', (node) => node.textContent), /Unreadable file/);
    await page.evaluate(() => window.pickFile());
    await page.waitForFunction(() => !document.querySelector('#regression-picker [aria-busy]'));
    assert.equal(await page.evaluate(() => window.pickCount), 2);
  });

  await check('sample download errors are recoverable without loading error pages', async (page) => {
    await page.addScriptTag({ content: helpers.outputFiles[0].text });
    let requests = 0;
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().endsWith('/regression-sample.txt')) return request.respond({ status: ++requests === 1 ? 503 : 200, contentType: 'text/plain', body: 'sample' });
      return request.continue();
    });
    await page.evaluate((url) => {
      const root = document.createElement('div');
      root.id = 'regression-picker';
      document.body.append(root);
      window.sampleLoads = 0;
      LKValidation.filePicker(root, { title: 'Sample', accept: '.txt', sample: { url, name: 'sample.txt' }, onFiles: () => { window.sampleLoads++; } });
    }, `${base}/regression-sample.txt`);
    await page.click('#regression-picker .sample');
    await page.waitForFunction(() => !document.querySelector('#regression-picker .sample').disabled);
    assert.equal(await page.evaluate(() => window.sampleLoads), 0);
    await page.click('#regression-picker .sample');
    await page.waitForFunction(() => window.sampleLoads === 1);
  });
  await check('legacy metadata validates ffprobe output and recovers after invalid files', async (page) => {
    await page.addScriptTag({ content: helpers.outputFiles[0].text });
    const video = fs.readFileSync(new URL('./fixtures/clip.avi', import.meta.url)).toString('base64');
    const result = await page.evaluate(async (data) => {
      let rejected = false;
      try { await LKValidation.probeMedia(new File(['not media'], 'invalid.avi')); } catch { rejected = true; }
      const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
      const info = await LKValidation.probeMedia(new File([bytes], 'clip.avi'));
      return { rejected, info };
    }, video);
    assert.equal(result.rejected, true);
    assert.equal(result.info.width, 640);
    assert.equal(result.info.height, 360);
    assert.equal(result.info.audio, true);
    assert.ok(result.info.duration > 7 && result.info.duration < 9);
  });
  console.log(`${passed} behavioral regressions passed`);
} finally { await browser.close(); }
