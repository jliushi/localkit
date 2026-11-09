// Streaming WSOLA (waveform-similarity overlap-add) time stretching: changes the speed of audio without changing its pitch.
// Feed it planar Float32 chunks with push(); it returns the stretched audio that is ready so far. Call flush() at the end.
//
// Each output frame is a Hann-windowed segment of the input, 50 % overlapped with the previous one. The segment is
// taken near the position speed × (output position), shifted by up to ±search samples to the place where it continues
// the previous segment most smoothly (highest normalised cross-correlation on a decimated mono mix), which avoids the
// phasing and "robot voice" artefacts of plain overlap-add.

export class Stretcher {
  constructor({ channels, sampleRate, speed }) {
    this.ch = channels;
    this.speed = speed;
    this.N = 2 * Math.round((sampleRate * 0.046) / 2); // frame length, ~46 ms
    this.Hs = this.N / 2; // synthesis hop
    this.Ha = this.Hs * speed; // analysis hop (fractional)
    this.search = Math.round(sampleRate * 0.012);
    this.win = new Float32Array(this.N);
    for (let i = 0; i < this.N; i++) this.win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / this.N); // periodic Hann: w[i] + w[i + N/2] = 1
    this.buf = Array.from({ length: channels }, () => new Float32Array(0));
    this.base = 0; // absolute input index of buf[0]
    this.total = 0; // absolute count of input samples received
    this.k = 0; // next output frame
    this.prevStart = -1;
    this.tail = Array.from({ length: channels }, () => new Float32Array(this.Hs));
    this.emitted = 0;
    this.pendingOut = [];
  }

  push(planes) {
    const len = planes[0].length;
    for (let c = 0; c < this.ch; c++) {
      const next = new Float32Array(this.buf[c].length + len);
      next.set(this.buf[c]);
      next.set(planes[c], this.buf[c].length);
      this.buf[c] = next;
    }
    this.total += len;
    return this.run(false);
  }

  flush() {
    const before = this.emitted;
    let planes = this.run(true);
    if (!planes.length) planes = Array.from({ length: this.ch }, () => new Float32Array(0));
    if (this.prevStart >= 0) { // the overlap tail belongs to the very end of the stretched audio
      planes = planes.map((p, c) => { const r = new Float32Array(p.length + this.Hs); r.set(p); r.set(this.tail[c], p.length); return r; });
    }
    const cap = Math.max(0, Math.round(this.total / this.speed) - before);
    if (planes[0].length > cap) planes = planes.map((p) => p.subarray(0, cap));
    this.emitted = before + planes[0].length;
    return planes;
  }

  sample(c, abs) {
    const i = abs - this.base;
    return i >= 0 && i < this.buf[c].length ? this.buf[c][i] : 0;
  }

  /** Best start position near `nominal` for a segment that continues the previous one. */
  pickStart(nominal) {
    if (this.prevStart < 0) return Math.max(0, nominal);
    const { Hs, search, ch } = this;
    const lo = Math.max(0, nominal - search), hi = nominal + search;
    const refStart = this.prevStart + Hs;
    const step = 4; // decimation of the inner loop
    const ref = new Float32Array(Math.ceil(Hs / step));
    for (let j = 0, i = 0; i < Hs; i += step, j++) {
      let v = 0;
      for (let c = 0; c < ch; c++) v += this.sample(c, refStart + i);
      ref[j] = v;
    }
    let best = nominal, bestScore = -Infinity;
    for (let s = lo; s <= hi; s += 2) {
      let dot = 0, energy = 1e-9;
      for (let j = 0, i = 0; i < Hs; i += step, j++) {
        let v = 0;
        for (let c = 0; c < ch; c++) v += this.sample(c, s + i);
        dot += v * ref[j];
        energy += v * v;
      }
      const score = dot / Math.sqrt(energy);
      if (score > bestScore) { bestScore = score; best = s; }
    }
    return best;
  }

  run(final) {
    const { N, Hs, ch } = this;
    const chunks = Array.from({ length: ch }, () => []);
    let produced = 0;
    for (;;) {
      const nominal = Math.round(this.k * this.Ha);
      const needEnd = nominal + this.search + N;
      if (final ? nominal >= this.total : this.base + this.buf[0].length < needEnd) break;
      const start = this.pickStart(nominal);
      const out = Array.from({ length: ch }, () => new Float32Array(Hs));
      for (let c = 0; c < ch; c++) {
        const o = out[c], t = this.tail[c];
        const nt = new Float32Array(Hs);
        for (let i = 0; i < Hs; i++) {
          // The very first frame is copied as is, so the audio does not fade in.
          o[i] = this.k === 0 ? this.sample(c, start + i) : t[i] + this.win[i] * this.sample(c, start + i);
          nt[i] = this.win[Hs + i] * this.sample(c, start + Hs + i);
        }
        this.tail[c] = nt;
        chunks[c].push(o);
      }
      produced += Hs;
      this.prevStart = start;
      this.k++;
      // Drop input that no later frame can reach.
      const keep = Math.min(this.prevStart + Hs, Math.round(this.k * this.Ha) - this.search);
      const drop = Math.min(Math.max(0, keep - this.base), this.buf[0].length);
      if (drop > 0) { for (let c = 0; c < ch; c++) this.buf[c] = this.buf[c].slice(drop); this.base += drop; }
    }
    if (!produced) return [];
    const planes = chunks.map((list) => { const r = new Float32Array(produced); list.forEach((p, i) => r.set(p, i * Hs)); return r; });
    this.emitted += produced;
    return planes;
  }
}
