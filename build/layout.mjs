import { url, absUrl, REPO_URL } from '../site.config.mjs';
import { COMMON } from '../src/common-strings.mjs';
import { html, raw, jsonScript } from './html.mjs';

/**
 * opts: { lang, path (without the /en or /zh prefix, e.g. "/base64/"), title, description, body,
 *         jsonLd?, script? (bundle name), clientData?, noindex?, v (asset version) }
 */
export function layout(opts) {
  const { lang, path, v } = opts;
  const c = COMMON[lang];
  const other = lang === 'en' ? 'zh' : 'en';
  const self = `/${lang}${path}`;
  const ld = opts.jsonLd ? jsonScript(opts.jsonLd) : null;
  return `<!doctype html>
${html`<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${opts.title}</title>
<meta name="description" content="${opts.description}">
${opts.noindex ? raw('<meta name="robots" content="noindex">') : html`<link rel="canonical" href="${absUrl(self)}">
<link rel="alternate" hreflang="en" href="${absUrl(`/en${path}`)}">
<link rel="alternate" hreflang="zh-CN" href="${absUrl(`/zh${path}`)}">
<link rel="alternate" hreflang="x-default" href="${absUrl(`/en${path}`)}">`}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#0f766e">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${c.siteName}">
<meta property="og:title" content="${opts.title}">
<meta property="og:description" content="${opts.description}">
<meta property="og:url" content="${absUrl(self)}">
<meta property="og:image" content="${absUrl(`/assets/og-${lang}.png`)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${url('/assets/icon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${url('/assets/icon-180.png')}">
<link rel="stylesheet" href="${url(`/assets/style.css?v=${v}`)}">
${ld ? html`<script type="application/ld+json">${ld}</script>` : ''}
</head>
<body>
<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="${url(`/${lang}/`)}"><img src="${url('/assets/icon.svg')}" width="28" height="28" alt=""><span>${c.siteName}</span></a>
    <span class="badge-privacy">🔒 ${c.privacyBadge}</span>
    <nav class="nav">
      <a href="${url(`/${lang}/`)}">${c.allTools}</a>
      <a class="lang" href="${url(`/${other}${path}`)}" hreflang="${other === 'zh' ? 'zh-CN' : 'en'}" lang="${other === 'zh' ? 'zh-CN' : 'en'}" data-lang="${other}">${c.otherLang}</a>
    </nav>
  </div>
</header>
<main class="wrap" id="main">
${opts.body}
</main>
<footer class="foot">
  <div class="wrap foot-inner">
    <p>${c.footer}</p>
    <p class="foot-links"><a href="${url(`/${lang}/privacy/`)}">${c.privacy}</a><a href="${REPO_URL}">${c.source}</a><a href="${url(`/${other}${path}`)}" data-lang="${other}">${c.otherLang}</a></p>
  </div>
</footer>
${opts.clientData ? html`<script type="application/json" id="lk-data">${jsonScript(opts.clientData)}</script>` : ''}
<script type="module" src="${url(`/assets/js/common.js?v=${v}`)}"></script>
${opts.script ? html`<script type="module" src="${url(`/assets/js/${opts.script}.js?v=${v}`)}"></script>` : ''}
</body>
</html>`}
`;
}
