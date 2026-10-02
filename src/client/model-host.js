// Helpers for tools that download open models from Hugging Face (with the hf-mirror.com fallback for regions
// where huggingface.co is blocked) and pick the best available inference backend.

/** Returns the first Hugging Face host that answers for `model` (defaults to huggingface.co). */
export async function modelHost(model) {
  for (const host of ['https://huggingface.co/', 'https://hf-mirror.com/']) {
    try {
      const res = await fetch(`${host}${model}/resolve/main/config.json`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) return host;
    } catch { /* try the next one */ }
  }
  return 'https://huggingface.co/';
}

export async function hasWebGpu() {
  try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch { return false; }
}
