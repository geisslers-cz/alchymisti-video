import type { VideoFileMetadata } from '../../../../common';
import { awaited, type AwaitedState, unwrapAwaited } from '../../utils';
import { analyse } from './analyser';

export class VideoFile {
  public readonly id: string = crypto.randomUUID();
  public readonly peaks: AwaitedState<Int8Array>;
  public readonly detectedOffset: AwaitedState<number>;
  public readonly codecOffset: number;
  public readonly playbackOffset: number;
  public offset: number;
  public readonly duration: number;
  public readonly meta?: VideoFileMetadata;
  public readonly thumb?: string;
  public rotate: number;

  constructor(
    public readonly blob: File,
    public readonly audio: AwaitedState<AudioBuffer>,
    rawData: Promise<ArrayBuffer> | ArrayBuffer,
    meta: AwaitedState<VideoFileMetadata>,
  ) {
    const [peaks, offset] = analyse(rawData);
    this.peaks = awaited(() => peaks);
    this.detectedOffset = awaited(() => offset);
    this.offset = $derived(unwrapAwaited(this.detectedOffset, (o) => -(o ?? 0)));
    this.duration = $derived(unwrapAwaited(this.audio, (b) => b?.duration ?? 0));
    this.meta = $derived(unwrapAwaited(meta));
    this.thumb = $derived(
      this.meta && URL.createObjectURL(new Blob([this.meta.thumbnail], { type: 'image/jpeg' })),
    );
    this.codecOffset = $derived(this.meta?.offset ?? 0);
    this.playbackOffset = $derived(this.offset + this.codecOffset);
    this.rotate = $state(0);
  }

  get name(): string {
    return this.blob.name;
  }
}
