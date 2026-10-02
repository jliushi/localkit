// Checks the actual static release, including links and share images that browser load tests miss.
// Run after building: node test/site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';
import { BASE_PATH, SITE_ORIGIN, LANGS, absUrl, INDEXNOW_KEY } from '../site.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const problems = [];
const check = (ok, message) => { if (!ok) problems.push(message); };
const read = (rel) => fs.readFileSync(path.join(dist, rel), 'utf8');
// CSS is copied rather than bundled. An unclosed media query can silently disable all later desktop styles.
try {
  const css = transformSync(read('assets/style.css'), { loader: 'css', logLevel: 'silent' });
  for (const warning of css.warnings) problems.push(`style.css:${warning.location?.line}: ${warning.text}`);
} catch (error) { problems.push(`style.css: ${error.message}`); }
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
const tools = await Promise.all(fs.readdirSync(path.join(root, 'src/tools')).filter((f) => f.endsWith('.mjs'))
  .map(async (f) => (await import(pathToFileURL(path.join(root, 'src/tools', f)).href)).default));
const expected = LANGS.flatMap((lang) => ['', ...tools.map((t) => `${t.id}/`), 'about/', 'privacy/'].map((p) => absUrl(`/${lang}/${p}`)));
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
check(urls.length === expected.length, `sitemap: expected ${expected.length} URLs, got ${urls.length}`);
check(new Set(urls).size === urls.length, 'sitemap: duplicate URLs');
for (const url of expected) check(urls.includes(url), `sitemap: missing ${url}`);
check(read('robots.txt').includes(`Sitemap: ${absUrl('/sitemap.xml')}`), 'robots.txt: missing sitemap');
check(read(`${INDEXNOW_KEY}.txt`).trim() === INDEXNOW_KEY, 'IndexNow key file mismatch');
const llms = read('llms.txt');
check(llms.includes(`collection of ${tools.length} free online tools`), 'llms.txt: stale tool count');
check(read('urls.txt').trim().split(/\r?\n/).sort().join('\n') === [...expected].sort().join('\n'), 'urls.txt: does not match sitemap');
const checkedAssets = new Set();
function localFile(href, from) {
  let parsed;
  try { parsed = new URL(href, from); } catch { return; }
  if (parsed.origin !== SITE_ORIGIN || !parsed.pathname.startsWith(`${BASE_PATH}/`)) return;
  const rel = decodeURIComponent(parsed.pathname.slice(BASE_PATH.length + 1));
  if (checkedAssets.has(rel)) return;
  checkedAssets.add(rel);
  const target = path.join(dist, rel.endsWith('/') ? `${rel}index.html` : rel);
  check(fs.existsSync(target), `${from}: missing local resource ${parsed.pathname}`);
}
const titles = new Set();
for (const pageUrl of expected) {
  const rel = new URL(pageUrl).pathname.slice(BASE_PATH.length + 1);
  const document = read(`${rel}index.html`);
  const tags = [...document.matchAll(/<(?:link|meta|a|script|img)\b[^>]*>/g)].map((m) => attrs(m[0]));
  const canonicals = tags.filter((a) => a.rel === 'canonical');
  check(canonicals.length === 1 && canonicals[0].href === pageUrl, `${rel}: wrong canonical`);
  const suffix = rel.replace(/^(en|zh)\//, '');
  const alternates = tags.filter((a) => a.rel === 'alternate');
  for (const [code, lang] of [['en', 'en'], ['zh-CN', 'zh'], ['x-default', 'en']]) {
    check(alternates.some((a) => a.hreflang === code && a.href === absUrl(`/${lang}/${suffix}`)), `${rel}: missing ${code} alternate`);
  }
  check((document.match(/<h1\s*[^>]*>/g) || []).length === 1, `${rel}: expected one H1`);
  check(!/<meta[^>]+name="robots"[^>]+noindex/.test(document), `${rel}: unexpected noindex`);
  const title = document.match(/<title>(.*?)<\/title>/)?.[1];
  check(title && !titles.has(title), `${rel}: missing or duplicate title`);
  titles.add(title);
  const desc = tags.find((a) => a.name === 'description')?.content;
  check(desc && desc.length >= 40, `${rel}: missing/short description`);
  const og = tags.find((a) => a.property === 'og:image')?.content;
  check(og, `${rel}: missing Open Graph image`);
  if (og) localFile(og, pageUrl);
  for (const tag of tags) for (const key of ['href', 'src']) if (tag[key]) localFile(tag[key], pageUrl);
  const tool = tools.find((t) => suffix === `${t.id}/`);
  if (!tool) continue;
  let schema;
  try { schema = JSON.parse(document.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]); }
  catch { problems.push(`${rel}: invalid JSON-LD`); }
  const graph = schema?.['@graph'] || [];
  for (const type of ['WebApplication', 'HowTo', 'FAQPage', 'BreadcrumbList']) check(graph.some((n) => n['@type'] === type), `${rel}: missing ${type}`);
  check(graph.find((n) => n['@type'] === 'WebApplication')?.url === pageUrl, `${rel}: wrong app URL`);
  const lang = rel.split('/')[0];
  const s = tool.strings[lang];
  const [minDesc, maxDesc] = lang === 'en' ? [120, 160] : [70, 110];
  check(s.desc.length >= minDesc && s.desc.length <= maxDesc, `${rel}: description length ${s.desc.length} outside ${minDesc}–${maxDesc}`);
  check(s.faq.length >= 5, `${rel}: fewer than five FAQ entries`);
  check(graph.find((n) => n['@type'] === 'FAQPage')?.mainEntity?.length === s.faq.length, `${rel}: FAQ schema/content mismatch`);
  check(llms.includes(pageUrl), `llms.txt: missing ${pageUrl}`);
}
console.log(`${tools.length} tools, ${expected.length} bilingual pages, ${checkedAssets.size} local resources checked`);
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log('Static release audit passed');
