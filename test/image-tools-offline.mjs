import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
const base = process.env.BASE_URL || 'http://localhost:8092/localkit';
try {
  for (const tool of ['remove-background', 'image-to-text']) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.goto(`${base}/en/${tool}/`, { waitUntil: 'networkidle0' });
    const rb = tool === 'remove-background';
    await page.setOfflineMode(true);
    await (await page.$(`${rb ? '#rb-pick' : '#ocr-pick'} input`)).uploadFile(rb ? 'test/fixtures/subject-bottle.png' : 'test/fixtures/ocr-english.png');
    if (!rb) await page.click('#ocr-go');
    await page.waitForSelector(rb ? '#rb-grid .failed' : '#ocr-alert .alert', { timeout: 15000 });
    console.log(`${tool}: cold offline failure is visible and does not hang`);
    await page.setOfflineMode(false);
    await page.click(rb ? '#rb-retry' : '#ocr-go');
    await page.waitForSelector(rb ? '.rb-view' : '#ocr-list .ocr-text:not([disabled])', { timeout: 60000 });
    await page.setOfflineMode(true);
    await (await page.$(`${rb ? '#rb-more' : '#ocr-more'} input`)).uploadFile(rb ? 'test/fixtures/subject-bottle.png' : 'test/fixtures/ocr-english.png');
    if (!rb) await page.click('#ocr-go');
    await page.waitForFunction(selector => document.querySelectorAll(selector).length === 2, { timeout: 60000 }, rb ? '.rb-view' : '#ocr-list .ocr-text:not([disabled])');
    console.log(`${tool}: retry succeeds; a second image works offline with loaded model`);
    await context.close();
  }
} finally { await browser.close(); }
