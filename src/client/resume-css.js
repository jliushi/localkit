// Sheet styles for all resume templates (injected as <style> and inlined into image exports).
export const RV_CSS = `
.rv-sheet{--ink:#1f2933;--mute:#5d6975;--line:#d8dde2;--tint:color-mix(in srgb,var(--ac) 10%,#fff);--pw:88px;--pr:1;
 box-sizing:border-box;width:794px;min-height:1123px;position:relative;background:#fff;color:var(--ink);font:var(--fs)/var(--lh) var(--font);overflow-wrap:anywhere;word-break:normal;
 -webkit-print-color-adjust:exact;print-color-adjust:exact;text-align:left}
.rv-sheet *{box-sizing:border-box}
.rv-sheet h1,.rv-sheet h2{margin:0;font-weight:inherit}
.lay-single{padding:var(--mg)}
.rv-sheet button{font:inherit}
.rv-sheet .f{display:inline}
.rv-sheet .rv-desc,.rv-sheet .rv-desc.f{display:block}
.rv-brk{display:block;height:0;pointer-events:none}
.rv-sheet svg.ic,.rv-sheet svg.rv-ci,.rv-sheet svg.rv-mi{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.rv-sheet :where(svg.rv-mi,svg.rv-ci){display:none}
/* modules & entries */
.rv-mod{margin-top:var(--gap);position:relative}
.rv-flow>.rv-mod:first-child,.rv-mainc>.rv-mod:first-of-type{margin-top:0}
.rv-mh{margin:0 0 .5em;font-size:1.12em;line-height:1.3;font-weight:700;color:var(--ac)}
.rv-entry{position:relative;margin-top:var(--egap)}
.rv-mb>.rv-entry:first-child{margin-top:0}
.rv-eh{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:.75em}
.rv-t{font-weight:700}
.rv-r{color:var(--mute)}
.rv-d{margin-left:auto;color:var(--mute);font-size:.94em;white-space:nowrap;font-variant-numeric:tabular-nums}
.rv-d i{font-style:normal}
.rv-desc{margin-top:.18em}
.rv-desc p{margin:.1em 0}
.rv-desc ul,.rv-desc ol{margin:0;padding-left:1.3em}
.rv-desc li{margin:.1em 0;padding-left:.1em}
.rv-desc li::marker{color:var(--ac)}
.rv-desc a{color:var(--ac);text-decoration:underline}
.rv-text{margin-top:0}
.rv-tags{display:flex;flex-wrap:wrap;gap:.4em .5em}
.rv-tag{display:inline-block;padding:.08em .7em;border-radius:99px;background:var(--tint);font-size:.95em}
.rv-tags.plain .rv-tag{background:none;padding:0;border-radius:0}
.rv-tags.plain .rv-tag:not(:last-child)::after{content:' · ';color:var(--mute);white-space:pre}
.rv-inline{color:var(--ink)}
.rv-inline i{font-style:normal;color:var(--mute)}
.rv-bars .rv-bar{display:grid;grid-template-columns:7em 1fr;align-items:center;gap:.7em;margin:.28em 0}
.rv-lv{display:block;height:.42em;border-radius:9px;background:color-mix(in srgb,currentColor 16%,transparent);overflow:hidden}
.rv-lv b{display:block;height:100%;border-radius:9px;background:var(--ac)}
.rv-rows .rv-row{display:flex;align-items:baseline;gap:.8em;margin:.18em 0}
.rv-rd{margin-left:auto;color:var(--mute);font-size:.94em;white-space:nowrap}
.rv-photo{width:var(--pw);height:calc(var(--pw)*var(--pr));flex:none;overflow:hidden;background:#e6e9ed;border-radius:6px}
.rv-photo img{display:block;width:100%;height:100%;object-fit:cover}
.rv-photo.shape-portrait{--pr:1.5;border-radius:4px}
.rv-photo.shape-circle{border-radius:50%}
.rv-photo.empty{background:none;color:var(--mute);display:flex;align-items:center;justify-content:center;font-size:.9em;border:1px dashed var(--line)}
.rv-head{margin-bottom:var(--gap)}
.rv-name{font-size:2.05em;line-height:1.15;font-weight:800;letter-spacing:.01em;color:var(--ink)}
.rv-hl{margin-top:.15em;font-size:1.12em;font-weight:600;color:var(--ac)}
.rv-contacts{display:flex;flex-wrap:wrap;gap:.15em 1.1em;margin-top:.55em;color:var(--mute);font-size:.94em}
.rv-c{display:inline-flex;align-items:center;gap:.4em}
.rv-job{display:flex;flex-wrap:wrap;gap:.1em 1.3em;margin-top:.55em;font-size:.94em}
.rv-jb em{font-style:normal;color:var(--mute);margin-right:.4em}
.rv-jb em::after{content:'：'}
.rv-jb .f{font-weight:600}

/* ============ classic ============ */
.t-classic{--ac:#1e4e8c;--pw:86px}
.t-classic .rv-head{display:flex;justify-content:space-between;gap:1.2em;align-items:center;padding-bottom:.9em;border-bottom:2px solid var(--ac)}
.t-classic .rv-hmain{min-width:0;flex:1}
.t-classic .rv-name{color:var(--ac)}
.t-classic .rv-hl{color:var(--ink)}
.t-classic .rv-mh{padding-bottom:.18em;border-bottom:1px solid var(--line);text-transform:uppercase;letter-spacing:.05em;font-size:1.02em}
.t-classic .rv-mh .rv-mt{display:inline-block;border-bottom:2px solid var(--ac);margin-bottom:-.2em;padding-bottom:.18em}
.t-classic .rv-photo{margin-left:auto}

/* ============ sidebar / elegant (two column) ============ */
.lay-side{display:grid;grid-template-columns:var(--sw) minmax(0,1fr);--sw:250px;--sbg:color-mix(in srgb,var(--ac) 84%,#000);padding:0;
 background:linear-gradient(90deg,var(--sbg) var(--sw),#fff var(--sw));align-items:start}
.lay-side .rv-side{padding:var(--mg) 22px var(--mg) 24px;color:var(--on);min-width:0}
.lay-side .rv-mainc{padding:var(--mg) var(--mg) var(--mg) 30px;min-width:0}
.lay-side .rv-head{margin-bottom:var(--gap)}
.lay-side .rv-photo{--pw:136px;margin:0 auto 1.1em}
.lay-side .rv-side .rv-contacts{flex-direction:column;gap:.5em;margin:0 0 1.2em;color:inherit;font-size:.92em}
.lay-side .rv-side .rv-ci{display:block;opacity:.85}
.lay-side .rv-side .rv-c{align-items:flex-start}
.lay-side .rv-side .rv-c .f{min-width:0}
.lay-side .rv-side .rv-mh{color:inherit;font-size:.98em;text-transform:uppercase;letter-spacing:.1em;padding-bottom:.3em;border-bottom:1px solid color-mix(in srgb,var(--on) 40%,transparent)}
.lay-side .rv-side .rv-d,.lay-side .rv-side .rv-r,.lay-side .rv-side .rv-rd{color:inherit;opacity:.8}
.lay-side .rv-side .rv-tag{background:color-mix(in srgb,var(--on) 18%,transparent);color:inherit}
.lay-side .rv-side .rv-lv b{background:var(--on)}
.lay-side .rv-side .rv-bars .rv-bar{grid-template-columns:1fr;gap:.2em}
.lay-side .rv-side .rv-desc li::marker{color:inherit}
.lay-side .rv-side .rv-rows .rv-row{flex-wrap:wrap;gap:0 .6em}
.lay-side .rv-side .rv-mod{margin-top:calc(var(--gap)*.9)}
.lay-side .rv-side>.rv-mod:first-child{margin-top:0}
.lay-side .rv-mainc .rv-name{font-size:2.1em;color:var(--ink)}
.lay-side .rv-mainc .rv-mh{padding-bottom:.2em;border-bottom:2px solid var(--ac);text-transform:uppercase;letter-spacing:.05em;font-size:1.02em}
.lay-side .rv-mainc .rv-jb{display:inline-flex}
.t-sidebar{--ac:#0f766e}
.t-elegant{--ac:#9a6b4f;--sbg:color-mix(in srgb,var(--ac) 11%,#fff);--sw:236px;font-family:var(--font)}
.t-elegant.right{grid-template-columns:minmax(0,1fr) var(--sw);background:linear-gradient(90deg,#fff calc(100% - var(--sw)),var(--sbg) calc(100% - var(--sw)))}
.t-elegant.right .rv-side{grid-column:2;grid-row:1;color:var(--ink);padding:var(--mg) 24px var(--mg) 22px}
.t-elegant.right .rv-mainc{grid-column:1;grid-row:1;padding:var(--mg) 28px var(--mg) var(--mg)}
.t-elegant .rv-side .rv-mh{color:var(--ac);border-bottom:1px solid color-mix(in srgb,var(--ac) 45%,transparent);letter-spacing:.14em}
.t-elegant .rv-side .rv-tag{background:#fff;color:var(--ink);border:1px solid color-mix(in srgb,var(--ac) 28%,#fff)}
.t-elegant .rv-side .rv-lv{background:color-mix(in srgb,var(--ac) 22%,#fff)}
.t-elegant .rv-side .rv-lv b{background:var(--ac)}
.t-elegant .rv-side .rv-ci{color:var(--ac)}
.t-elegant .rv-side .rv-d,.t-elegant .rv-side .rv-r,.t-elegant .rv-side .rv-rd{color:var(--mute);opacity:1}
.t-elegant .rv-side .rv-contacts{color:var(--ink)}
.t-elegant .rv-mainc .rv-name{font-weight:500;letter-spacing:.08em;font-size:2.3em}
.t-elegant .rv-mainc .rv-hl{font-style:italic;font-weight:400;color:var(--ac)}
.t-elegant .rv-mainc .rv-mh{border-bottom:1px solid var(--line);font-weight:600;letter-spacing:.14em;color:var(--ac)}
.t-elegant .rv-side .rv-desc li::marker{color:var(--ac)}

/* ============ timeline ============ */
.t-timeline{--ac:#2563eb}
.t-timeline .rv-head{display:flex;align-items:center;gap:1.2em;justify-content:space-between;padding:.2em 0 1em;border-bottom:1px solid var(--line)}
.t-timeline .rv-hmain{flex:1;min-width:0}
.t-timeline .rv-name{color:var(--ink)}
.t-timeline .rv-mh{display:flex;align-items:center;gap:.6em;font-size:1.06em;color:var(--ink);margin-bottom:.45em}
.t-timeline .rv-mi{display:block;width:1.85em;height:1.85em;padding:.42em;border-radius:50%;background:var(--ac);color:var(--on)}
.t-timeline .rv-mb{margin-left:.92em;padding:.1em 0 .25em 1.5em;border-left:2px solid color-mix(in srgb,var(--ac) 30%,#fff)}
.t-timeline .rv-entry::before{content:'';position:absolute;left:calc(-1.5em - 6px);top:.5em;width:10px;height:10px;border-radius:50%;background:#fff;border:2.5px solid var(--ac)}
.t-timeline .rv-d{background:var(--tint);color:var(--ac);border-radius:99px;padding:0 .7em;font-weight:600;font-size:.88em}

/* ============ minimal ============ */
.t-minimal{--ac:#374151;--gap:calc(var(--gap)*1)}
.t-minimal .rv-head{text-align:center;display:flex;flex-direction:column;align-items:center;gap:.7em;margin-bottom:calc(var(--gap)*1.2)}
.t-minimal .rv-name{font-weight:300;font-size:2.4em;letter-spacing:.1em}
.t-minimal .rv-hl{font-weight:400;font-size:.9em;letter-spacing:.3em;text-transform:uppercase;color:var(--mute)}
.t-minimal .rv-contacts,.t-minimal .rv-job{justify-content:center}
.t-minimal .rv-contacts{margin-top:.8em;gap:.15em 1.5em}
.t-minimal .rv-mh{display:flex;align-items:center;gap:1em;font-size:.76em;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--ink);margin-bottom:.9em}
.t-minimal .rv-mh::after{content:'';flex:1;height:1px;background:var(--line)}
.t-minimal .rv-t{font-weight:600}
.t-minimal .rv-mod{margin-top:calc(var(--gap)*1.15)}
.t-minimal .rv-d{font-size:.88em;letter-spacing:.03em}

/* ============ banner ============ */
.t-banner{--ac:#4f46e5}
.t-banner .rv-head{margin-bottom:var(--gap)}
.t-banner .rv-hband{display:flex;align-items:center;justify-content:space-between;gap:1.4em;margin:calc(-1*var(--mg)) calc(-1*var(--mg)) 0;padding:calc(var(--mg)*.85) var(--mg) 1.3em;background:linear-gradient(120deg,var(--ac),color-mix(in srgb,var(--ac) 70%,#000));color:var(--on)}
.t-banner .rv-hmain{min-width:0;flex:1}
.t-banner .rv-name{color:inherit;font-size:2.3em}
.t-banner .rv-hl{color:inherit;opacity:.92}
.t-banner .rv-contacts{color:inherit;opacity:.95}
.t-banner .rv-ci{display:block}
.t-banner .rv-photo{--pw:96px;border:3px solid color-mix(in srgb,var(--on) 80%,transparent)}
.t-banner .rv-job{margin-top:.9em;padding:.55em .9em;background:var(--tint);border-radius:8px}
.t-banner .rv-mh{display:flex;align-items:center;gap:.55em;padding:.25em .7em;border-left:5px solid var(--ac);background:linear-gradient(90deg,var(--tint),transparent);font-size:1.06em;margin-bottom:.6em}
.t-banner .rv-mi{display:block;width:1.15em;height:1.15em}
.t-banner .rv-d{background:var(--tint);color:var(--ac);border-radius:99px;padding:0 .7em;font-weight:600;font-size:.88em}

/* ============ compact ============ */
.t-compact{--ac:#0f5f8f;font-size:calc(var(--fs)*.94);--pw:68px}
.t-compact .rv-head{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:.5em 1.1em;align-items:center;padding-bottom:.7em;border-bottom:2px solid var(--ac);margin-bottom:calc(var(--gap)*.8)}
.t-compact .rv-name{font-size:1.8em}
.t-compact .rv-hl{font-size:1em}
.t-compact .rv-hside .rv-contacts{flex-direction:column;gap:.1em;margin:0;font-size:.9em;align-items:flex-start}
.t-compact .rv-ci{display:block;color:var(--ac)}
.t-compact .rv-mod{margin-top:calc(var(--gap)*.8)}
.t-compact .rv-mh{font-size:1em;text-transform:uppercase;letter-spacing:.08em;padding:.12em .55em;background:var(--tint);border-left:3px solid var(--ac);margin-bottom:.4em}
.t-compact .rv-eh{flex-wrap:nowrap}
.t-compact .rv-eh .rv-r{flex:1}
.t-compact .rv-desc li{margin:0}

/* ============ table (formal Chinese form) ============ */
.t-table{--ac:#1f2933;--ink:#111;--line:#2b3138;--tint:#eef0f2}
.t-table .rv-head{margin-bottom:0}
.t-table .rv-ttl{text-align:center;font-size:1.9em;font-weight:800;letter-spacing:.2em;padding:0 0 .55em}
.t-table .rv-tgrid{display:grid;grid-template-columns:minmax(0,1fr);border:1px solid var(--line);border-bottom:0}
.t-table .rv-tgrid.with-photo{grid-template-columns:minmax(0,1fr) 124px}
.t-table .rv-tcells{display:grid;grid-template-columns:6.6em minmax(0,1fr) 5.4em minmax(0,1fr)}
.t-table .rv-tl,.t-table .rv-tv{padding:.38em .6em;border-bottom:1px solid var(--line);border-right:1px solid var(--line);min-height:2.25em}
.t-table .rv-tl{background:var(--tint);font-weight:600;text-align:center}
.t-table .rv-tcells>:nth-child(4n){border-right:0}
.t-table .with-photo .rv-tcells>:nth-child(4n){border-right:1px solid var(--line)}
.t-table .rv-tph{border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:center;padding:8px}
.t-table .rv-photo{--pw:100px;--pr:1.5}
.t-table .rv-photo.shape-circle,.t-table .rv-photo.shape-square{--pr:1.5}
.t-table .rv-photo.empty{width:100px;height:140px}
.t-table .rv-photo.shape-circle{border-radius:4px}
.t-table .rv-mod{margin-top:0;border:1px solid var(--line);border-top:0}
.t-table .rv-mh{margin:0;background:var(--tint);border-bottom:1px solid var(--line);padding:.3em .8em;text-align:center;letter-spacing:.35em;color:var(--ink);font-size:1.02em}
.t-table .rv-mb{padding:.55em .9em .6em}
.t-table .rv-entry{margin-top:calc(var(--egap)*.9)}
.t-table .rv-flow{margin-top:0}

/* ============ tech ============ */
.t-tech{--ac:#0d9f6e;--tint:color-mix(in srgb,var(--ac) 10%,#fff)}
.t-tech .rv-head{margin:calc(-1*var(--mg)) calc(-1*var(--mg)) var(--gap);padding:calc(var(--mg)*.75) var(--mg) 1.2em;background:#0f172a;color:#cbd5e1;font-family:ui-monospace,"SF Mono",Menlo,Consolas,"Microsoft YaHei",monospace}
.t-tech .rv-prompt{color:var(--ac);font-size:.82em;margin-bottom:.4em}
.t-tech .rv-name{color:#fff;font-size:2em;font-weight:700}
.t-tech .rv-name::before{content:'> ';color:var(--ac)}
.t-tech .rv-hl{color:var(--ac);font-weight:500}
.t-tech .rv-contacts{color:#cbd5e1}
.t-tech .rv-ci{display:block;color:var(--ac)}
.t-tech .rv-job{color:#cbd5e1}
.t-tech .rv-jb em{color:#94a3b8}
.t-tech .rv-mh{font-family:ui-monospace,"SF Mono",Menlo,Consolas,"Microsoft YaHei",monospace;font-size:1em;color:var(--ac);display:flex;align-items:center;gap:.5em}
.t-tech .rv-mh::before{content:'##';color:#94a3b8}
.t-tech .rv-mh::after{content:'';flex:1;border-top:1px dashed #cbd5e1}
.t-tech .rv-d{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85em}
.t-tech .rv-tag{border:1px solid color-mix(in srgb,var(--ac) 55%,#fff);background:var(--tint);border-radius:4px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88em}
.t-tech .rv-t{color:#0f172a}

/* ============ academic ============ */
.t-academic{--ac:#7f1d1d}
.t-academic .rv-head{text-align:center;display:flex;flex-direction:column;align-items:center;border-bottom:1px solid var(--ink);padding-bottom:.8em}
.t-academic .rv-name{font-weight:700;font-size:2em;letter-spacing:.06em;color:var(--ink)}
.t-academic .rv-hl{color:var(--mute);font-weight:400;font-style:italic}
.t-academic .rv-contacts,.t-academic .rv-job{justify-content:center}
.t-academic .rv-mh{color:var(--ac);font-size:1.06em;font-variant:small-caps;letter-spacing:.08em;border-bottom:1px solid var(--line);padding-bottom:.15em;margin-bottom:.55em}
.t-academic .rv-eh{display:grid;grid-template-columns:8.6em minmax(0,1fr);column-gap:1em;align-items:baseline}
.t-academic .rv-d{grid-column:1;grid-row:1/span 2;order:-1;margin:0;text-align:left;font-size:.95em}
.t-academic .rv-t,.t-academic .rv-r{grid-column:2}
.t-academic .rv-desc{margin-left:9.6em}
.t-academic .rv-rows .rv-row{display:grid;grid-template-columns:8.6em minmax(0,1fr);column-gap:1em}
.t-academic .rv-rd{order:-1;margin:0;text-align:left;font-size:.95em}

/* ============ international ============ */
.t-intl{--ac:#0b6e99}
.t-intl .rv-head{display:flex;justify-content:space-between;align-items:flex-end;gap:1.5em;padding-bottom:.9em;border-bottom:3px solid var(--ink)}
.t-intl .rv-hmain{flex:1;min-width:0}
.t-intl .rv-name{font-size:2.3em;font-weight:800;letter-spacing:-.01em}
.t-intl .rv-hl{font-weight:500;color:var(--ac)}
.t-intl .rv-contacts{flex-direction:column;align-items:flex-end;margin:0;gap:.1em;text-align:right;max-width:42%}
.t-intl .rv-mh{font-size:.95em;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:var(--ink);padding-left:.6em;border-left:4px solid var(--ac);line-height:1.1;padding-top:.15em;padding-bottom:.15em}
.t-intl .rv-t{font-weight:700}
.t-intl .rv-r{font-style:italic}

/* ============ bold ============ */
.t-bold{--ac:#e11d48}
.t-bold .rv-head{display:flex;align-items:center;justify-content:space-between;gap:1.2em;border-left:10px solid var(--ac);padding-left:1.1em}
.t-bold .rv-hmain{flex:1;min-width:0}
.t-bold .rv-name{font-size:2.7em;font-weight:900;line-height:1.05;letter-spacing:-.01em}
.t-bold .rv-hl{font-size:1.2em;font-weight:700}
.t-bold .rv-ci{display:block;color:var(--ac)}
.t-bold .rv-contacts{color:var(--ink)}
.t-bold .rv-photo{--pw:104px}
.t-bold .rv-mh{font-size:1.2em;font-weight:900;color:var(--ink);position:relative;padding-bottom:.5em;margin-bottom:.55em}
.t-bold .rv-mh::after{content:'';position:absolute;left:0;bottom:0;width:2.2em;height:4px;background:var(--ac);border-radius:2px}
.t-bold .rv-d{color:var(--ac);font-weight:700}
.t-bold .rv-t{font-weight:800}

/* ============ editing chrome ============ */
.rv-sheet.editing .f[contenteditable]{outline:none;border-radius:3px;cursor:text;transition:background .12s,box-shadow .12s}
.rv-sheet.editing .f[contenteditable]:hover{background:rgba(120,134,160,.16)}
.rv-sheet.editing .f[contenteditable]:focus{background:rgba(37,99,235,.09);box-shadow:0 0 0 2px rgba(37,99,235,.5)}
.rv-sheet.editing .f:empty::before{content:attr(data-ph);opacity:.42;font-weight:400;font-style:normal;pointer-events:none}
.rv-sheet.editing .rv-desc.f:empty{min-height:1.5em}
.rv-sheet.editing .rv-photo{cursor:pointer}
.rv-sheet.editing .rv-lv{cursor:pointer;height:.62em;margin:-.1em 0}
.rv-tools,.rv-etools{position:absolute;display:none;gap:1px;padding:2px;background:#fff;border:1px solid #d5dbe2;border-radius:8px;box-shadow:0 3px 12px rgba(16,24,40,.16);z-index:6;color:#1f2933;font-size:13px;line-height:1;text-transform:none;letter-spacing:0;font-weight:400}
.rv-tools{right:-4px;top:-6px}
.rv-etools{right:0;top:-1.25em}
.rv-mod:hover>.rv-tools,.rv-mod:focus-within>.rv-tools,.rv-entry:hover>.rv-etools,.rv-entry:focus-within>.rv-etools{display:flex}
.rv-mod:has(.rv-entry:hover)>.rv-tools{display:none}
.rv-tb{all:unset;box-sizing:border-box;width:24px;height:24px;display:grid;place-items:center;border-radius:6px;cursor:pointer;color:#475467}
.rv-tb:hover{background:#eef2f6;color:#111}
.rv-tb.danger:hover{background:#fee4e2;color:#b42318}
.rv-tb svg{width:15px!important;height:15px!important}
.rv-tb[data-act=mgrip],.rv-tb[data-act=egrip]{cursor:grab;touch-action:none}
.rv-mod.dragging,.rv-entry.dragging{opacity:.55;outline:2px dashed #2563eb;outline-offset:3px;background:rgba(37,99,235,.05);z-index:7}
.rv-dropline{position:absolute;left:0;right:0;height:3px;border-radius:3px;background:#2563eb;pointer-events:none;z-index:9}

/* ============ page windows (print / export) ============ */
.rv-page{position:relative;width:794px;height:1122px;overflow:hidden;background:#fff;break-after:page;page-break-after:always}
.rv-page:last-child{break-after:auto;page-break-after:auto}
.rv-page>.rv-sheet{position:absolute;left:0;top:0;width:794px}
`;
