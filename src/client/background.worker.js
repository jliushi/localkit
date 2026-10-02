// Background-removal worker (transformers.js). Receives RGBA pixels, answers with an 8-bit alpha matte of
// the same size. Model files come from Hugging Face (or its mirror) and are cached by the browser;
// the picture itself never leaves this worker.
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

const MODELS = {
  // Apache-2.0; the small U²-Net weights are hosted with the site (4.6 MB).
  u2netp: { id: 'u2netp', bytes: 4574861, dtype: { webgpu: 'fp32', wasm: 'fp32' }, normalize: true },
  // Apache-2.0 licence, portraits only. 6.6 MB 8-bit weights on the CPU, 26 MB fp32 on WebGPU.
  modnet: { id: 'Xenova/modnet', dtype: { webgpu: 'fp32', wasm: 'uint8' }, sigmoid: false },
};

let current = { key: null, model: null, processor: null };

function configure({ base, host }) {
  env.allowLocalModels = false;
  env.localModelPath = `${base}/assets/models/`;
  env.remoteHost = host;
  env.backends.onnx.wasm.wasmPaths = {
    mjs: `${base}/vendor/ort/ort-wasm-simd-threaded.asyncify.mjs`,
    wasm: `${base}/vendor/ort/ort-wasm-simd-threaded.asyncify.wasm`,
  };
}

async function load(name, device, post) {
  const key = `${name}|${device}`;
  if (current.key === key) return current;
  const spec = MODELS[name];
  env.allowLocalModels = name === 'u2netp';
  env.allowRemoteModels = name !== 'u2netp';
  const files = new Map();
  const progress_callback = (p) => {
    const totalBytes = p.total || (p.file?.endsWith('.onnx') ? spec.bytes : 0);
    if (p.status === 'progress' && totalBytes) {
      files.set(p.file, [p.loaded, totalBytes]);
      let loaded = 0, total = 0;
      for (const [l, t] of files.values()) { loaded += l; total += t; }
      post({ type: 'download', loaded, total });
    }
  };
  await current.model?.dispose();
  current = { key: null, model: null, processor: null };
  const [model, processor] = await Promise.all([
    AutoModel.from_pretrained(spec.id, { device, dtype: spec.dtype[device], progress_callback, session_options: device === 'wasm' ? { enableCpuMemArena: false, enableMemPattern: false } : {} }),
    AutoProcessor.from_pretrained(spec.id),
  ]);
  current = { key, model, processor };
  return current;
}

async function matte({ model, processor }, name, rgba, width, height) {
  const image = new RawImage(new Uint8ClampedArray(rgba), width, height, 4).rgb();
  const { pixel_values } = await processor(image);
  const out = await model({ [model.sessions.model.inputNames[0]]: pixel_values });
  let t = out[model.sessions.model.outputNames[0]] ?? Object.values(out)[0];
  t = t[0];
  if (MODELS[name].normalize) {
    let lo = Infinity, hi = -Infinity;
    for (const v of t.data) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (hi > lo) t = t.sub(lo).div(hi - lo);
  }
  const mask = await RawImage.fromTensor(t.mul(255).clamp_(0, 255).to('uint8')).resize(width, height);
  return mask.data;
}

self.onmessage = async ({ data }) => {
  const post = (m) => self.postMessage(m);
  if (data.type !== 'run') return;
  configure(data);
  let device = data.device;
  try {
    let loaded;
    try {
      loaded = await load(data.model, device, post);
    } catch (e) {
      if (device !== 'webgpu') throw e;
      device = 'wasm'; // no usable GPU: fall back to the CPU build
      post({ type: 'fallback' });
      loaded = await load(data.model, device, post);
    }
    post({ type: 'ready', device });
    let n = 0;
    for (const item of data.items) {
      let alpha;
      try {
        alpha = await matte(loaded, data.model, item.rgba, item.width, item.height);
      } catch (e) {
        if (device !== 'webgpu') throw e;
        // WebGPU can fail on first inference (driver/memory): retry once on the CPU.
        device = 'wasm';
        post({ type: 'fallback' });
        loaded = await load(data.model, device, post);
        post({ type: 'ready', device });
        alpha = await matte(loaded, data.model, item.rgba, item.width, item.height);
      }
      const copy = new Uint8Array(alpha);
      post({ type: 'item', index: n++, alpha: copy, device }, [copy.buffer]);
    }
    post({ type: 'done', device });
  } catch (e) {
    post({ type: 'error', message: e?.message || String(e) });
  }
};
