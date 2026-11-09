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
  // Save by GUID and wait for Chrome's completion event. A stale file with the suggested name
  // (or Chrome choosing a numbered filename) must never make an unfinished export pass a test.
  await client.send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: OUT, eventsEnabled: true });
  page.downloads = [];
  page.downloadJobs = [];
  client.on('Browser.downloadWillBegin', (e) => {
    page.downloads.push(e.suggestedFilename);
    page.downloadJobs.push({ guid: e.guid, name: path.basename(e.suggestedFilename), state: 'inProgress' });
  });
  client.on('Browser.downloadProgress', (e) => {
    const job = page.downloadJobs.find((item) => item.guid === e.guid);
    if (job) job.state = e.state;
  });
  await page.goto(`${BASE}/${lang}${p}`, { waitUntil: 'networkidle0' });
  return page;
}
const upload = async (page, picker, files) => (await page.$(`${picker} input[type=file]`)).uploadFile(...files.map(fixture));
const text = (page, sel) => page.$eval(sel, (e) => e.innerText.replace(/\s+/g, ' ').trim());
const waitText = (page, sel, re, timeout = 60000) => page.waitForFunction((selector, source, flags) => new RegExp(source, flags).test(document.querySelector(selector)?.innerText || ''), { timeout, polling: 200 }, sel, re.source, re.flags);
async function waitDownload(page, n = 1, timeout = 30000) {
  const end = Date.now() + timeout;
  while (page.downloads.length < n && Date.now() < end) await sleep(200);
  assert(page.downloads.length >= n, `expected ${n} downloads, got ${page.downloads.length}`);
  const job = page.downloadJobs[n - 1];
  while (job.state === 'inProgress' && Date.now() < end) await sleep(100);
  assert(job.state === 'completed', `download ${job.name}: ${job.state}`);
  if (!job.saved) {
    const source = outFile(job.guid);
    while (!fs.existsSync(source) && Date.now() < end) await sleep(100);
    assert(fs.existsSync(source), `completed download missing: ${job.name}`);
    fs.copyFileSync(source, outFile(job.name));
    fs.unlinkSync(source);
    job.saved = true;
  }
  return job.name;
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
  if (args['skip-ai'] && ['ai-subtitle-generator:en+burn', 'ai-subtitle-generator:zh-autodetect', 'remove-background:modnet-blue-jpg-zh'].includes(name)) return;
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
    const [testName, result, elapsed] = results.at(-1);
    console.log(`${result === 'PASS' ? '✓' : '✗'} ${testName.padEnd(42)} ${result === 'PASS' ? '' : result} ${(elapsed / 1000).toFixed(1)}s`);
  }
}

// ================================================================ video & audio

// Audio cleanup: verify exported samples and encoded video packets, not only UI state.
const cleanupRms = (file, start, duration) => {
  const bytes = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(start), '-i', file, '-t', String(duration), '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1']);
  let sum = 0;
  for (let i = 0; i + 3 < bytes.length; i += 4) sum += bytes.readFloatLE(i) ** 2;
  return Math.sqrt(sum / (bytes.length / 4));
};
const cleanupVideoHashes = (file) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_packets', '-show_data_hash', 'sha256', '-show_entries', 'packet=data_hash', '-of', 'json', file]).toString()).packets.map((p) => p.data_hash);
const cleanupReady = (page, prefix) => page.waitForFunction((p) => document.querySelector(`#${p}-go`)?.disabled === false, { timeout: 60000 }, prefix);

await test('remove-silence:video-sync-and-cutlist', async () => {
  const page = await open('/remove-silence/');
  await upload(page, '#rs-pick', ['cleanup-silence.mp4']);
  await cleanupReady(page, 'rs');
  const removed = Number(await page.$eval('#rs-summary', (e) => e.dataset.removed));
  assert(removed > 3.3 && removed < 4.1, `removed ${removed}`);
  await page.click('#rs-cutlist');
  const list = fs.readFileSync(outFile(await waitDownload(page)), 'utf8');
  assert(list.includes('KEEP') && list.includes('REMOVE') && list.includes('cleanup-silence.mp4'), 'readable cut list');
  await page.click('#rs-go');
  await page.waitForSelector('#rs-result .result', { timeout: 120000 });
  await clickSettled(page, '#rs-result .btn.lg');
  const info = probe(await waitDownload(page, 2));
  const video = info.streams.find((s) => s.codec_type === 'video'), audio = info.streams.find((s) => s.codec_type === 'audio');
  assert(video && audio, 'both tracks present');
  assert(Number(info.format.duration) < 4.8 && Number(info.format.duration) > 3.9, `duration ${info.format.duration}`);
  assert(Math.abs(Number(video.duration) - Number(audio.duration)) < .2, `A/V durations ${video.duration}/${audio.duration}`);
  return page;
});

