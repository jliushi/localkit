// Builds the static site into dist/.
//   node build/build.mjs            production build (minified)
//   node build/build.mjs --dev      readable bundles
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { LANGS, url, absUrl } from '../site.config.mjs';
import { COMMON } from '../src/common-strings.mjs';
import { html } from './html.mjs';
import { layout } from './layout.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DEV = process.argv.includes('--dev');
const CATEGORY_ORDER = ['ai', 'pdf', 'image', 'video', 'docs', 'text'];

// Tool order on the home page.
const TOOL_ORDER = ['ai-subtitles', 'pdf-merge', 'pdf-split', 'pdf-organize', 'pdf-edit', 'scan-to-pdf', 'pdf-to-images',
  'image-converter', 'video-converter', 'video-trim', 'extract-audio', 'resume-builder', 'text-diff', 'base64'];

async function loadTools() {
  const dir = path.join(ROOT, 'src', 'tools');
  const tools = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.mjs'))) {
    tools.push((await import(pathToFileURL(path.join(dir, f)).href)).default);
  }
  return tools.sort((a, b) => TOOL_ORDER.indexOf(a.id) - TOOL_ORDER.indexOf(b.id));
}

function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copy(src, rel) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.copyFileSync(src, file);
}

const icon = (tool) => html`<span class="ticon" style="--c:${tool.color}" aria-hidden="true">${tool.icon}</span>`;

function toolCard(tool, lang) {
  const s = tool.strings[lang];
  return html`<a class="tcard" href="${url(`/${lang}/${tool.id}/`)}">${icon(tool)}<span><strong>${s.name}</strong><small>${s.lead.split(/(?<=[.。])\s?/)[0]}</small></span></a>`;
}

function toolPage(tool, lang, tools, v) {
  const s = tool.strings[lang];
  const c = COMMON[lang];
  const related = [
    ...tools.filter((x) => x !== tool && x.category === tool.category),
    ...tools.filter((x) => x !== tool && x.category !== tool.category),
  ].slice(0, 6);
  const body = html`
<nav class="crumbs"><a href="${url(`/${lang}/`)}">${c.siteName}</a><span>›</span><span>${c.categories[tool.category]}</span></nav>
<header class="tool-head">
  ${icon(tool)}
  <div><h1>${s.h1}</h1><p class="lead">${s.lead}</p>
  <ul class="badges">${c.badges.map((b) => html`<li>✓ ${b}</li>`)}</ul></div>
</header>
<section class="tool" id="tool">
${tool.ui(s.ui, c, lang)}
</section>
<div class="info-cols">
<section>
  <h2>${c.howTo}</h2>
  <ol class="steps">${s.steps.map((x) => html`<li>${x}</li>`)}</ol>
</section>
<section>
  <h2>${c.faq}</h2>
  ${s.faq.map(([q, a]) => html`<details class="faq"><summary>${q}</summary><p>${a}</p></details>`)}
</section>
</div>
<section>
  <h2>${c.related}</h2>
  <div class="tgrid small">${related.map((x) => toolCard(x, lang))}</div>
</section>`;
  return layout({
    lang, v, path: `/${tool.id}/`, title: s.title, description: s.desc, body, script: tool.id,
    clientData: { lang, s: s.ui, c: Object.fromEntries(Object.entries(c).filter(([, val]) => typeof val === 'string')), base: url('') },
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: s.name, url: absUrl(`/${lang}/${tool.id}/`), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: s.desc, inLanguage: lang === 'zh' ? 'zh-CN' : 'en' },
        { '@type': 'FAQPage', mainEntity: s.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      ],
    },
  });
}

function homePage(lang, tools, v) {
  const c = COMMON[lang];
  const cats = CATEGORY_ORDER.map((cat) => [cat, tools.filter((t) => t.category === cat)]).filter(([, ts]) => ts.length);
  const body = html`
<section class="hero">
  <h1>${c.homeH1}</h1>
  <p class="lead">${c.homeLead}</p>
  <ul class="badges">${c.badges.map((b) => html`<li>✓ ${b}</li>`)}</ul>
</section>
${cats.map(([cat, ts]) => html`<section><h2>${c.categories[cat]}</h2><div class="tgrid">${ts.map((t) => toolCard(t, lang))}</div></section>`)}`;
  return layout({
    lang, v, path: '/', title: c.homeTitle, description: c.homeDesc, body,
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: c.siteName, url: absUrl(`/${lang}/`), inLanguage: lang === 'zh' ? 'zh-CN' : 'en' },
  });
}

