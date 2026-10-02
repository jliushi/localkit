import { Rnnoise } from '@shiguredo/rnnoise-wasm';

// RNNoise uses signed 16-bit amplitude in float storage, 48 kHz, 480 samples/frame.
self.onmessage = async ({ data: { pcm, strength, highpass } }) => {
  try {
    const rnnoise = await Rnnoise.load();
    const frameSize = rnnoise.frameSize;
    if (frameSize !== 480) throw new Error('Unexpected RNNoise frame size');
    const result = [];
    for (let ch = 0; ch < pcm.length; ch++) {
      const original = pcm[ch], out = new Float32Array(original.length);
      const state = rnnoise.createDenoiseState();
      const frame = new Float32Array(frameSize);
      let previousInput = 0, previousOutput = 0;
      const alpha = 1 / (1 + 2 * Math.PI * 80 / 48000);
      try {
        // Flush one extra frame and compensate RNNoise's 10 ms analysis delay.
        for (let offset = 0; offset < original.length + frameSize; offset += frameSize) {
          for (let i = 0; i < frameSize; i++) {
            let sample = original[offset + i] || 0;
            if (highpass) { const filtered = alpha * (previousOutput + sample - previousInput); previousInput = sample; previousOutput = filtered; sample = filtered; }
            frame[i] = sample * 32768;
          }
          state.processFrame(frame);
          for (let i = 0; i < frameSize; i++) {
            const target = offset - frameSize + i;
            if (target >= 0 && target < out.length) out[target] = Math.max(-1, Math.min(1, original[target] * (1 - strength) + frame[i] / 32768 * strength));
          }
          if (offset % (frameSize * 50) === 0) self.postMessage({ progress: (ch + offset / (original.length + frameSize)) / pcm.length });
        }
      } finally { state.destroy(); }
      result.push(out);
    }
    self.postMessage({ pcm: result }, result.map((x) => x.buffer));
  } catch (error) { self.postMessage({ error: error.message }); }
};