await test('remove-silence:audio-mp3-controls', async () => {
  const page = await open('/remove-silence/', 'zh', 390);
  await upload(page, '#rs-pick', ['cleanup-silence.wav']);
  await cleanupReady(page, 'rs');
  const before = Number(await page.$eval('#rs-summary', (e) => e.dataset.removed));
  await page.select('#rs-padding', '0.4');
  const after = Number(await page.$eval('#rs-summary', (e) => e.dataset.removed));
  assert(after < before, 'more padding preserves more sound');
  await page.select('#rs-format', 'mp3');
  await page.click('#rs-go');
  await page.waitForSelector('#rs-result .result', { timeout: 120000 });
  await clickSettled(page, '#rs-result .btn.lg');
  const info = probe(await waitDownload(page));
  assert(info.streams[0].codec_name === 'mp3', 'real MP3');
  assert(Number(info.format.duration) < 5.5, `shorter MP3 ${info.format.duration}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 391), 'phone layout');
  return page;
});

await test('remove-silence:all-silent-recover', async () => {
  const page = await open('/remove-silence/');
  await upload(page, '#rs-pick', ['cleanup-all-silent.wav']);
  await page.waitForSelector('#rs-alert .alert');
  assert(await page.$eval('#rs-go', (e) => e.disabled), 'empty output blocked');
  assert(/entire recording/.test(await text(page, '#rs-alert')), 'clear all-silent message');
  await upload(page, '#rs-pick', ['cleanup-silence.wav']);
  await cleanupReady(page, 'rs');
  await page.select('#rs-format', 'wav');
  await page.click('#rs-go');
  await page.waitForSelector('#rs-result .result', { timeout: 120000 });
  await clickSettled(page, '#rs-result .btn.lg');
  assert(probe(await waitDownload(page)).streams[0].codec_name === 'pcm_s16le', 'recovered WAV export');
  return page;
});

await test('remove-silence:rotation-and-cancel', async () => {
  const page = await open('/remove-silence/');
  await upload(page, '#rs-pick', ['cleanup-rotated.mp4']);
  await cleanupReady(page, 'rs');
  await page.evaluate(() => { document.querySelector('#rs-go').click(); document.querySelector('#rs-task button').click(); });
  await cleanupReady(page, 'rs');
  assert(await page.$('#rs-result .result') === null, 'cancel leaves no partial result');
  await page.click('#rs-go');
  await page.waitForSelector('#rs-result .result', { timeout: 120000 });
  await clickSettled(page, '#rs-result .btn.lg');
  const video = probe(await waitDownload(page)).streams.find((s) => s.codec_type === 'video');
  assert(video.width === 180 && video.height === 320, `portrait rotation retained: ${video.width}x${video.height}`);
  return page;
});

await test('noise-reduction:video-packets-and-noise-rms', async () => {
  const page = await open('/noise-reduction/');
  await upload(page, '#nr-pick', ['cleanup-noisy.mp4']);
  await cleanupReady(page, 'nr');
  await page.$eval('#nr-strength', (e) => { e.value = '100'; e.dispatchEvent(new Event('input')); });
  await page.click('#nr-go');
  await page.waitForSelector('#nr-result .result', { timeout: 120000 });
  await clickSettled(page, '#nr-result .btn.lg');
  const name = await waitDownload(page), output = outFile(name);
  const info = probe(name), originalHashes = cleanupVideoHashes(fixture('cleanup-noisy.mp4')), outputHashes = cleanupVideoHashes(output);
  assert(info.streams.some((s) => s.codec_type === 'video'), 'video retained');
  assert(JSON.stringify(originalHashes) === JSON.stringify(outputHashes), 'all original encoded video packets unchanged');
  const before = cleanupRms(fixture('cleanup-noisy.mp4'), .8, .8), after = cleanupRms(output, .8, .8);
  assert(after < before * .55, `noise RMS ${before.toFixed(5)} -> ${after.toFixed(5)}`);
  assert(cleanupRms(output, 2.5, 3) > cleanupRms(fixture('cleanup-noisy.mp4'), 2.5, 3) * .2, 'speech retained');
  await page.$eval('#nr-result video', (e) => { e.currentTime = 3; });
  await page.click('#nr-result [aria-pressed="false"]');
  await page.waitForFunction(() => Math.abs(document.querySelector('#nr-result video').currentTime - 3) < .15);
  assert(await page.$eval('#nr-result .actions button:first-child', (e) => e.getAttribute('aria-pressed') === 'true'), 'A/B selected original');
  return page;
});

await test('noise-reduction:audio-wav-dry-and-cancel', async () => {
  const page = await open('/noise-reduction/', 'zh', 390);
  await upload(page, '#nr-pick', ['cleanup-noisy.wav']);
  await cleanupReady(page, 'nr');
  await page.click('#nr-go');
  await page.waitForSelector('#nr-task .task button');
  await page.click('#nr-task .task button');
  await cleanupReady(page, 'nr');
  assert(await page.$('#nr-result .result') === null, 'cancel produces no partial result');
  await page.$eval('#nr-strength', (e) => { e.value = '0'; e.dispatchEvent(new Event('input')); });
  await page.click('#nr-go');
  await page.waitForSelector('#nr-result .result', { timeout: 120000 });
  await clickSettled(page, '#nr-result .btn.lg');
  const name = await waitDownload(page);
  assert(probe(name).streams[0].codec_name === 'pcm_s16le', 'real WAV');
  const before = cleanupRms(fixture('cleanup-noisy.wav'), .8, .8), after = cleanupRms(outFile(name), .8, .8);
  assert(Math.abs(after / before - 1) < .01, 'zero strength preserves original audio');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 391), 'phone layout');
  return page;
});

await test('noise-reduction:audio-mp3-highpass', async () => {
  const page = await open('/noise-reduction/');
  await upload(page, '#nr-pick', ['cleanup-noisy.wav']);
  await cleanupReady(page, 'nr');
  await page.select('#nr-format', 'mp3');
  await page.click('#nr-highpass');
  await page.click('#nr-go');
  await page.waitForSelector('#nr-result .result', { timeout: 120000 });
  await clickSettled(page, '#nr-result .btn.lg');
  assert(probe(await waitDownload(page)).streams[0].codec_name === 'mp3', 'MP3 denoiser export');
  return page;
});

for (const tool of ['remove-silence', 'noise-reduction']) for (const lang of ['en', 'zh']) for (const width of [1280, 390]) {
  await test(`${tool}:sample-${lang}-${width}`, async () => {
    const page = await open(`/${tool}/`, lang, width), prefix = tool === 'remove-silence' ? 'rs' : 'nr';
    await page.click(`#${prefix}-pick .sample`);
    await cleanupReady(page, prefix);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal scroll');
    const description = await page.$eval('meta[name="description"]', (e) => e.content);
    assert(description.length > 60, 'localized metadata');
    return page;
  });
}

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

