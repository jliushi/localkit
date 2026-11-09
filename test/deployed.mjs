import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BASE_PATH } from '../site.config.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const base = (process.env.BASE_URL || 'https://jliushi.github.io/localkit').replace(/\/$/, '');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = (relative) => fs.readFileSync(path.join(dist, relative));
const locations = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname.slice(BASE_PATH.length));
const expected = locations(read('sitemap.xml').toString());
assert.ok(expected.length > 0, 'built sitemap has pages');
const request = async (relative) => {
  const response = await fetch(`${base}/${relative.replace(/^\//, '')}`, { signal: AbortSignal.timeout(45000) });
  assert.equal(response.status, 200, `${relative}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};
assert.deepEqual(locations((await request('sitemap.xml')).toString()), expected, 'deployed sitemap matches this release');

const checks = expected.map((relative) => async () => {
  const html = (await request(relative)).toString();
  const local = read(path.join(relative, 'index.html')).toString();
  assert.equal(html.match(/<title>(.*?)<\/title>/s)?.[1], local.match(/<title>(.*?)<\/title>/s)?.[1], `${relative}: title`);
  assert.equal(html.match(/<link rel="canonical"[^>]+>/)?.[0], local.match(/<link rel="canonical"[^>]+>/)?.[0], `${relative}: canonical`);
});
let redirects = 0;
for (const language of ['en', 'zh']) {
  for (const directory of fs.readdirSync(path.join(dist, language), { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const relative = `${language}/${directory.name}/index.html`;
    if (!fs.existsSync(path.join(dist, relative))) continue;
    const html = read(relative).toString();
    if (!html.includes('http-equiv="refresh"')) continue;
    redirects++;
    checks.push(async () => {
      const deployed = (await request(`${language}/${directory.name}/`)).toString();
      assert.equal(deployed.match(/http-equiv="refresh"[^>]+/)?.[0], html.match(/http-equiv="refresh"[^>]+/)?.[0], `${relative}: legacy redirect`);
    });
  }
}
const assets = ['assets/style.css'];
const walk = (relative) => {
  for (const entry of fs.readdirSync(path.join(dist, relative), { withFileTypes: true })) {
    const next = `${relative}/${entry.name}`;
    if (entry.isDirectory()) walk(next);
    else assets.push(next);
  }
};
walk('assets/js');
walk('assets/og');
for (const relative of assets) checks.push(async () => assert.equal(digest(await request(relative)), digest(read(relative)), `${relative}: deployed SHA-256 differs`));
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < checks.length) await checks[cursor++]();
}));
const missing = await fetch(`${base}/acceptance-missing-page/`, { signal: AbortSignal.timeout(30000) });
assert.equal(missing.status, 404, 'unknown page returns HTTP 404');
console.log(`Deployed release verified: ${expected.length} pages, ${redirects} legacy redirects, ${assets.length} asset hashes and HTTP 404`);
console.log(base);
