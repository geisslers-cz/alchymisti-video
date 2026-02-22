import type { WorkerApi } from '../../utils';

export const srate = 8000;
export const rmsSize = 0.02;
export const rmsSpls = rmsSize * srate;
export const f1 = 590;
export const f2 = f1 * 2;

export interface AnalyserWorkerApi extends WorkerApi {
  init(beep: [Float32Array, Float32Array]): void;
  scalePeaks(buffer: Float32Array<ArrayBuffer>): Int8Array<ArrayBuffer>;
  detectBeep(rawBuffer: Float32Array, env1: Float32Array, env2: Float32Array): Promise<number>;
}
