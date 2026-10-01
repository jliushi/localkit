// Tiny HTML templating: html`` escapes interpolations unless they are raw() or html`` results.
class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s));
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);

function render(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Raw(out);
}

/** Inline JSON safe for a <script type="application/json"> block. */
export const jsonScript = (value) => raw(JSON.stringify(value).replace(/</g, '\\u003c'));
