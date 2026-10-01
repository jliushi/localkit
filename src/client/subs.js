// Subtitle formats: SRT and WebVTT parsing and writing.
import { parseTime } from './lib.js';

const pad = (n, w = 2) => String(n).padStart(w, '0');
function stamp(sec, sep) {
  const ms = Math.max(0, Math.round(sec * 1000));
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${sep}${pad(ms % 1000, 3)}`;
}

export const toSrt = (list) => list.map((s, i) => `${i + 1}\n${stamp(s.start, ',')} --> ${stamp(s.end, ',')}\n${s.text}\n`).join('\n');
export const toVtt = (list) => `WEBVTT\n\n${list.map((s) => `${stamp(s.start, '.')} --> ${stamp(s.end, '.')}\n${s.text}\n`).join('\n')}`;
export const toTxt = (list) => list.map((s) => s.text).join('\n');

/** Parses SRT or WebVTT text into [{ start, end, text }] sorted by start time. */
export function parseSubs(text) {
  const out = [];
  const blocks = text.replace(/\r/g, '').replace(/^﻿/, '').split(/\n{2,}/);
  for (const b of blocks) {
    const lines = b.split('\n').filter((l) => l.trim() !== '');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, z] = lines[i].split('-->').map((x) => parseTime(x.trim().split(/\s+/)[0]));
    const body = lines.slice(i + 1).join('\n').replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '').trim();
    if (a != null && z != null && body) out.push({ start: a, end: z, text: body });
  }
  return out.sort((x, y) => x.start - y.start);
}
