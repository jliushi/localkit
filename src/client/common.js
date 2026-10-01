// Runs on every page: remembers the visitor's language choice.
for (const a of document.querySelectorAll('a[data-lang]')) {
  a.addEventListener('click', () => {
    try { localStorage.setItem('lk-lang', a.dataset.lang); } catch { /* storage unavailable */ }
  });
}
