import beepUrl from '../../assets/rec-beep.wav?url';
import { TypedWorker } from '../../utils';
import { type AnalyserWorkerApi, f1, f2, rmsSpls, srate } from './analyser.common';
import workerUrl from './analyser.worker?worker&url';
import workletUrl from './worklet?url';

const worker = new TypedWorker<AnalyserWorkerApi>(workerUrl);

const globalCtx: OfflineAudioContext = new OfflineAudioContext({
  sampleRate: srate,
  length: 10 * 60 * srate,
  numberOfChannels: 1,
});

await worker.call('init', await loadBeep());

export function analyse(
  data: Promise<ArrayBuffer> | ArrayBuffer,
): [Promise<Int8Array<ArrayBuffer>>, Promise<number>] {
  const rawPeaks = decodeAudio(data);
  return [rawPeaks.then(scalePeaks), rawPeaks.then(analyseOffset)];
}

async function loadBeep(): Promise<[Float32Array, Float32Array]> {
  const response = await fetch(beepUrl);
  const buffer = await globalCtx.decodeAudioData(await response.arrayBuffer());
  return [buffer.getChannelData(0), buffer.getChannelData(1)];
}

async function decodeAudio(
  data: Promise<ArrayBuffer> | ArrayBuffer,
): Promise<Float32Array<ArrayBuffer>> {
  const buffer = await globalCtx.decodeAudioData(await data);
  return buffer.getChannelData(0);
}

async function scalePeaks(buffer: Float32Array<ArrayBuffer>): Promise<Int8Array<ArrayBuffer>> {
  return worker.call('scalePeaks', buffer);
}

async function analyseOffset(rawBuffer: Float32Array<ArrayBuffer>): Promise<number> {
  const ctx = await initAnalyserContext();

  const buffer = new AudioBuffer({
    sampleRate: srate,
    length: 30 * srate,
    numberOfChannels: 1,
  });

  buffer.copyToChannel(rawBuffer, 0);

  const src = new AudioBufferSourceNode(ctx, { buffer });
  const rms1 = bandpass(ctx, src, f1).connect(rms(ctx, rmsSpls));
  const rms2 = bandpass(ctx, src, f2).connect(rms(ctx, rmsSpls));
  const rmsWideband = src.connect(rms(ctx, rmsSpls));
  const env1 = normalize(ctx, rms1, rmsWideband);
  const env2 = normalize(ctx, rms2, rmsWideband);

  env1.connect(pan(ctx, -1)).connect(ctx.destination);
  env2.connect(pan(ctx, 1)).connect(ctx.destination);

  src.start();

  const out = await ctx.startRendering();
  return worker.call('detectBeep', rawBuffer, out.getChannelData(0), out.getChannelData(1));
}

async function initAnalyserContext(): Promise<OfflineAudioContext> {
  const ctx = new OfflineAudioContext({
    sampleRate: srate,
    length: 30 * srate,
    numberOfChannels: 2,
  });

  await ctx.audioWorklet.addModule(workletUrl);

  return ctx;
}

function bandpass(ctx: OfflineAudioContext, src: AudioNode, frequency: number): AudioNode {
  return new Array(4)
    .fill(null)
    .map(
      () =>
        new BiquadFilterNode(ctx, {
          channelCount: 1,
          type: 'bandpass',
          frequency,
          Q: 8,
        }),
    )
    .reduce((a, b) => a.connect(b), src);
}

function rms(ctx: OfflineAudioContext, size: number): AudioNode {
  return new AudioWorkletNode(ctx, 'rms', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    parameterData: { size },
  });
}

function normalize(ctx: OfflineAudioContext, bp: AudioNode, wb: AudioNode): AudioNode {
  const normalizer = new AudioWorkletNode(ctx, 'normalize', {
    numberOfInputs: 2,
    numberOfOutputs: 1,
  });

  bp.connect(normalizer, 0, 0);
  wb.connect(normalizer, 0, 1);

  return normalizer;
}

function pan(ctx: OfflineAudioContext, pan: number): AudioNode {
  return new StereoPannerNode(ctx, { pan });
}
