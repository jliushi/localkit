// Pointer-based drag-to-reorder (mouse, touch and pen). Items are matched by a data attribute.
/**
 * @param {PointerEvent} e   pointerdown on the grip
 * @param {{container: HTMLElement, item: HTMLElement, itemSel: string, idAttr: string, scale?: ()=>number, scroller?: HTMLElement, onDrop: (ids: string[], moved: string)=>void}} o
 */
export function dragSort(e, o) {
  if (e.button > 0) return;
  e.preventDefault();
  const { container, item, itemSel, idAttr } = o;
  const grip = e.currentTarget || e.target;
  const sc = () => (o.scale ? o.scale() : 1);
  const items = [...container.children].filter((c) => c.matches(itemSel));
  const startY = e.clientY;
  const prevPos = getComputedStyle(container).position;
  if (prevPos === 'static') container.style.position = 'relative';
  const line = document.createElement('div');
  line.className = 'rv-dropline';
  container.append(line);
  item.classList.add('dragging');
  try { grip.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
  let target = items.indexOf(item), lastY = startY, raf = 0;

  const update = () => {
    const dy = (lastY - startY) / sc();
    item.style.transform = `translateY(${dy}px)`;
    item.style.position = item.style.position || 'relative';
    const others = items.filter((i) => i !== item);
    const cRect = container.getBoundingClientRect();
    let idx = others.length;
    for (let i = 0; i < others.length; i++) {
      const r = others[i].getBoundingClientRect();
      if (lastY < r.top + r.height / 2) { idx = i; break; }
    }
    target = idx;
    const ref = others[idx];
    const y = ref ? ref.getBoundingClientRect().top : (others.length ? others[others.length - 1].getBoundingClientRect().bottom : cRect.top);
    line.style.top = `${(y - cRect.top) / sc() - 2}px`;
    if (o.scroller) {
      const sr = o.scroller.getBoundingClientRect();
      if (lastY < sr.top + 50) o.scroller.scrollTop -= 14; else if (lastY > sr.bottom - 50) o.scroller.scrollTop += 14;
    }
  };
  const tick = () => { update(); raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const move = (ev) => { lastY = ev.clientY; };
  const done = (ev) => {
    cancelAnimationFrame(raf);
    grip.removeEventListener('pointermove', move);
    grip.removeEventListener('pointerup', done);
    grip.removeEventListener('pointercancel', done);
    item.classList.remove('dragging');
    item.style.transform = '';
    item.style.position = '';
    line.remove();
    if (prevPos === 'static') container.style.position = '';
    if (ev.type === 'pointercancel') return;
    const others = items.filter((i) => i !== item);
    const order = [...others.slice(0, target), item, ...others.slice(target)].map((i) => i.getAttribute(idAttr));
    const before = items.map((i) => i.getAttribute(idAttr));
    if (order.join() !== before.join()) o.onDrop(order, item.getAttribute(idAttr));
  };
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', done);
  grip.addEventListener('pointercancel', done);
}
