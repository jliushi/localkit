// Shared subtitle-translation engine (OPUS-MT models in a worker) used by Translate Subtitles
// and the AI Subtitle Generator editor.
import { LK } from './lib.js';

// Languages with OPUS-MT models to and/or from English (Xenova ONNX conversions of Helsinki-NLP/opus-mt-*).
export const LANGS = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'it', 'vi', 'id', 'ar', 'ko'];
const CODE = { ja: 'jap' };
const FROM_EN = new Set(['zh', 'es', 'fr', 'de', 'ja', 'ru', 'it', 'vi', 'id', 'ar']);
const TO_EN = new Set(['zh', 'es', 'fr', 'de', 'ja', 'ru', 'it', 'vi', 'id', 'ar', 'ko']);

const model = (a, b) => `Xenova/opus-mt-${a === 'ja' && b === 'en' ? 'ja' : CODE[a] || a}-${CODE[b] || b}`;

/** Models needed to go from `src` to `dst` (pivoting through English when needed), or null. */
export function route(src, dst) {
  if (src === dst) return [];
  if (src === 'en') return FROM_EN.has(dst) ? [model('en', dst)] : null;
  if (dst === 'en') return TO_EN.has(src) ? [model(src, 'en')] : null;
  return TO_EN.has(src) && FROM_EN.has(dst) ? [model(src, 'en'), model('en', dst)] : null;
}

export const canTarget = (src, dst) => route(src, dst) !== null;

/** Very small language guess for subtitles: script-based, then a few common words. */
export function guessLanguage(texts) {
  const s = texts.join(' ').slice(0, 4000);
  const count = (re) => (s.match(re) || []).length;
  const han = count(/[一-鿿]/g), kana = count(/[぀-ヿ]/g), hangul = count(/[가-힯]/g);
  const cyr = count(/[Ѐ-ӿ]/g), arab = count(/[؀-ۿ]/g);
  const total = Math.max(1, s.replace(/\s/g, '').length);
  if (kana / total > 0.05) return 'ja';
  if (hangul / total > 0.2) return 'ko';
  if (han / total > 0.2) return 'zh';
  if (cyr / total > 0.2) return 'ru';
  if (arab / total > 0.2) return 'ar';
  const words = s.toLowerCase().match(/[a-zà-ÿ]+/g) || [];
  const score = (list) => words.filter((w) => list.includes(w)).length;
  const scores = {
    en: score(['the', 'and', 'is', 'you', 'to', 'of', 'it', 'that', 'this', 'with']),
    es: score(['el', 'la', 'que', 'de', 'y', 'es', 'los', 'por', 'una', 'para']),
    fr: score(['le', 'la', 'les', 'et', 'est', 'des', 'une', 'pour', 'pas', 'vous']),
    de: score(['der', 'die', 'und', 'das', 'ist', 'nicht', 'ich', 'mit', 'ein', 'zu']),
    it: score(['il', 'che', 'di', 'e', 'la', 'non', 'per', 'una', 'sono', 'gli']),
    vi: score(['và', 'của', 'là', 'không', 'có', 'được', 'này', 'một', 'cho', 'người']),
    id: score(['dan', 'yang', 'di', 'ini', 'itu', 'tidak', 'saya', 'untuk', 'dengan', 'ada']),
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

async function modelHost(m, signal) {
  for (const host of ['https://huggingface.co/', 'https://hf-mirror.com/']) {
    try {
      const res = await fetch(`${host}${m}/resolve/main/config.json`, { signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]) });
      if (res.ok) return host;
    } catch { if (signal.aborted) throw signal.reason; }
  }
  return 'https://huggingface.co/';
}

let worker = null;
/**
 * Translates an array of strings. onEvent receives { type: 'download'|'progress'|'ready', … }.
 * Returns a cancel-able promise: { promise, cancel() }.
 */
export function translate(texts, src, dst, onEvent) {
  const models = route(src, dst);
  const controller = new AbortController();
  let rejectCurrent;
  const promise = (async () => {
    if (!models) throw new Error(`No translation model for ${src} → ${dst}`);
    if (!models.length) return texts.slice();
    const host = await modelHost(models[0], controller.signal);
    controller.signal.throwIfAborted();
    worker ||= new Worker(`${LK.base}/assets/js/translate.worker.js`, { type: 'module' });
    const out = await new Promise((resolve, reject) => {
      rejectCurrent = reject;
      worker.onmessage = ({ data }) => {
        if (data.type === 'result') resolve(data.texts);
        else if (data.type === 'error') reject(new Error(data.message));
        else onEvent?.(data);
      };
      worker.onerror = (e) => reject(new Error(e.message || 'worker error'));
      worker.postMessage({ type: 'run', texts, models, base: `${location.origin}${LK.base}`, host });
    });
    if (dst === 'zh') {
      // OPUS-MT sometimes mixes Traditional characters into Chinese output.
      const OpenCC = await import('opencc-js/t2cn');
      controller.signal.throwIfAborted();
      const conv = OpenCC.Converter({ from: 't', to: 'cn' });
      return out.map((x) => conv(x));
    }
    return out;
  })();
  return { promise, cancel: () => {
    const error = new DOMException('canceled', 'AbortError');
    controller.abort(error);
    worker?.terminate();
    worker = null;
    rejectCurrent?.(error);
  } };
}
