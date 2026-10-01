// Range timeline: filmstrip, draggable start/end handles, playhead, editable times and keyboard
// shortcuts, synced with a <video>/<audio> element. Used by the trim, GIF and audio tools.
import { el, icon, c, fmtTime, parseTime } from './lib.js';

/**
 * opts: { media (HTMLMediaElement), duration, start, end, minLength, maxLength, step,
 *         strip?: (count) => Promise<canvas[]>, onChange({ start, end }) }
 * Returns { root, get(), set(start, end), destroy() }.
 */
export function timeline(opts) {
  const media = opts.media;
  const duration = opts.duration;
  const minLen = opts.minLength ?? Math.min(0.1, duration);
  const maxLen = opts.maxLength ?? duration;
  let start = opts.start ?? 0;
  let end = opts.end ?? Math.min(duration, start + maxLen);
  let looping = false;

  const strip = el('div', { class: 'tl-strip' });
  const shadeL = el('div', { class: 'tl-shade l' });
  const shadeR = el('div', { class: 'tl-shade r' });
  const sel = el('div', { class: 'tl-sel' });
  const hs = el('button', { type: 'button', class: 'tl-h s', 'aria-label': c('tlStart'), role: 'slider' });
  const he = el('button', { type: 'button', class: 'tl-h e', 'aria-label': c('tlEnd'), role: 'slider' });
  const head = el('div', { class: 'tl-head' });
  const track = el('div', { class: 'tl-track' }, strip, shadeL, shadeR, sel, hs, he, head);

  const inStart = el('input', { type: 'text', inputmode: 'decimal', 'aria-label': c('tlStart'), spellcheck: 'false' });
  const inEnd = el('input', { type: 'text', inputmode: 'decimal', 'aria-label': c('tlEnd'), spellcheck: 'false' });
  const lenEl = el('span', { class: 'tl-len' });
  const playBtn = el('button', { type: 'button', class: 'btn soft sm' }, icon('play'), el('span', { text: c('tlPlaySel') }));
  const root = el('div', { class: 'tl' },
    track,
    el('div', { class: 'tl-row' },
      el('label', { class: 'tl-time' }, el('span', { class: 'field-label', text: c('tlStart') }), inStart,
        el('button', { type: 'button', class: 'btn ghost sm', title: c('tlSetStartHint'), onclick: () => setFromPlayhead('s') }, c('tlSetHere'), el('span', { class: 'kbd', text: 'I' }))),
      el('div', { class: 'tl-time' }, lenEl, playBtn),
      el('label', { class: 'tl-time' }, el('span', { class: 'field-label', text: c('tlEnd') }), inEnd,
        el('button', { type: 'button', class: 'btn ghost sm', title: c('tlSetEndHint'), onclick: () => setFromPlayhead('e') }, c('tlSetHere'), el('span', { class: 'kbd', text: 'O' })))));

  const pct = (t) => `${(t / duration) * 100}%`;
  function render(fromInput) {
    shadeL.style.width = pct(start);
    shadeR.style.width = `${100 - (end / duration) * 100}%`;
    sel.style.left = pct(start);
    sel.style.width = pct(end - start);
    hs.style.left = pct(start);
    he.style.left = pct(end);
    hs.setAttribute('aria-valuenow', start.toFixed(2));
    he.setAttribute('aria-valuenow', end.toFixed(2));
    hs.setAttribute('aria-valuetext', fmtTime(start));
    he.setAttribute('aria-valuetext', fmtTime(end));
    if (fromInput !== 's') inStart.value = fmtTime(start);
    if (fromInput !== 'e') inEnd.value = fmtTime(end);
    lenEl.textContent = c('tlLength', fmtTime(end - start, 1));
    opts.onChange?.({ start, end });
  }

  function setRange(s, e, moved) {
    s = Math.max(0, Math.min(s, duration));
    e = Math.max(0, Math.min(e, duration));
    if (moved === 's') {
      s = Math.min(s, e - minLen);
      if (e - s > maxLen) e = Math.min(duration, s + maxLen);
    } else if (moved === 'e') {
      e = Math.max(e, s + minLen);
      if (e - s > maxLen) s = Math.max(0, e - maxLen);
    }
    start = Math.max(0, s);
    end = Math.min(duration, Math.max(e, start + minLen));
  }

  // Seeking while dragging shows the frame under the handle (throttled to one seek per frame).
  let pendingSeek = null;
  function seek(time) {
    if (pendingSeek == null) requestAnimationFrame(() => { media.currentTime = pendingSeek; pendingSeek = null; });
    pendingSeek = time;
  }

  const timeAt = (clientX) => {
    const r = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration;
  };

  function drag(which) {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      media.pause();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      target.focus();
      const move = (ev) => {
        const tm = timeAt(ev.clientX);
        if (which === 's') setRange(tm, end, 's'); else setRange(start, tm, 'e');
        render();
        seek(which === 's' ? start : Math.max(start, end - 0.04));
      };
      const up = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); target.removeEventListener('pointercancel', up); };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    };
  }
  hs.addEventListener('pointerdown', drag('s'));
  he.addEventListener('pointerdown', drag('e'));
  track.addEventListener('pointerdown', (e) => {
    if (e.target === hs || e.target === he) return;
    const tm = timeAt(e.clientX);
    media.currentTime = tm;
    track.setPointerCapture(e.pointerId);
    const move = (ev) => seek(timeAt(ev.clientX));
    const up = () => { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); };
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
  });

  const nudge = (which) => (e) => {
    const step = e.shiftKey ? 1 : (opts.step ?? 0.1);
    const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step : 0;
    if (!d) return;
    e.preventDefault();
    if (which === 's') setRange(start + d, end, 's'); else setRange(start, end + d, 'e');
    render();
    media.currentTime = which === 's' ? start : Math.max(start, end - 0.04);
  };
  hs.addEventListener('keydown', nudge('s'));
  he.addEventListener('keydown', nudge('e'));

  for (const [inp, which] of [[inStart, 's'], [inEnd, 'e']]) {
    inp.addEventListener('change', () => {
      const v = parseTime(inp.value);
      if (v == null) { render(); return; }
      if (which === 's') setRange(v, end, 's'); else setRange(start, v, 'e');
      render();
      media.currentTime = which === 's' ? start : Math.max(start, end - 0.04);
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
  }

  function setFromPlayhead(which) {
    const tm = media.currentTime;
    if (which === 's') setRange(tm, end, 's'); else setRange(start, tm, 'e');
    render();
  }

  // Play the selection; stop (or loop) at the end handle.
  playBtn.addEventListener('click', () => {
    if (!media.paused && looping) { media.pause(); return; }
    looping = true;
    if (media.currentTime < start || media.currentTime >= end - 0.05) media.currentTime = start;
    media.play();
  });
  const onPlay = () => { playBtn.firstElementChild.replaceWith(icon(looping ? 'pause' : 'play')); };
  const onPause = () => { looping = false; playBtn.firstElementChild.replaceWith(icon('play')); };
  let raf = 0;
  const tick = () => {
    head.style.left = pct(media.currentTime);
    if (looping && !media.paused && media.currentTime >= end) { media.pause(); media.currentTime = start; }
    raf = requestAnimationFrame(tick);
  };
  media.addEventListener('play', onPlay);
  media.addEventListener('pause', onPause);
  raf = requestAnimationFrame(tick);

  const onKey = (e) => {
    if (!root.isConnected || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'i' || e.key === 'I') { setFromPlayhead('s'); e.preventDefault(); }
    else if (e.key === 'o' || e.key === 'O') { setFromPlayhead('e'); e.preventDefault(); }
    else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); media.paused ? media.play() : media.pause(); }
  };
  document.addEventListener('keydown', onKey);

  // Filmstrip: as many frames as fit the track (measured once the caller has inserted it).
  if (opts.strip) {
    requestAnimationFrame(() => {
      const count = Math.max(4, Math.min(16, Math.round(track.clientWidth / 72) || 10));
      opts.strip(count).then((canvases) => strip.replaceChildren(...canvases)).catch(() => {});
    });
  }

  render();
  return {
    root,
    get: () => ({ start, end }),
    set(s, e) { setRange(s, e); render(); },
    destroy() { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); media.removeEventListener('play', onPlay); media.removeEventListener('pause', onPause); },
  };
}
