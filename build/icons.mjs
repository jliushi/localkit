// Inline SVG icons from lucide-static (ISC license), read at build time.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { raw } from './html.mjs';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'lucide-static', 'icons');
const cache = new Map();

/** icon('scissors') → <svg class="ic" …> (decorative; hidden from screen readers). */
export function icon(name, cls = 'ic') {
  if (!cache.has(name)) {
    const svg = fs.readFileSync(path.join(DIR, `${name}.svg`), 'utf8')
      .replace(/<!--.*?-->/s, '')
      .replace(/\s*class="[^"]*"/, '')
      .replace(/\s*width="24"\s*height="24"/, '')
      .replace(/\s+/g, ' ')
      .trim();
    cache.set(name, svg);
  }
  return raw(cache.get(name).replace('<svg', `<svg class="${cls}" aria-hidden="true" focusable="false"`));
}
