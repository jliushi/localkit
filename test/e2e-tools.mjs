// Tool scenarios beyond Base64 and diff. Loaded by test/e2e.mjs.
import fs from 'node:fs';
import path from 'node:path';

export default async function ({ test, open, upload, waitText, assert, OUT }) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitDownload = async (page, n = 1, timeout = 20000) => {
    const end = Date.now() + timeout;
    while (page.downloads.length < n && Date.now() < end) await sleep(200);
    assert(page.downloads.length >= n, `expected ${n} downloads, got ${page.downloads.length}`);
    await sleep(500);
    return page.downloads[n - 1];
  };
  const fileOut = (name) => path.join(OUT, name);

  // ---------------------------------------------------------------- image converter
  await test('image-converter:batch', async () => {
    const page = await open('/image-converter/');
    await upload(page, '#ic-drop', ['sample.png', 'sample.jpg', 'photo.heic']);
    await page.waitForFunction(() => document.querySelectorAll('#ic-files li').length === 3);
    await page.select('#ic-format', 'image/jpeg');
    await page.$eval('#ic-max', (e) => { e.value = '300'; });
    await page.click('#ic-go');
    await waitText(page, '#ic-status', /3 images converted/, 90000);
    const sizes = await page.$$eval('#ic-results .result div:nth-child(3)', (d) => d.map((x) => x.textContent));
    assert(sizes.every((s) => /^(300 × \d+|\d+ × 300) /.test(s)), `sizes ${sizes}`);
    await page.click('#ic-zip');
    const name = await waitDownload(page);
    assert(name === 'images.zip', name);
    return page;
  });

  await test('image-converter:ico', async () => {
    const page = await open('/image-converter/', 'zh');
    await upload(page, '#ic-drop', ['sample.png']);
    await page.select('#ic-format', 'image/x-icon');
    await page.click('#ic-go');
    await waitText(page, '#ic-status', /已转换 1 张/);
    await page.click('#ic-results .result button');
    const name = await waitDownload(page);
    assert(name === 'sample.ico', name);
    const buf = fs.readFileSync(fileOut('sample.ico'));
    assert(buf.readUInt16LE(2) === 1 && buf.readUInt16LE(4) === 1, 'ico header');
    return page;
  });
  // ---------------------------------------------------------------- PDF
  const { PDFDocument } = await import('pdf-lib');
  const pdfPages = async (file) => (await PDFDocument.load(fs.readFileSync(fileOut(file)))).getPageCount();

  await test('pdf-merge:merge', async () => {
    const page = await open('/pdf-merge/');
    await upload(page, '#pm-drop', ['a.pdf', 'b.pdf']);
    await page.waitForFunction(() => [...document.querySelectorAll('#pm-files .meta')].filter((m) => /pages/.test(m.textContent)).length === 2);
    await sleep(300);
    await page.click('#pm-files li:nth-child(2) button[title="Move up"]');
    const first = await page.$eval('#pm-files li .name', (e) => e.textContent);
    assert(first === 'b.pdf', 'reorder');
    await page.click('#pm-go');
    await waitText(page, '#pm-status', /Merged 2 files, 5 pages/);
    const name = await waitDownload(page);
    assert(await pdfPages(name) === 5, 'merged page count');
    return page;
  });

  await test('pdf-split:ranges', async () => {
    const page = await open('/pdf-split/');
    await upload(page, '#ps-drop', ['long.pdf']);
    await page.waitForFunction(() => document.querySelectorAll('#ps-thumbs canvas').length === 7, { timeout: 30000 });
    await page.click('#ps-thumbs .thumb[data-n="2"]');
    await page.click('#ps-thumbs .thumb[data-n="5"]');
    await waitText(page, '#ps-count', /2 of 7/);
    await page.click('#ps-go');
    await waitText(page, '#ps-status', /Created 1 file/);
    const n1 = await waitDownload(page, 1);
    assert(await pdfPages(n1) === 2, 'selected pages');
    await page.select('#ps-mode', 'ranges');
    await page.type('#ps-ranges', '1-3, 6-');
    await page.click('#ps-go');
    await waitText(page, '#ps-status', /Created 2 file/);
    const n2 = await waitDownload(page, 2);
    assert(n2.endsWith('.zip'), n2);
    await page.$eval('#ps-ranges', (e) => { e.value = '9-12'; });
    await page.click('#ps-go');
    await waitText(page, '#ps-status', /Invalid range/);
    return page;
  });

  await test('pdf-organize:rotate-delete', async () => {
    const page = await open('/pdf-organize/', 'zh');
    await upload(page, '#po-drop', ['a.pdf']);
    await page.waitForFunction(() => document.querySelectorAll('#po-thumbs canvas').length === 3, { timeout: 30000 });
    await page.click('#po-thumbs .thumb:nth-child(1) button[title="向右旋转"]');
    await page.click('#po-thumbs .thumb:nth-child(2) button[title="删除 / 恢复"]');
    await page.click('#po-save');
    await waitText(page, '#po-status', /已保存 2 页/);
    const name = await waitDownload(page);
    const doc = await PDFDocument.load(fs.readFileSync(fileOut(name)));
    assert(doc.getPageCount() === 2, 'pages');
    assert(doc.getPage(0).getRotation().angle === 90, 'rotation');
    return page;
  });

  await test('pdf-to-images:jpg', async () => {
    const page = await open('/pdf-to-images/');
    await upload(page, '#pi-drop', ['a.pdf']);
    await page.waitForFunction(() => !document.querySelector('#pi-go').disabled);
    await page.type('#pi-ranges', '2-3');
    await page.click('#pi-go');
    await waitText(page, '#pi-status', /Converted 2 pages/);
    const dims = await page.$$eval('#pi-results .result div:nth-child(3)', (d) => d.map((x) => x.textContent));
    assert(dims.every((d) => d.startsWith('1240 × 1754')), dims.join());
    const name = await waitDownload(page);
    assert(name === 'a_images.zip', name);
    return page;
  });

  await test('scan-to-pdf:bw', async () => {
    const page = await open('/scan-to-pdf/');
    await upload(page, '#sp-drop', ['doc-photo.jpg', 'sample.jpg']);
    await page.waitForFunction(() => document.querySelectorAll('#sp-thumbs canvas').length === 2);
    await page.select('#sp-filter', 'bw');
    await page.click('#sp-go');
    await waitText(page, '#sp-status', /Created a 2-page PDF/);
    const name = await waitDownload(page);
    const doc = await PDFDocument.load(fs.readFileSync(fileOut(name)));
    assert(doc.getPageCount() === 2, 'pages');
    const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
    assert(Math.round(w) === 595 && Math.round(h) === 842, `A4 portrait ${w}x${h}`);
    assert(Math.round(doc.getPage(1).getWidth()) === 842, 'landscape photo -> landscape page');
    return page;
  });
  await test('pdf-edit:text-sign-white', async () => {
    const { PDFName } = await import('pdf-lib');
    const page = await open('/pdf-edit/');
    await upload(page, '#pe-drop', ['a.pdf']);
    await page.waitForFunction(() => document.querySelectorAll('#pe-pages canvas').length === 3, { timeout: 30000 });
    const box = await (await page.$('.epage[data-idx="0"]')).boundingBox();
    await page.mouse.click(box.x + 100, box.y + 200);
    await page.keyboard.type('Hello 你好');
    const text = await page.$eval('.ann [contenteditable]', (e) => e.textContent);
    assert(text === 'Hello 你好', 'typed text: ' + text);
    await page.click('input[name="pe-tool"][value="whiteout"]');
    await page.mouse.click(box.x + 300, box.y + 400);
    await page.click('input[name="pe-tool"][value="signature"]');
    await page.waitForSelector('#pe-sig[open]');
    const pad = await (await page.$('#pe-pad')).boundingBox();
    await page.mouse.move(pad.x + 30, pad.y + 100);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) await page.mouse.move(pad.x + 30 + i * 15, pad.y + 100 + Math.sin(i) * 30);
    await page.mouse.up();
    await page.click('#pe-sig-use');
    await waitText(page, '#pe-hint', /Click on a page/);
    const box2 = await (await page.$('.epage[data-idx="0"]')).boundingBox();
    await page.mouse.click(box2.x + 450, box2.y + 120);
    const n = await page.$$eval('.epage .ann', (a) => a.length);
    assert(n === 3, 'annotations ' + n);
    await page.click('#pe-save');
    await waitText(page, '#pe-status', /Saved/);
    const name = await waitDownload(page);
    const doc = await PDFDocument.load(fs.readFileSync(fileOut(name)));
    const xo = doc.getPage(0).node.Resources().lookup(PDFName.of('XObject'));
    assert(xo && xo.keys().length === 2, 'two images on page 1');
    return page;
  });
  // ---------------------------------------------------------------- video (ffmpeg.wasm)
  const { execFileSync } = await import('node:child_process');
  const probe = (file) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', fileOut(file)]).toString());

  await test('video-converter:mp4-480', async () => {
    const page = await open('/video-converter/');
    await upload(page, '#vc-drop', ['clip-zh.mp4']);
    await page.waitForFunction(() => !document.querySelector('#vc-go').disabled);
    await page.select('#vc-res', '360');
    await page.select('#vc-q', 'small');
    await page.click('#vc-go');
    await waitText(page, '#vc-status', /Done:/, 180000);
    await page.click('#vc-result button');
    const name = await waitDownload(page);
    const info = probe(name);
    const v = info.streams.find((x) => x.codec_type === 'video');
    assert(v.codec_name === 'h264' && v.height === 360, `${v.codec_name} ${v.height}`);
    assert(info.streams.some((x) => x.codec_type === 'audio'), 'audio kept');
    return page;
  });

  await test('video-converter:gif', async () => {
    const page = await open('/video-converter/', 'zh');
    await upload(page, '#vc-drop', ['clip-zh.mp4']);
    await page.waitForFunction(() => !document.querySelector('#vc-go').disabled);
    await page.select('#vc-fmt', 'gif');
    await page.select('#vc-res', '360');
    await page.click('#vc-go');
    await waitText(page, '#vc-status', /完成/, 180000);
    await page.click('#vc-result button');
    const name = await waitDownload(page);
    assert(probe(name).streams[0].codec_name === 'gif', 'gif');
    return page;
  });

  await test('video-trim:fast+precise', async () => {
    const page = await open('/video-trim/');
    await upload(page, '#vt-drop', ['clip-en.mp4']);
    await page.waitForFunction(() => document.querySelector('#vt-end').value.length > 0);
    await page.$eval('#vt-start', (e) => { e.value = '00:04.0'; });
    await page.$eval('#vt-end', (e) => { e.value = '00:09.0'; e.dispatchEvent(new Event('input')); });
    await waitText(page, '#vt-len', /00:05.0/);
    await page.click('#vt-go');
    await waitText(page, '#vt-status', /Clip saved/, 120000);
    await page.click('#vt-result button');
    const n1 = await waitDownload(page, 1);
    const d1 = Number(probe(n1).format.duration);
    assert(d1 > 4 && d1 < 8, 'fast duration ' + d1);
    await page.select('#vt-mode', 'precise');
    await page.click('#vt-go');
    await waitText(page, '#vt-status', /Clip saved/, 180000);
    await page.click('#vt-result button');
    const n2 = await waitDownload(page, 2);
    const d2 = Number(probe(n2).format.duration);
    assert(Math.abs(d2 - 5) < 0.3, 'precise duration ' + d2);
    return page;
  });

  await test('extract-audio:mp3+m4a', async () => {
    const page = await open('/extract-audio/');
    await upload(page, '#ea-drop', ['clip-en.mp4']);
    await page.waitForFunction(() => !document.querySelector('#ea-go').disabled);
    await page.click('#ea-go');
    await waitText(page, '#ea-status', /Saved clip-en.mp3/, 120000);
    await page.click('#ea-result button');
    const n1 = await waitDownload(page, 1);
    assert(probe(n1).streams[0].codec_name === 'mp3', 'mp3');
    await page.select('#ea-fmt', 'm4a');
    await page.click('#ea-go');
    await waitText(page, '#ea-status', /Saved clip-en.m4a/, 120000);
    await page.click('#ea-result button');
    const n2 = await waitDownload(page, 2);
    assert(probe(n2).streams[0].codec_name === 'aac', 'aac');
    return page;
  });
  // ---------------------------------------------------------------- AI subtitles (downloads the Whisper model on first run)
  await test('ai-subtitles:en+burn', async () => {
    const page = await open('/ai-subtitles/');
    await upload(page, '#as-drop', ['clip-en.mp4']);
    await page.waitForFunction(() => !document.querySelector('#as-go').disabled);
    await page.select('#as-model', 'onnx-community/whisper-tiny');
    await page.select('#as-engine', 'wasm');
    await page.click('#as-go');
    await waitText(page, '#as-status', /subtitles generated/, 600000);
    const texts = await page.$$eval('#as-segs textarea', (t) => t.map((x) => x.value).join(' '));
    console.log('    EN:', texts);
    assert(/welcome/i.test(texts) && /browser/i.test(texts), 'transcript content');
    await page.click('#as-srt');
    const srtName = await waitDownload(page, 1);
    const srt = fs.readFileSync(fileOut(srtName), 'utf8');
    assert(/^1\n00:00:\d\d,\d{3} --> 00:00:\d\d,\d{3}\n/.test(srt), 'srt format');
    await page.click('#as-burn');
    await waitText(page, '#as-status', /Video with subtitles is ready/, 300000);
    await page.click('#as-burned button');
    const vid = await waitDownload(page, 2);
    const info = probe(vid);
    assert(info.streams.some((x) => x.codec_type === 'video') && info.streams.some((x) => x.codec_type === 'audio'), 'burned video has video+audio');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '3', '-i', fileOut(vid), '-frames:v', '1', fileOut('burned-frame.png')]);
    return page;
  });

  await test('ai-subtitles:zh', async () => {
    const page = await open('/ai-subtitles/', 'zh');
    await upload(page, '#as-drop', ['clip-zh.mp4']);
    await page.waitForFunction(() => !document.querySelector('#as-go').disabled);
    await page.select('#as-model', 'onnx-community/whisper-base');
    await page.select('#as-engine', 'wasm');
    await page.click('#as-go');
    await waitText(page, '#as-status', /已生成/, 600000);
    const texts = await page.$$eval('#as-segs textarea', (t) => t.map((x) => x.value).join(' '));
    console.log('    ZH:', texts);
    assert(/[一-鿿]/.test(texts), 'chinese text');
    assert(!/[這歡來們與體視頻]/.test(texts), 'simplified only');
    return page;
  });
  // ---------------------------------------------------------------- resume
  await test('resume-builder:example+pdf', async () => {
    const page = await open('/resume-builder/', 'zh');
    await page.click('#rb-example');
    await page.waitForFunction(() => document.querySelector('#rb-paper h1')?.textContent === '陈晓明');
    await page.type('input[name="headline"]', '（资深）');
    await page.waitForFunction(() => /资深/.test(document.querySelector('#rb-paper .cv-headline')?.textContent || ''));
    await page.select('select[name="template"]', 'modern');
    await page.waitForSelector('#rb-paper .cv-modern .cv-side');
    // The draft survives a reload.
    await page.reload({ waitUntil: 'networkidle0' });
    const kept = await page.$eval('input[name="headline"]', (e) => e.value);
    assert(/资深/.test(kept), 'autosave ' + kept);
    // Print output as PDF (what "Save as PDF" produces).
    await page.evaluate(() => {
      const root = document.createElement('div');
      root.id = 'print-root';
      root.append(document.querySelector('#rb-paper .cv').cloneNode(true));
      document.body.append(root);
      document.body.classList.add('printing');
    });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    fs.writeFileSync(fileOut('resume.pdf'), pdf);
    const doc = await PDFDocument.load(pdf);
    assert(doc.getPageCount() === 1, 'one page, got ' + doc.getPageCount());
    return page;
  });
}
