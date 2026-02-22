// declare const currentFrame: number;
// declare const currentTime: number;
// declare const sampleRate: number;

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;

  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

declare interface AudioWorkletProcessorConstructor {
  new (options: any): AudioWorkletProcessor;
}

declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor,
): void;

class RmsProcessor extends AudioWorkletProcessor {
  private rms: RmsCalculator;

  static get parameterDescriptors() {
    return [
      {
        name: 'size',
        defaultValue: 100,
        minValue: 0,
        maxValue: 1000,
        automationRate: 'k-rate',
      },
    ];
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    params: Record<string, Float32Array>,
  ): boolean {
    const inCh = inputs[0][0];
    const outCh = outputs[0][0];
    const size = params.size[0];
    const n = inCh.length;

    if (size !== this.rms?.size) {
      this.rms = new RmsCalculator(size);
    }

    for (let i = 0; i < n; ++i) {
      outCh[i] = this.rms.push(inCh[i]);
    }

    return true;
  }
}

class RmsCalculator {
  private readonly values: number[];
  private sum: number = 0;
  private index: number = -1;

  constructor(readonly size: number) {
    this.values = new Array(this.size).fill(0);
  }

  push(value: number): number {
    const sq = value * value;
    this.index = (this.index + 1) % this.size;
    this.sum += sq - this.values[this.index];
    this.values[this.index] = sq;
    return this.sum / this.size;
  }
}

const $eps = 1e-8;

class NormalizeProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const envIn = inputs[0][0];
    const rmsIn = inputs[1][0];
    const out = outputs[0][0];
    const n = envIn.length;

    for (let i = 0; i < n; ++i) {
      out[i] = envIn[i] / (rmsIn[i] + $eps);
    }

    return true;
  }
}

registerProcessor('rms', RmsProcessor);
registerProcessor('normalize', NormalizeProcessor);