function privacyPage(lang, v) {
  const c = COMMON[lang];
  const en = html`
<h1>${c.privacyTitle}</h1>
<p class="lead">LocalKit has no accounts, no cookies, no analytics and no advertising trackers. Files you open in a tool are processed by JavaScript and WebAssembly inside your browser and are never uploaded.</p>
<ul class="prose">
  <li><strong>Hosting.</strong> The site is static and hosted on GitHub Pages. GitHub receives your IP address when you load a page, as any web host does (<a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">GitHub Privacy Statement</a>).</li>
  <li><strong>AI subtitles.</strong> The speech-recognition model is downloaded once from Hugging Face (or its mirror hf-mirror.com when Hugging Face is unreachable) and cached by your browser. Only the model files are downloaded; your audio is never sent.</li>
  <li><strong>Local storage.</strong> The resume builder saves your draft in your browser's local storage so you don't lose it; it never leaves your device and you can clear it at any time. The site also remembers your language choice.</li>
</ul>
<p>Questions: <a href="https://github.com/jliushi/localkit/issues">open an issue on GitHub</a>.</p>`;
  const zh = html`
<h1>${c.privacyTitle}</h1>
<p class="lead">LocalKit 没有账号、没有 Cookie、没有统计分析，也没有广告追踪。你在工具中打开的文件由浏览器里的 JavaScript 和 WebAssembly 处理，绝不会被上传。</p>
<ul class="prose">
  <li><strong>托管。</strong>本站是静态网站，托管在 GitHub Pages。和任何网站托管一样，GitHub 会在你访问页面时收到你的 IP 地址（见 <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">GitHub 隐私声明</a>）。</li>
  <li><strong>AI 字幕。</strong>语音识别模型会从 Hugging Face（无法访问时改用镜像 hf-mirror.com）下载一次并由浏览器缓存。只下载模型文件，你的音频绝不会被发送。</li>
  <li><strong>本地存储。</strong>简历制作工具会把草稿保存在浏览器本地存储中，防止丢失；它不会离开你的设备，你可以随时清除。网站还会记住你选择的语言。</li>
</ul>
<p>如有疑问：<a href="https://github.com/jliushi/localkit/issues">在 GitHub 提交 issue</a>。</p>`;
  return layout({ lang, v, path: '/privacy/', title: `${c.privacyTitle} | ${c.siteName}`, description: c.privacyDesc, body: lang === 'zh' ? zh : en });
}

