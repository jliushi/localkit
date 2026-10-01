// Notifies IndexNow search engines (Bing, Yandex, Seznam, Naver…) about every URL in dist/urls.txt.
// Run after a deploy:  node scripts/indexnow.mjs
import fs from 'node:fs';
import { SITE_ORIGIN, BASE_PATH, INDEXNOW_KEY } from '../site.config.mjs';

const urlList = fs.readFileSync(new URL('../dist/urls.txt', import.meta.url), 'utf8').split('\n').filter(Boolean);
const body = {
  host: new URL(SITE_ORIGIN).host,
  key: INDEXNOW_KEY,
  keyLocation: `${SITE_ORIGIN}${BASE_PATH}/${INDEXNOW_KEY}.txt`,
  urlList,
};
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`IndexNow: ${urlList.length} URLs → HTTP ${res.status} ${await res.text()}`);
if (res.status >= 400 && res.status !== 429) process.exit(1);
