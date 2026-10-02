// Background-removal worker (transformers.js). Receives RGBA pixels, answers with an 8-bit alpha matte of
// the same size. Model files come from Hugging Face (or its mirror) and are cached by the browser;
// the picture itself never leaves this worker.
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';

const MODELS = {
  // MIT licence. fp16 weights (≈115 MB) on WebGPU, fp32 (≈224 MB) on the CPU/WASM build, which has no fp16 kernels.
  birefnet: { id: 'onnx-community/BiRefNet_lite-ONNX', dtype: { webgpu: 'fp16', wasm: 'fp32' }, sigmoid: true },
  // Apache-2.0 licence, portraits only. 6.6 MB 8-bit weights on the CPU, 26 MB fp32 on WebGPU.
  modnet: { id: 'Xenova/modnet', dtype: { webgpu: 'fp32', wasm: 'uint8' }, sigmoid: false },
};

let current = { key: null, model: null, processor: null };

function configure({ base, host }) {
  env.allowLocalModels = false;
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
  const files = new Map();
  const progress_callback = (p) => {
    if (p.status === 'progress' && p.total) {
      files.set(p.file, [p.loaded, p.total]);
      let loaded = 0, total = 0;
      for (const [l, t] of files.values()) { loaded += l; total += t; }
      post({ type: 'download', loaded, total });
    }
  };
  current = { key: null, model: null, processor: null };
  const [model, processor] = await Promise.all([
    AutoModel.from_pretrained(spec.id, { device, dtype: spec.dtype[device], progress_callback }),
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
  if (MODELS[name].sigmoid) t = t.sigmoid();
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