function rootPage() {
  // Sends visitors to their language; crawlers and no-JS visitors get links.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>LocalKit — Free online tools / 免费在线工具</title>
<meta name="description" content="${COMMON.en.homeDesc}">
<link rel="canonical" href="${absUrl('/en/')}">
<link rel="alternate" hreflang="en" href="${absUrl('/en/')}"><link rel="alternate" hreflang="zh-CN" href="${absUrl('/zh/')}"><link rel="alternate" hreflang="x-default" href="${absUrl('/en/')}">
<script>
(function () {
  var saved = null;
  try { saved = localStorage.getItem('lk-lang'); } catch (e) {}
  var langs = navigator.languages || [navigator.language || ''];
  var zh = saved ? saved === 'zh' : /^zh/i.test(langs[0] || '');
  location.replace('${url('')}/' + (zh ? 'zh' : 'en') + '/' + location.search);
})();
</script>
<style>body{font:16px system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 16px}</style>
</head><body><h1>LocalKit</h1><p><a href="${url('/en/')}">English</a> · <a href="${url('/zh/')}">中文</a></p></body></html>
`;
}

function notFoundPage(v) {
  const body = html`<h1>Page not found · 页面不存在</h1><p><a href="${url('/en/')}">All tools</a> · <a href="${url('/zh/')}">全部工具</a></p>`;
  return layout({ lang: 'en', v, path: '/404.html', title: 'Page not found | LocalKit', description: 'Page not found', body, noindex: true });
}

async function bundle(tools) {
  const entryPoints = {
    common: path.join(ROOT, 'src/client/common.js'),
    // ffmpeg.wasm's own worker, loaded via classWorkerURL (esbuild doesn't rewrite new URL('./worker.js')).
    'ffmpeg-worker': path.join(ROOT, 'node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js'),
    ...Object.fromEntries(tools.map((t) => [t.id, path.join(ROOT, 'src/client', `${t.id}.js`)])),
  };
  for (const extra of fs.readdirSync(path.join(ROOT, 'src/client')).filter((f) => f.endsWith('.worker.js'))) {
    entryPoints[extra.replace(/\.js$/, '')] = path.join(ROOT, 'src/client', extra);
  }
  await esbuild.build({
    entryPoints,
    outdir: path.join(DIST, 'assets/js'),
    bundle: true,
    format: 'esm',
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    minify: !DEV,
    sourcemap: false,
    target: ['es2022'],
    logLevel: 'warning',
    define: { 'process.env.NODE_ENV': '"production"' },
    // Node-only modules referenced by some libraries' Node code paths.
    external: ['fs', 'path', 'url', 'sharp', 'onnxruntime-node', 'node:*'],
  });
}

function vendor() {
  const nm = path.join(ROOT, 'node_modules');
  // ONNX Runtime WebAssembly for the speech model (loaded on demand by transformers.js).
  for (const f of ['ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
    copy(path.join(nm, 'onnxruntime-web/dist', f), `vendor/ort/${f}`);
  }
  // ffmpeg.wasm core (single-threaded build: works without cross-origin isolation).
  for (const f of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) copy(path.join(nm, '@ffmpeg/core/dist/esm', f), `vendor/ffmpeg/${f}`);
  // pdf.js worker.
  copy(path.join(nm, 'pdfjs-dist/build/pdf.worker.min.mjs'), 'vendor/pdfjs/pdf.worker.min.mjs');
}

async function main() {
  const started = Date.now();
  const tools = await loadTools();
  fs.rmSync(DIST, { recursive: true, force: true });
  await bundle(tools);
  vendor();
  const hash = crypto.createHash('sha256');
  for (const f of fs.readdirSync(path.join(ROOT, 'src/assets')).sort()) {
    const buf = fs.readFileSync(path.join(ROOT, 'src/assets', f));
    hash.update(buf);
    write(`assets/${f}`, buf);
  }
  for (const f of fs.readdirSync(path.join(DIST, 'assets/js')).filter((f) => f.endsWith('.js'))) hash.update(fs.readFileSync(path.join(DIST, 'assets/js', f)));
  const v = hash.digest('hex').slice(0, 10);

  const urls = [];
  for (const lang of LANGS) {
    write(`${lang}/index.html`, homePage(lang, tools, v));
    write(`${lang}/privacy/index.html`, privacyPage(lang, v));
    urls.push(`/${lang}/`, `/${lang}/privacy/`);
    for (const tool of tools) {
      write(`${lang}/${tool.id}/index.html`, toolPage(tool, lang, tools, v));
      urls.push(`/${lang}/${tool.id}/`);
    }
  }
  write('index.html', rootPage());
  write('404.html', notFoundPage(v));
  write('.nojekyll', '');
  const today = new Date().toISOString().slice(0, 10);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => {
    const rest = u.replace(/^\/(en|zh)/, '');
    return `<url><loc>${absUrl(u)}</loc><lastmod>${today}</lastmod><xhtml:link rel="alternate" hreflang="en" href="${absUrl(`/en${rest}`)}"/><xhtml:link rel="alternate" hreflang="zh-CN" href="${absUrl(`/zh${rest}`)}"/></url>`;
  }).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absUrl('/sitemap.xml')}\n`);
  console.log(`Built ${urls.length} pages, ${tools.length} tools in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

