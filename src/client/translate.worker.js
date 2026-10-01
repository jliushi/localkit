// Translation worker: Helsinki-NLP OPUS-MT models (Apache-2.0) via transformers.js.
// Receives batches of short texts, posts progress and results. Text never leaves the browser.
import { pipeline, env } from '@huggingface/transformers';

const pipes = new Map();

function configure({ base, host }) {
  env.allowLocalModels = false;
  env.remoteHost = host;
  env.backends.onnx.wasm.wasmPaths = {
    mjs: `${base}/vendor/ort/ort-wasm-simd-threaded.asyncify.mjs`,
    wasm: `${base}/vendor/ort/ort-wasm-simd-threaded.asyncify.wasm`,
  };
}

async function load(model, post) {
  if (pipes.has(model)) return pipes.get(model);
  const files = new Map();
  const pipe = await pipeline('translation', model, {
    dtype: 'q8',
    device: 'wasm',
    progress_callback: (p) => {
      if (p.status === 'progress' && p.total) {
        files.set(p.file, [p.loaded, p.total]);
        let loaded = 0, total = 0;
        for (const [l, t] of files.values()) { loaded += l; total += t; }
        post({ type: 'download', model, loaded, total });
      }
    },
  });
  pipes.set(model, pipe);
  return pipe;
}

self.onmessage = async ({ data }) => {
  const post = (m) => self.postMessage(m);
  if (data.type !== 'run') return;
  try {
    configure(data);
    let texts = data.texts;
    // Each step is one model (a pivot through English uses two).
    for (let s = 0; s < data.models.length; s++) {
      const pipe = await load(data.models[s], post);
      post({ type: 'ready', step: s });
      const out = [];
      // One line at a time: batching padded inputs makes Marian models loop on short lines.
      for (let i = 0; i < texts.length; i++) {
        const src = (texts[i] || '').trim();
        if (!src) { out.push(''); continue; }
        const [r] = await pipe(src, { max_new_tokens: Math.min(256, 16 + src.length * 3), no_repeat_ngram_size: 3, num_beams: 1 });
        out.push((r?.translation_text || '').trim());
        if (i % 2 === 0 || i === texts.length - 1) post({ type: 'progress', value: (s + (i + 1) / texts.length) / data.models.length });
      }
      texts = out.map((x, i) => (data.texts[i] ? x : ''));
    }
    post({ type: 'result', texts });
  } catch (e) {
    post({ type: 'error', message: e?.message || String(e) });
  }
};