// Display size of a video stream, honouring a rotation flag in the file (what players actually show).
const displaySize = (s) => {
  const rot = Math.abs(Number((s.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation ?? s.tags?.rotate ?? 0)) % 180;
  return rot === 90 ? [s.height, s.width] : [s.width, s.height];
};
const grayFrame = (args, input, at = 1) => execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', input, ...args, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 24 });
/** Mean absolute pixel difference between the output's frame (autorotated) and the source clip with an ffmpeg filter applied. */
function frameDiff(outName, refFilter, src = 'clip-en.mp4') {
  const a = grayFrame(['-vf', 'scale=24:24'], outFile(outName));
  const b = grayFrame(['-vf', `${refFilter ? `${refFilter},` : ''}scale=24:24`], fixture(src));
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

await test('blur-video:timed-mask-export-mobile', async () => {
  const page = await open('/blur-video/', 'zh', 390);
  await upload(page, '#bv-pick', ['clip-en.mp4']);
  await page.waitForSelector('#bv-stage video');
  await page.click('#bv-go');
  assert(await page.$('#bv-alert .alert'), 'empty mask has guidance');
  await page.$eval('.bv-layer', (node) => node.scrollIntoView({ block: 'center' }));
  await sleep(400);
  const bounds = await (await page.$('.bv-layer')).boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .25, bounds.y + bounds.height * .25);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .75, bounds.y + bounds.height * .75, { steps: 8 });
  await page.mouse.up();
  await page.click('input[name="bv-fx"][value="box"] + span');
  await page.click('#bv-list input[type="checkbox"]');
  await page.$$eval('#bv-list input[type="text"]', (inputs) => {
    inputs[1].value = '00:02';
    inputs[1].dispatchEvent(new Event('change'));
  });
  await page.click('#bv-go');
  await page.waitForSelector('#bv-result .result', { timeout: 120000 });
  await clickSettled(page, '#bv-result .btn.lg');
  const name = await waitDownload(page);
  const info = probe(name);
  assert(info.streams.some((stream) => stream.codec_type === 'audio'), 'audio preserved');
  assert(frameDiff(name, 'drawbox=x=iw/4:y=ih/4:w=iw/2:h=ih/2:color=black:t=fill') < 10, 'exported mask matches selected region');
  const pixels = grayFrame(['-vf', 'crop=100:100:270:130'], outFile(name), 3);
  assert(pixels.reduce((total, value) => total + value, 0) / pixels.length > 20, 'mask ends at selected time');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'no phone overflow');
  return page;
});

