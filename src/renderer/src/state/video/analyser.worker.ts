import { registerWorkerMethods } from '../../utils';
import { type AnalyserWorkerApi, rmsSize, rmsSpls, srate } from './analyser.common';

let beep: [Float32Array, Float32Array];

registerWorkerMethods<AnalyserWorkerApi>({
  init(beepData): void {
    beep = beepData;
  },
  scalePeaks(buffer: Float32Array<ArrayBuffer>): Int8Array<ArrayBuffer> {
    const peaks: Int8Array<ArrayBuffer> = new Int8Array(buffer.length);
    peaks.set(buffer.map((v) => Math.max(-127, Math.round(v * 128))));
    return peaks;
  },
  async detectBeep(
    rawBuffer: Float32Array,
    env1: Float32Array,
    env2: Float32Array,
  ): Promise<number> {
    const d1 = reduce(env1, rmsSpls);
    const d2 = reduce(env2, rmsSpls);

    const coarse = correlate([d1, d2], generateTargetEnv(1 / rmsSize)) * rmsSize;

    if (coarse < 0) {
      return 0;
    }

    const winStart = coarse - 3 * rmsSize;
    const winEnd = coarse + 4 + 3 * rmsSize;
    const fine = correlate(slice(rawBuffer, winStart * srate, winEnd * srate), beep) / srate;

    return winStart + fine + 3;
  },
});

function reduce(src: Float32Array, size: number): Float32Array {
  const res = new Float32Array(Math.floor(src.length / size));

  for (let i = 0; i < res.length; ++i) {
    res[i] = src[i * size];
  }

  return res;
}

function generateTargetEnv(sampleRate: number): [Float32Array, Float32Array] {
  const f1 = new Float32Array(4 * sampleRate);
  const f2 = new Float32Array(4 * sampleRate);

  for (let i = 0; i < 3; ++i) {
    f1.fill(1, i * sampleRate, Math.floor((i + 0.1) * sampleRate));
  }

  f2.fill(1, 3 * sampleRate, 4 * sampleRate);

  return [f1, f2];
}

function correlate(src: [Float32Array, Float32Array], tgt: [Float32Array, Float32Array]): number {
  const max = src[0].length - tgt[0].length;
  let bestScore = -Infinity;
  let bestOffset = 0;

  for (let offset = 0; offset < max; ++offset) {
    const score = correlateAt(src[0], tgt[0], offset) + correlateAt(src[1], tgt[1], offset);

    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  return bestScore >= 1 ? bestOffset : -1;
}

function correlateAt(src: Float32Array, tgt: Float32Array, offset: number): number {
  let sum = 0;
  let sumSrcSq = 0;
  let sumTgtSq = 0;

  for (let i = 0; i < tgt.length; ++i) {
    const s = src[i + offset];
    const t = tgt[i];
    sum += s * t;
    sumSrcSq += s * s;
    sumTgtSq += t * t;
  }

  const denom = Math.sqrt(sumSrcSq * sumTgtSq);
  return denom !== 0 ? sum / denom : 0;
}

function slice(buffer: Float32Array, start: number, end: number): [Float32Array, Float32Array] {
  const data = buffer.subarray(Math.max(0, start), end);
  return [data, data];
}
