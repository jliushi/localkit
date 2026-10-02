// Deterministic, locally rendered fixtures; no remote images or fonts.
import fs from 'node:fs';
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  for (const [name, lines] of [
    ['ocr-english', ['LOCAL TEXT 2026', 'Private images stay on your device.']],
    ['ocr-chinese', ['图片文字识别', '你好世界 2026', 'LocalKit']],
    ['ocr-traditional', ['圖片文字識別', '歡迎使用本地工具', 'LocalKit 2026']],
    ['ocr', ['LocalKit 2026', '图片文字识别', 'Private images stay on your device.']],
  ]) {
    const image = await page.evaluate(lines => {
      const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 360;
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#171717'; ctx.font = '46px "Microsoft YaHei", Arial, sans-serif';
      lines.forEach((line, i) => ctx.fillText(line, 60, 85 + i * 100));
      return cv.toDataURL('image/png').split(',')[1];
    }, lines);
    fs.writeFileSync(`test/fixtures/${name}.png`, Buffer.from(image, 'base64'));
    if (name === 'ocr') fs.copyFileSync(`test/fixtures/${name}.png`, 'src/assets/samples/ocr.png');
  }
  const bottle = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#eef3f7'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#333'; ctx.fillRect(221, 55, 70, 46);
    const fill = ctx.createLinearGradient(155, 0, 350, 0); fill.addColorStop(0, '#ae1d19'); fill.addColorStop(.4, '#ff7664'); fill.addColorStop(1, '#a51b16');
    ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(162, 95, 188, 355, 48); ctx.fill();
    ctx.fillStyle = '#fff6df'; ctx.fillRect(174, 214, 164, 116); ctx.fillStyle = '#902520'; ctx.font = 'bold 26px Arial'; ctx.fillText('LOCAL', 210, 263); ctx.fillText('SOAP', 217, 298);
    return cv.toDataURL('image/png').split(',')[1];
  });
  fs.writeFileSync('test/fixtures/subject-bottle.png', Buffer.from(bottle, 'base64'));
} finally { await browser.close(); }
