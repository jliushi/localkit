import { url, absUrl, REPO_URL } from '../site.config.mjs';
import { COMMON } from '../src/common-strings.mjs';
import { html, raw, jsonScript } from './html.mjs';
import { icon } from './icons.mjs';

export const CATEGORY_ORDER = ['video', 'pdf', 'image', 'docs'];
export const CATEGORY_ICON = { video: 'clapperboard', pdf: 'file-text', image: 'image', docs: 'files' };

/** Tools grouped by category, for the menu and the footer directory. */
function directory(tools, lang) {
  return CATEGORY_ORDER.map((cat) => [cat, tools.filter((t) => t.category === cat)]).filter(([, ts]) => ts.length)
    .map(([cat, ts]) => ({ cat, label: COMMON[lang].categories[cat], tools: ts.map((t) => ({ id: t.id, name: t.strings[lang].name, iconName: t.iconName, color: t.color })) }));
}

/**
 * opts: { lang, path (e.g. "/compress-video/"), title, description, body, tools, v,
 *         jsonLd?, script?, clientData?, noindex?, ogImage? }
 */
export function layout(opts) {
  const { lang, path, v, tools } = opts;
  const c = COMMON[lang];
  const other = c.otherLangCode;
  const self = `/${lang}${path}`;
  const dir = directory(tools, lang);
  const og = opts.ogImage || `/assets/og/home-${lang}.jpg`;
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
<meta property="og:locale" content="${lang === 'zh' ? 'zh_CN' : 'en_US'}">
<meta property="og:title" content="${opts.ogTitle || opts.title}">
<meta property="og:description" content="${opts.description}">
<meta property="og:url" content="${absUrl(self)}">
<meta property="og:image" content="${absUrl(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${url('/assets/icon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${url('/assets/icon-180.png')}">
<link rel="stylesheet" href="${url(`/assets/style.css?v=${v}`)}">
${opts.jsonLd ? html`<script type="application/ld+json">${jsonScript(opts.jsonLd)}</script>` : ''}
</head>
<body>
<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="${url(`/${lang}/`)}"><img src="${url('/assets/icon.svg')}" width="30" height="30" alt="">${c.siteName}</a>
    <nav class="nav" aria-label="${c.allTools}">
      <details class="menu">
        <summary>${icon('layout-grid')}<span>${c.allTools}</span></summary>
        <div class="menu-panel">
          ${dir.map((g) => html`<div><h4>${g.label}</h4>${g.tools.map((t) => html`<a href="${url(`/${lang}/${t.id}/`)}" style="--tc:${t.color}">${icon(t.iconName)}${t.name}</a>`)}</div>`)}
        </div>
      </details>
      <a class="lang" href="${url(`/${other}${path}`)}" hreflang="${other === 'zh' ? 'zh-CN' : 'en'}" lang="${other === 'zh' ? 'zh-CN' : 'en'}" data-lang="${other}">${icon('languages')}<span>${c.otherLang}</span></a>
    </nav>
  </div>
</header>
<main class="wrap" id="main">
${opts.body}
</main>
<footer class="foot">
  <div class="wrap foot-inner">
    <div class="foot-dir">
      ${dir.map((g) => html`<div><h4>${g.label}</h4>${g.tools.map((t) => html`<a href="${url(`/${lang}/${t.id}/`)}">${t.name}</a>`)}</div>`)}
    </div>
    <div class="foot-bottom">
      <span>${c.footerNote}</span>
      <nav><a href="${url(`/${lang}/about/`)}">${c.about}</a><a href="${url(`/${lang}/privacy/`)}">${c.privacy}</a><a href="${REPO_URL}">${c.source}</a><a href="${url(`/${other}${path}`)}" data-lang="${other}">${c.otherLang}</a></nav>
    </div>
  </div>
</footer>
${opts.clientData ? html`<script type="application/json" id="lk-data">${jsonScript(opts.clientData)}</script>` : ''}
<script type="module" src="${url(`/assets/js/common.js?v=${v}`)}"></script>
${opts.script ? html`<script type="module" src="${url(`/assets/js/${opts.script}.js?v=${v}`)}"></script>` : ''}
</body>
</html>`}
`;
}
