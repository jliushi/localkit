// Runs on every page: language memory, the tools menu, and the home-page tool search.
for (const a of document.querySelectorAll('a[data-lang]')) {
  a.addEventListener('click', () => {
    try { localStorage.setItem('lk-lang', a.dataset.lang); } catch { /* storage unavailable */ }
  });
}

const menu = document.querySelector('details.menu');
if (menu) {
  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
}

const search = document.getElementById('tool-search');
if (search) {
  const cards = [...document.querySelectorAll('.cat .tcard')];
  const noMatch = document.getElementById('no-match');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const hit = !q || q.split(/\s+/).every((w) => card.dataset.search.includes(w));
      card.hidden = !hit;
      if (hit) shown++;
    }
    for (const sec of document.querySelectorAll('.cat')) sec.hidden = ![...sec.querySelectorAll('.tcard')].some((x) => !x.hidden);
    noMatch.hidden = shown > 0;
    noMatch.textContent = noMatch.dataset.template.replace('$1', search.value.trim());
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const first = cards.find((x) => !x.hidden); if (first) location.href = first.href; }
  });
}