await test('rotate-video:right-lossless', async () => {
  const page = await open('/rotate-video/');
  await upload(page, '#rv-pick', ['clip-en.mp4']);
  await page.waitForSelector('#rv-stage video');
  await page.click('#rv-right');
  await waitText(page, '#rv-state', /360×640/);
  const box = await page.$eval('.rv-box', (e) => [e.clientWidth, e.clientHeight]);
  assert(box[1] > box[0], `preview box ${box}`);
  await page.click('#rv-go');
  await page.waitForSelector('#rv-result .result', { timeout: 60000 });
  await page.$eval('#rv-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const info = probe(name);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const [w, h] = displaySize(v);
  assert(w === 360 && h === 640, `display ${w}x${h}`);
  assert(v.codec_name === 'h264' && v.width === 640, `lossless should keep coded size: ${v.codec_name} ${v.width}x${v.height}`);
  assert(info.streams.some((s) => s.codec_type === 'audio'), 'audio kept');
  assert(Math.abs(Number(info.format.duration) - 13.84) < 0.5, `duration ${info.format.duration}`);
  assert(frameDiff(name, 'transpose=1') < 12, `orientation differs: ${frameDiff(name, 'transpose=1')}`);
  assert(frameDiff(name, 'transpose=2') > 25, 'rotation direction not distinguishable');
  assert(!page.errors.length, page.errors.join('; '));
  return page;
});

await test('rotate-video:reencode-flip-zh', async () => {
  const page = await open('/rotate-video/', 'zh');
  await upload(page, '#rv-pick', ['clip-en.mp4']);
  await page.waitForSelector('#rv-stage video');
  await page.click('#rv-fv');
  await page.click('#rv-left');
  await waitText(page, '#rv-state', /旋转 270°，垂直翻转 · 显示为 360×640/);
  await page.click('#rv-reencode');
  await page.click('#rv-go');
  await page.waitForSelector('#rv-result .result', { timeout: 120000 });
  await page.$eval('#rv-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const info = probe(name);
  const v = info.streams.find((s) => s.codec_type === 'video');
  assert(v.width === 360 && v.height === 640, `baked size ${v.width}x${v.height}`);
  assert(!(v.side_data_list || []).some((d) => d.rotation), 'rotation should be baked in, not a flag');
  assert(info.streams.some((s) => s.codec_type === 'audio'), 'audio kept');
  // rotate 270 (counter-clockwise) then flip vertically
  const d = frameDiff(name, 'transpose=2,vflip');
  assert(d < 14, `orientation differs: ${d}`);
  assert(frameDiff(name, 'transpose=2') > 25, 'vertical flip not applied');
  return page;
});

await test('rotate-video:flip-h-existing-rotation', async () => {
  const page = await open('/rotate-video/');
  await upload(page, '#rv-pick', ['rotated.mp4']);
  await page.waitForSelector('#rv-stage video');
  await waitText(page, '#rv-state', /360×640/); // already shows portrait because of its 90° flag
  await page.click('#rv-fh');
  await page.click('#rv-go');
  await page.waitForSelector('#rv-result .result', { timeout: 60000 });
  await page.$eval('#rv-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const [w, h] = displaySize(probe(name).streams.find((s) => s.codec_type === 'video'));
  assert(w === 360 && h === 640, `display ${w}x${h}`);
  const d = frameDiff(name, 'hflip', 'rotated.mp4');
  assert(d < 14, `orientation differs: ${d}`);
  return page;
});

const setNum = async (page, id, v) => { await page.$eval(id, (e, val) => { e.value = val; e.dispatchEvent(new Event('input', { bubbles: true })); }, String(v)); };
const numVals = (page) => page.$$eval('.cr-nums input', (is) => is.map((i) => Number(i.value)));

await test('crop-video:square-preset', async () => {
  const page = await open('/crop-video/');
  await upload(page, '#cr-pick', ['clip-en.mp4']);
  await page.waitForSelector('#cr-stage video');
  await page.click('input[name="cr-ratio"][value="1:1"] + span');
  const [x, y, w, h] = await numVals(page);
  assert(w === 360 && h === 360 && y === 0 && x === 140, `box ${x},${y},${w},${h}`);
  await page.click('#cr-go');
  await page.waitForSelector('#cr-result .result', { timeout: 120000 });
  await page.$eval('#cr-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const info = probe(name);
  const v = info.streams.find((s) => s.codec_type === 'video');
  assert(v.width === 360 && v.height === 360, `${v.width}x${v.height}`);
  assert(info.streams.some((s) => s.codec_type === 'audio'), 'audio kept');
  assert(Math.abs(Number(info.format.duration) - 13.84) < 0.5, `duration ${info.format.duration}`);
  const d = frameDiff(name, 'crop=360:360:140:0');
  assert(d < 14, `content differs from the expected crop: ${d}`);
  assert(!page.errors.length, page.errors.join('; '));
  return page;
});

await test('crop-video:9x16-drag-zh', async () => {
  const page = await open('/crop-video/', 'zh');
  await upload(page, '#cr-pick', ['clip-en.mp4']);
  await page.waitForSelector('#cr-stage video');
  await page.click('input[name="cr-ratio"][value="9:16"] + span');
  let [x, y, w, h] = await numVals(page);
  assert(h === 360 && w === 202, `9:16 box ${w}x${h}`);
  // drag the box to the right with the mouse
  const b = await (await page.$('.cr-box')).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2 + 20, { steps: 6 });
  await page.mouse.up();
  [x, y, w, h] = await numVals(page);
  assert(x > 140 && x % 2 === 0 && y === 0 && w === 202 && h === 360, `after move ${x},${y},${w},${h}`);
  // resize from the bottom-right corner: the 9:16 ratio must stay locked
  const hd = await (await page.$('.cr-h.se')).boundingBox();
  await page.mouse.move(hd.x + hd.width / 2, hd.y + hd.height / 2);
  await page.mouse.down();
  await page.mouse.move(hd.x + hd.width / 2 - 30, hd.y + hd.height / 2 - 40, { steps: 6 });
  await page.mouse.up();
  const [x2, y2, w2, h2] = await numVals(page);
  assert(w2 < 202 && Math.abs(w2 / h2 - 9 / 16) < 0.02 && x2 === x, `after resize ${x2},${y2},${w2},${h2}`);
  await waitText(page, '#cr-out', new RegExp(`${w2}×${h2}`));
  await page.click('#cr-go');
  await page.waitForSelector('#cr-result .result', { timeout: 120000 });
  await page.$eval('#cr-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const v = probe(name).streams.find((s) => s.codec_type === 'video');
  assert(v.width === w2 && v.height === h2, `${v.width}x${v.height} vs ${w2}x${h2}`);
  const d = frameDiff(name, `crop=${w2}:${h2}:${x2}:${y2}`);
  assert(d < 20, `content differs: ${d}`);
  assert(frameDiff(name, `crop=${w2}:${h2}:${x2 - 60}:${y2}`) > d + 8, 'crop offset not distinguishable');
  return page;
});

await test('crop-video:numbers-free+rotated-source', async () => {
  const page = await open('/crop-video/');
  await upload(page, '#cr-pick', ['rotated.mp4']); // stored 640×360 with a 90° flag, so it displays 360×640
  await page.waitForSelector('#cr-stage video');
  let vals = await numVals(page);
  assert(vals[2] === 360 && vals[3] === 640, `full frame ${vals}`);
  await setNum(page, '#cr-h', 300);
  await setNum(page, '#cr-w', 300);
  await setNum(page, '#cr-y', 100);
  vals = await numVals(page);
  assert(vals[0] === 0 && vals[1] === 100 && vals[2] === 300 && vals[3] === 300, `numbers ${vals}`);
  await setNum(page, '#cr-w', 5000); // can never leave the frame
  vals = await numVals(page);
  assert(vals[2] === 360 && vals[0] === 0, `clamped ${vals}`);
  await setNum(page, '#cr-w', 300);
  await page.click('#cr-go');
  await page.waitForSelector('#cr-result .result', { timeout: 120000 });
  await page.$eval('#cr-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const v = probe(name).streams.find((s) => s.codec_type === 'video');
  const [w, h] = displaySize(v);
  assert(w === 300 && h === 300, `display ${w}x${h}`);
  const d = frameDiff(name, 'crop=300:300:0:100', 'rotated.mp4');
  assert(d < 14, `content differs: ${d}`);
  return page;
});

await test('crop-video:whole-frame-warns', async () => {
  const page = await open('/crop-video/');
  await upload(page, '#cr-pick', ['clip-en.mp4']);
  await page.waitForSelector('#cr-stage video');
  await page.click('#cr-go');
  await waitText(page, '#cr-alert', /whole video/);
  return page;
});

/** Dominant frequency of the first audio stream (zero-crossing rate of the middle 60 %). */
function audioFreq(name) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', outFile(name), '-vn', '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const s = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  const a = Math.floor(s.length * 0.2), b = Math.floor(s.length * 0.8);
  let z = 0;
  for (let i = a + 1; i < b; i++) if (s[i - 1] < 0 && s[i] >= 0) z++;
  return z / ((b - a) / 48000);
}
const streamDur = (info, type) => Number(info.streams.find((s) => s.codec_type === type)?.duration ?? NaN);

await test('video-speed:2x-keeps-pitch', async () => {
  const page = await open('/video-speed/');
  await upload(page, '#vs-pick', ['tone-5s.mp4']);
  await page.waitForSelector('#vs-player video');
  await waitText(page, '#vs-est', /0:03/); // 2.5 s rounds to 3 s in the shared duration formatter
  assert(await page.$eval('#vs-player video', (v) => v.playbackRate) === 2, 'preview playbackRate');
  await page.click('#vs-go');
  await page.waitForSelector('#vs-result .result', { timeout: 120000 });
  await page.$eval('#vs-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const info = probe(name);
  const v = info.streams.find((s) => s.codec_type === 'video');
  assert(v.codec_name === 'h264' && v.width === 640, `${v.codec_name} ${v.width}`);
  const vd = streamDur(info, 'video'), ad = streamDur(info, 'audio');
  assert(Math.abs(Number(info.format.duration) - 2.5) < 0.25, `duration ${info.format.duration}`);
  assert(Math.abs(vd - 2.5) < 0.25 && Math.abs(ad - 2.5) < 0.25, `video ${vd} audio ${ad}`);
  const f = audioFreq(name);
  assert(f > 420 && f < 460, `pitch changed: ${f} Hz`);
  assert(!page.errors.length, page.errors.join('; '));
  return page;
});

await test('video-audio:mute-lossless', async () => {
  const page = await open('/video-audio/');
  await upload(page, '#va-pick', ['tone-5s.mp4']);
  await page.waitForFunction(() => !document.querySelector('#va-go').disabled);
  await page.click('#va-go');
  await page.waitForSelector('#va-result .result', { timeout: 60000 });
  await page.$eval('#va-result .btn.lg', e => e.click());
  const name = await waitDownload(page), info = probe(name);
  assert(info.streams.filter(s => s.codec_type === 'audio').length === 0, 'muted output has an audio track');
  assert(Math.abs(Number(info.format.duration) - 5) < 0.1, `duration ${info.format.duration}`);
  assert(frameDiff(name, 'null', 'tone-5s.mp4') < 1, 'muting changed the video pixels');
  return page;
});

function pcm(name, start, duration) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(start), '-i', outFile(name), '-t', String(duration), '-vn', '-ac', '1', '-ar', '48000', '-f', 's16le', '-']);
  return new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
}
const rms = a => Math.sqrt(a.reduce((sum, x) => sum + (x / 32768) ** 2, 0) / a.length);
function toneAmplitude(a, frequency) {
  let re = 0, im = 0;
  for (let i = 0; i < a.length; i++) {
    re += a[i] / 32768 * Math.cos(2 * Math.PI * frequency * i / 48000);
    im += a[i] / 32768 * Math.sin(2 * Math.PI * frequency * i / 48000);
  }
  return 2 * Math.hypot(re, im) / a.length;
}
async function audioPage(mode, lang = 'en', source = 'tone-5s.mp4', music = 'music-880hz-1s.wav') {
  const page = await open('/video-audio/', lang);
  await upload(page, '#va-pick', [source]);
  await page.waitForSelector('#va-player video');
  await page.click(`input[name="va-mode"][value="${mode}"] + span`);
  await upload(page, '#va-music-pick', [music]);
  await page.waitForFunction(() => !document.querySelector('#va-go').disabled);
  return page;
}
async function audioSave(page) {
  await page.click('#va-go');
  await page.waitForFunction(() => document.querySelector('#va-result .result') || (document.querySelector('#va-alert').innerText && !document.querySelector('#va-go').disabled), { timeout: 120000 });
  assert(await page.$('#va-result .result'), await text(page, '#va-alert'));
  await page.$eval('#va-result .btn.lg', e => e.click());
  return waitDownload(page);
}

await test('video-audio:replace-loop', async () => {
  const page = await audioPage('replace');
  const name = await audioSave(page), info = probe(name);
  assert(Math.abs(streamDur(info, 'audio') - 5) < 0.1, `audio duration ${streamDur(info, 'audio')}`);
  assert(Math.abs(streamDur(info, 'video') - 5) < 0.1, `video duration ${streamDur(info, 'video')}`);
  assert(Math.abs(audioFreq(name) - 880) < 20, 'replacement music has the wrong frequency');
  assert(rms(pcm(name, 4, 0.8)) > 0.05, 'short music was not looped to the end');
  assert(frameDiff(name, 'null', 'tone-5s.mp4') < 1, 'replacing sound changed video pixels');
  return page;
});

await test('video-audio:mix-volume-fade-zh', async () => {
  const page = await audioPage('mix', 'zh');
  await setNum(page, '#va-volume', 50);
  await page.select('#va-fade', '2');
  const name = await audioSave(page);
  const early = pcm(name, 1.2, 0.5), late = pcm(name, 4.6, 0.25);
  const voice = toneAmplitude(early, 440), music = toneAmplitude(early, 880);
  assert(voice > 0.07 && music > 0.025, `missing mix components: ${voice}, ${music}`);
  assert(music < voice * 0.8, `music volume not reduced: ${music}/${voice}`);
  assert(toneAmplitude(late, 880) < music * 0.3, 'music did not fade out');
  assert(toneAmplitude(late, 440) > voice * 0.8, 'fade changed original voice');
  return page;
});

await test('video-audio:play-once-pads-silence', async () => {
  const page = await audioPage('replace');
  await page.select('#va-loop', 'once');
  const name = await audioSave(page), info = probe(name);
  assert(Math.abs(streamDur(info, 'audio') - 5) < 0.1, 'audio does not cover full video');
  assert(rms(pcm(name, 0.1, 0.7)) > 0.05, 'music missing');
  assert(rms(pcm(name, 2, 2)) < 0.003, 'Play once unexpectedly repeats the music');
  return page;
});

await test('video-audio:silent-source-trims-long-music', async () => {
  const page = await audioPage('mix', 'en', 'merge-c-silent.mp4', 'music-440hz-5s.wav');
  const name = await audioSave(page), info = probe(name);
  const original = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', fixture('merge-c-silent.mp4')]).toString());
  assert(Math.abs(streamDur(info, 'audio') - Number(original.format.duration)) < 0.1, 'music not trimmed to silent source length');
  assert(rms(pcm(name, 0.2, 0.5)) > 0.05, 'silent video was not given music');
  return page;
});

await test('video-audio:cancel-and-retry', async () => {
  const page = await audioPage('replace');
  await page.click('#va-go');
  await page.waitForSelector('#va-task .task');
  await page.click('#va-task button');
  await waitText(page, '#va-alert', /cancel/i);
  assert(!(await page.$('#va-result .result')), 'canceled operation produced a result');
  const name = await audioSave(page);
  assert(probe(name).streams.some(s => s.codec_type === 'audio'), 'retry failed to produce audio');
  return page;
});

await test('video-audio:play-once-fades-at-music-end', async () => {
  const page = await audioPage('replace');
  await page.select('#va-loop', 'once');
  await page.select('#va-fade', '1');
  const name = await audioSave(page);
  const early = rms(pcm(name, 0.1, 0.1)), late = rms(pcm(name, 0.8, 0.1));
  assert(early > 0.05 && late < early * 0.3, `fade did not follow music ending: ${early}, ${late}`);
  return page;
});

await test('video-speed:slow-and-remove-audio-zh', async () => {
  const page = await open('/video-speed/', 'zh');
  await upload(page, '#vs-pick', ['tone-5s.mp4']);
  await page.waitForSelector('#vs-player video');
  await page.click('input[name="vs-speed"][value="0.5"] + span');
  await waitText(page, '#vs-est', /0:10/);
  await page.click('input[name="vs-audio"][value="remove"] + span');
  await page.click('#vs-go');
  await page.waitForSelector('#vs-result .result', { timeout: 120000 });
  await page.$eval('#vs-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const info = probe(name);
  assert(!info.streams.some((s) => s.codec_type === 'audio'), 'audio should be removed');
  assert(Math.abs(Number(info.format.duration) - 10) < 0.5, `duration ${info.format.duration}`);
  return page;
});

await test('video-speed:slider-4x+legacy-avi', async () => {
  const page = await open('/video-speed/');
  await page.waitForSelector('#vs-pick');
  await upload(page, '#vs-pick', ['clip.avi']);
  await page.waitForSelector('#vs-player video', { timeout: 30000 });
  await page.$eval('#vs-range', (e) => { e.value = '2'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await waitText(page, '#vs-val', /^4×$/);
  await page.click('#vs-go');
  await page.waitForSelector('#vs-result .result', { timeout: 240000 });
  await page.$eval('#vs-result .btn.lg', (e) => e.click());
  const name = await waitDownload(page);
  const info = probe(name);
  const d = Number(info.format.duration);
  assert(d > 1.5 && d < 2.6, `duration ${d}`); // 7.9 s at 4× is about 2 s
  assert(info.streams.some((s) => s.codec_type === 'audio'), 'audio kept');
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
  await clickSettled(page, '#as-srt');
  const srt = fs.readFileSync(outFile(await waitDownload(page, 1)), 'utf8');
  assert(/^1\n00:00:\d\d,\d{3} --> 00:00:\d\d,\d{3}\n/.test(srt), 'srt format');
  await clickSettled(page, '#as-burn');
  await page.waitForSelector('#as-burned .result', { timeout: 300000 });
  await clickSettled(page, '#as-burned .btn.lg');
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
  const fixed = new Date('2026-01-01T00:00:00Z');
  doc.setCreationDate(fixed); doc.setModificationDate(fixed); doc.setProducer('LocalKit tests'); doc.setCreator('LocalKit tests');
  const font = await doc.embedFont('Helvetica');
  for (let i = 1; i <= n; i++) {
    const pg = doc.addPage([300 + i * 10 + (label === 'B' ? 100 : 0), 400]);
    pg.drawText(`${label}${i}`, { x: 40, y: 200, size: 40, font });
  }
  const bytes = await doc.save();
  const dest = path.join(FIX, file);
  if (!fs.existsSync(dest) || !fs.readFileSync(dest).equals(bytes)) fs.writeFileSync(dest, bytes); // deterministic: no churn in git
}
if (!only || only.has('merge-pdf')) {
  await labelledPdf('lbl-a.pdf', 'A', 3);
  await labelledPdf('lbl-b.pdf', 'B', 3);
  fs.writeFileSync(path.join(FIX, 'broken.pdf'), 'this is definitely not a pdf file');
}
let pdfjsNode;
async function pageTexts(file) {
  pdfjsNode ||= await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsNode.getDocument({ data: new Uint8Array(fs.readFileSync(outFile(file))), isEvalSupported: false, standardFontDataUrl: path.join(ROOT, 'node_modules', 'pdfjs-dist', 'standard_fonts').split(path.sep).join('/') + '/' }).promise;
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
  fs.copyFileSync(outFile(f), outFile('annot-check.pdf'));
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

// Decodes a downloaded image to RGBA with ffmpeg: { w, h, px(x, y) → [r, g, b, a] }.
function rgbaOf(file) {
  const { width: w, height: h } = probe(file).streams[0];
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', outFile(file), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 });
  return { w, h, px: (x, y) => [...buf.subarray((y * w + x) * 4, (y * w + x) * 4 + 4)] };
}

await test('remove-background:general-transparent', async () => {
  const page = await open('/remove-background/');
  await page.select('#rb-engine', 'cpu'); // Exercise the real WASM backend even on a WebGPU machine.
  await upload(page, '#rb-pick', ['portrait.jpg']);
  await page.waitForSelector('#rb-grid .rb-view', { timeout: 600000 });
  await page.click('#rb-grid .actions .btn');
  const name = await waitDownload(page);
  assert(name === 'portrait-no-bg.png', name);
  const img = rgbaOf(name);
  assert(img.w === 640 && img.h === 800, `size ${img.w}x${img.h}`);
  const fx = (f) => Math.round(f * (img.w - 1)), fy = (f) => Math.round(f * (img.h - 1));
  // corners and the moon behind the astronaut are background; the face and the chest are the subject
  for (const [x, y] of [[0.03, 0.03], [0.97, 0.03], [0.03, 0.4], [0.2, 0.25]]) assert(img.px(fx(x), fy(y))[3] < 40, `background at ${x},${y} should be transparent: ${img.px(fx(x), fy(y))}`);
  for (const [x, y] of [[0.62, 0.3], [0.7, 0.62], [0.75, 0.85]]) assert(img.px(fx(x), fy(y))[3] > 240, `subject at ${x},${y} should be opaque: ${img.px(fx(x), fy(y))}`);
  const slider = await page.$('#rb-grid .rb-slider');
  assert(slider, 'before/after slider');
  return page;
});

await test('remove-background:modnet-blue-jpg-zh', async () => {
  const page = await open('/remove-background/', 'zh');
  await page.click('#rb-pick .sample');
  await page.waitForSelector('#rb-work:not([hidden])');
  await page.click('input[name="rb-m"][value="modnet"] + span');
  await page.click('input[name="rb-bg"][value="#438edb"] + span');
  await page.click('input[name="rb-f"][value="jpg"] + span');
  await page.waitForFunction(() => document.querySelectorAll('#rb-grid .rb-view').length === 1, { timeout: 300000 });
  await page.click('#rb-grid .actions .btn');
  const name = await waitDownload(page);
  assert(name === 'portrait-no-bg.jpg' && probe(name).streams[0].codec_name === 'mjpeg', name);
  const img = rgbaOf(name);
  const [r, g, b] = img.px(5, 5);
  assert(Math.abs(r - 0x43) < 12 && Math.abs(g - 0x8e) < 12 && Math.abs(b - 0xdb) < 12, `corner should be ID-photo blue: ${r},${g},${b}`);
  const [r2, g2, b2] = img.px(Math.round(img.w * 0.7), Math.round(img.h * 0.62));
  assert(r2 > 150 && g2 > 150, `suit should stay white-ish: ${r2},${g2},${b2}`);
  return page;
});

await test('remove-background:generated-batch-zip-cancel-mobile', async () => {
  const page = await open('/remove-background/', 'zh', 390);
  await upload(page, '#rb-pick', ['subject-bottle.png', 'portrait.jpg']);
  await page.waitForSelector('#rb-task button');
  await page.click('#rb-task button');
  await page.waitForSelector('#rb-retry:not([hidden])', { timeout: 10000 });
  await page.click('#rb-retry');
  await page.waitForFunction(() => document.querySelectorAll('#rb-grid .rb-view').length === 2, { timeout: 90000 });
  await page.click('#rb-grid .actions .btn');
  const name = await waitDownload(page);
  const img = rgbaOf(name);
  for (const [x, y] of [[5, 5], [500, 5], [5, 500], [500, 500]]) assert(img.px(x, y)[3] < 40, `generated background alpha: ${img.px(x, y)}`);
  assert(img.px(256, 256)[3] > 240, `generated subject alpha: ${img.px(256, 256)}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'background mobile overflow');
  await page.click('#rb-zip');
  const zipName = await waitDownload(page, 2);
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(outFile(zipName)));
  assert(zip.file('subject-bottle-no-bg.png') && zip.file('portrait-no-bg.png'), 'batch ZIP entries');
  return page;
});

// The old public Chinese traineddata includes eight legacy parameters that
// Tesseract 7 reports as warnings through console.error. Keep actual errors fatal.
function allowLegacyOcrWarnings(page) {
  page.errors = page.errors.filter(s => !/^Warning: Parameter not found: (language_model_ngram_on|segsearch_max_char_wh_ratio|language_model_ngram_space_delimited_language|language_model_use_sigmoidal_certainty|language_model_ngram_nonmatch_score|classify_integer_matcher_multiplier|assume_fixed_pitch_char_segment|allow_blob_division)$/.test(s));
}

await test('image-to-text:english-edit-copy-txt', async () => {
  const page = await open('/image-to-text/');
  const external = [];
  page.on('request', r => { if (r.url().startsWith('http') && new URL(r.url()).origin !== new URL(BASE).origin) external.push(r.url()); });
  await upload(page, '#ocr-pick', ['ocr-english.png']);
  await page.click('#ocr-go');
  await page.waitForSelector('#ocr-list .ocr-text:not([disabled])', { timeout: 90000 });
  const value = await page.$eval('#ocr-list .ocr-text', e => e.value);
  assert(/LOCAL TEXT 2026/.test(value) && /Private images stay on your device/.test(value), value);
  assert(Number(await page.$eval('.ocr-preview', e => e.dataset.boxes)) >= 2, 'line boxes');
  await page.$eval('#ocr-list .ocr-text', e => { e.value += '\nEdited result'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#ocr-list .actions .btn');
  const name = await waitDownload(page);
  assert(name === 'ocr-english.txt' && fs.readFileSync(outFile(name), 'utf8').includes('Edited result'), 'edited text download');
  await browser.defaultBrowserContext().overridePermissions(new URL(BASE).origin, ['clipboard-read', 'clipboard-write']);
  await page.click('#ocr-list .actions .btn:nth-child(2)');
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('Edited result'), 'copy text');
  assert(external.length === 0, `unexpected external OCR requests: ${external}`);
  allowLegacyOcrWarnings(page);
  return page;
});

await test('image-to-text:chinese-batch-paste-mobile', async () => {
  const page = await open('/image-to-text/', 'zh', 390);
  assert(await page.$eval('#ocr-lang', e => e.value) === 'chi_sim+eng', 'Chinese default');
  await page.evaluate(b64 => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const transfer = new DataTransfer(); transfer.items.add(new File([bytes], 'pasted-chinese.png', { type: 'image/png' }));
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true }));
  }, fs.readFileSync(fixture('ocr-chinese.png')).toString('base64'));
  await page.waitForSelector('#ocr-list .ocr-item');
  assert(await page.$$eval('#ocr-list .ocr-item', es => es.length) === 1, 'paste should add exactly one image');
  await upload(page, '#ocr-more', ['ocr-english.png']);
  await page.click('#ocr-go');
  await page.waitForFunction(() => document.querySelectorAll('#ocr-list .ocr-text:not([disabled])').length === 2, { timeout: 90000 });
  const values = await page.$$eval('#ocr-list .ocr-text', es => es.map(e => e.value));
  assert(values[0].replace(/\s/g, '').includes('图片文字识别') && values[0].replace(/\s/g, '').includes('你好世界'), values[0]);
  assert(values[1].includes('LOCAL TEXT 2026'), values[1]);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile overflow');
  await page.click('#ocr-download-all');
  const name = await waitDownload(page);
  const result = fs.readFileSync(outFile(name), 'utf8');
  assert(result.includes('pasted-chinese.png') && result.includes('ocr-english.png') && result.includes('你好世界'), result);
  allowLegacyOcrWarnings(page);
  return page;
});

await test('image-to-text:traditional-cancel-retry', async () => {
  const page = await open('/image-to-text/', 'zh');
  await page.select('#ocr-lang', 'chi_tra+eng');
  await upload(page, '#ocr-pick', ['ocr-traditional.png']);
  await page.click('#ocr-go');
  await page.click('#ocr-task button');
  await page.waitForFunction(() => !document.querySelector('#ocr-go').disabled, { timeout: 10000 });
  await page.click('#ocr-go');
  await page.waitForSelector('#ocr-list .ocr-text:not([disabled])', { timeout: 90000 });
  const value = await page.$eval('#ocr-list .ocr-text', e => e.value.replace(/\s/g, ''));
  assert(value.includes('圖片文字識別') && value.includes('歡迎使用本地工具'), value);
  allowLegacyOcrWarnings(page);
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

await test('convert-image:partial-failure-duplicate-names-and-retry', async () => {
  const page = await open('/convert-image/');
  const data = fs.readFileSync(fixture('sample.png')).toString('base64');
  await page.evaluate((encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const transfer = new DataTransfer();
    transfer.items.add(new File([bytes], 'same.png', { type: 'image/png' }));
    transfer.items.add(new File([bytes], 'same.png', { type: 'image/png' }));
    transfer.items.add(new File(['broken'], 'broken.png', { type: 'image/png' }));
    document.querySelector('#cm-pick .drop').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer }));
  }, data);
  await page.waitForFunction(() => document.querySelectorAll('#cm-grid .actions').length === 2 && document.querySelectorAll('#cm-grid .failed').length === 1);
  await page.click('#cm-zip');
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(outFile(await waitDownload(page))));
  assert(Object.keys(zip.files).length === 2, 'duplicate names both preserved');
  await page.click('#cm-clear');
  await upload(page, '#cm-pick', ['sample.png']);
  await page.waitForSelector('#cm-grid .actions');
  assert(await page.$$eval('#cm-grid .failed', (nodes) => nodes.length) === 0, 'clear and retry recovers');
  return page;
});

await test('resume-builder:reject-invalid-import-without-changing-draft', async () => {
  const page = await rvOpen('en', 'design');
  const before = await rvDoc(page);
  const count = await page.evaluate(() => window.__rv.store.docs.length);
  const requests = [];
  page.on('request', (request) => { if (request.url().startsWith('https://example.invalid')) requests.push(request.url()); });
  const invalid = [
    { localkitResume: 1, name: { invalid: true } },
    { localkitResume: 1, name: 'Remote', photo: 'https://example.invalid/photo.png' },
    { ...before, modules: [{ type: 'work', entries: 'not a list' }] },
    { ...before, photo: { src: 'https://example.invalid/photo.png', shape: 'square' } },
  ];
  for (const value of invalid) {
    await rvMenu(page, '#rv-docs', 'Import data');
    await page.evaluate((document) => {
      const input = window.document.querySelector('input[type=file][accept*=json]');
      const transfer = new DataTransfer();
      transfer.items.add(new File([JSON.stringify(document)], 'invalid-resume.json', { type: 'application/json' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change'));
    }, value);
    await sleep(350);
    assert(await page.evaluate(() => window.__rv.store.docs.length) === count, 'invalid import added a draft');
    assert(JSON.stringify(await rvDoc(page)) === JSON.stringify(before), 'existing draft changed');
  }
  assert(requests.length === 0, 'remote photo was fetched');
  return page;
});

await browser.close();
const failed = results.filter(([, result]) => result !== 'PASS').length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
