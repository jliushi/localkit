// Speech recognition worker (Whisper via transformers.js). Receives 16 kHz mono audio,
// posts back progress and timestamped segments. Model files come from Hugging Face (or its
// mirror) and are cached by the browser; the audio itself never leaves this worker.
import { pipeline, env, WhisperTextStreamer } from '@huggingface/transformers';

let current = { key: null, pipe: null };

function configure({ base, host }) {
  env.allowLocalModels = false;
  env.remoteHost = host;
  env.backends.onnx.wasm.wasmPaths = {
    mjs: `${base}/vendor/ort/ort-wasm-simd-threaded.asyncify.mjs`,
    wasm: `${base}/vendor/ort/ort-wasm-simd-threaded.asyncify.wasm`,
  };
}

async function load(model, device, post) {
  const key = `${model}|${device}`;
  if (current.key === key) return current.pipe;
  const files = new Map();
  const progress_callback = (p) => {
    if (p.status === 'progress' && p.total) {
      files.set(p.file, [p.loaded, p.total]);
      let loaded = 0, total = 0;
      for (const [l, t] of files.values()) { loaded += l; total += t; }
      post({ type: 'download', loaded, total });
    }
  };
  const dtype = device === 'webgpu' ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : 'q8';
  if (current.pipe) { await current.pipe.dispose(); current = { key: null, pipe: null }; }
  const pipe = await pipeline('automatic-speech-recognition', model, { device, dtype, progress_callback });
  current = { key, pipe };
  return pipe;
}

self.onmessage = async ({ data }) => {
  const post = (m) => self.postMessage(m);
  if (data.type !== 'run') return;
  configure(data);
  let device = data.device;
  try {
    let pipe;
    try {
      pipe = await load(data.model, device, post);
    } catch (e) {
      if (device !== 'webgpu') throw e;
      device = 'wasm'; // no usable GPU: fall back to the CPU build
      post({ type: 'fallback' });
      pipe = await load(data.model, device, post);
    }
    post({ type: 'ready', device });
    const audio = data.audio;
    const chunkSeconds = 30;
    const seconds = audio.length / 16000;
    // The pipeline slides a 30 s window forward by 20 s (30 − 2 × 5 s stride).
    const total = seconds <= chunkSeconds ? 1 : Math.ceil((seconds - chunkSeconds) / 20) + 1;
    let done = 0;
    const streamer = new WhisperTextStreamer(pipe.tokenizer, {
      time_precision: pipe.processor.feature_extractor.config.chunk_length / pipe.model.config.max_source_positions,
      callback_function: (text) => post({ type: 'partial', text }),
      on_finalize: () => { done++; post({ type: 'progress', value: Math.min(0.99, done / total) }); },
    });
    const out = await pipe(audio, {
      language: data.language || null,
      task: data.task,
      chunk_length_s: chunkSeconds,
      stride_length_s: 5,
      return_timestamps: true,
      streamer,
    });
    post({ type: 'result', chunks: out.chunks || [{ text: out.text, timestamp: [0, audio.length / 16000] }], device });
  } catch (e) {
    post({ type: 'error', message: e?.message || String(e) });
  }
};
