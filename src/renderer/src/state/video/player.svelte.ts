import { SvelteSet } from 'svelte/reactivity';
import type { RenderResult } from '../../../../common';
import { awaited, type AwaitedState } from '../../utils';
import { VideoFile } from './file.svelte';

export enum PlaybackState {
  Stopped = 'stopped',
  Paused = 'paused',
  Playing = 'playing',
}

type NowPlaying = {
  node: AudioBufferSourceNode;
  offset: number;
};

export class RenderState {
  public progress: number = $state(0);
  public time: number = $state(0);

  constructor(private job: AwaitedState<RenderResult>) {}

  get done(): boolean {
    return this.job.resolved;
  }

  get ok(): boolean {
    return this.job.resolved && this.job.result.success;
  }

  get message(): string | undefined {
    return this.job.resolved ? this.job.result.message : this.job.error?.message;
  }

  abort(): void {
    window.main.abortRender();
  }
}

export class Player {
  public timelineStart: number = -30;
  public timelineEnd: number;
  public playhead: number = $state(0);
  public playbackState: PlaybackState = $state(PlaybackState.Stopped);
  public lastPlaybackStart: number = 0;
  public renderStart: number = $state(2);
  public renderEnd: number;

  private readonly ctx: AudioContext = new AudioContext();
  private readonly videoFiles: Set<VideoFile> = new SvelteSet();
  private readonly nowPlaying: Map<VideoFile, NowPlaying> = new Map();
  private ctxT0: number = 0;
  private nextTick?: number;

  constructor() {
    this.timelineEnd = $derived(
      Math.round(Math.max(300, ...[...this.videoFiles].map((f) => f.duration + 30))),
    );
    this.renderEnd = $derived(
      Math.round(
        Math.min(
          this.timelineEnd,
          ...[...this.videoFiles].filter((f) => f.duration > 0).map((f) => f.duration - 5),
        ),
      ),
    );
  }

  get files(): ReadonlySet<VideoFile> {
    return this.videoFiles;
  }

  add(file: File): void {
    this.videoFiles.add(
      new VideoFile(
        file,
        awaited(async () => this.ctx.decodeAudioData(await file.arrayBuffer())),
        file.arrayBuffer(),
        awaited(async () => window.main.analyseFile(file)),
      ),
    );
  }

  remove(file: VideoFile): void {
    this.videoFiles.delete(file);
  }

  setOrder(files: Iterable<VideoFile>): void {
    const orig = new Set(this.videoFiles);
    this.videoFiles.clear();

    for (const file of files) {
      if (orig.has(file)) {
        this.videoFiles.add(file);
        orig.delete(file);
      }
    }

    for (const file of orig) {
      this.videoFiles.add(file);
    }
  }

  get canRender(): boolean {
    if (this.videoFiles.size !== 5) {
      return false;
    }

    for (const file of this.videoFiles) {
      if (!file.meta || !file.duration || !file.detectedOffset.resolved) {
        return false;
      }
    }

    return true;
  }

  render(outputPath: string): RenderState {
    const job = new RenderState(
      awaited(async () => {
        try {
          return await window.main.render({
            files: [...this.videoFiles].map((file) => ({
              file: file.blob,
              seek: this.renderStart - file.offset,
              rotate: file.rotate,
            })),
            outputPath,
            duration: this.renderEnd - this.renderStart,
            onprogress: (progress, time) => {
              job.progress = progress;
              job.time = time;
            },
          });
        } catch (e: any) {
          return {
            success: false,
            message: e.message,
          };
        }
      }),
    );

    return job;
  }

  play(): void {
    if (this.playbackState === PlaybackState.Playing) {
      return;
    }

    const t0 = this.ctx.currentTime + 0.01;

    for (const file of this.videoFiles) {
      if (
        file.audio.resolved &&
        !file.audio.error &&
        file.playbackOffset + file.duration > this.playhead
      ) {
        const node = this.playFile(file, t0);
        this.nowPlaying.set(file, { node, offset: file.playbackOffset });
      }
    }

    if (!this.nowPlaying.size) {
      return;
    }

    this.playbackState = PlaybackState.Playing;
    this.lastPlaybackStart = this.playhead;
    this.ctxT0 = t0;
    this.nextTick = requestAnimationFrame(this.tick);
  }

  private readonly tick = (): void => {
    this.nextTick = requestAnimationFrame(this.tick);
    const t = this.ctx.currentTime;
    const dt = t - this.ctxT0;
    this.playhead = this.lastPlaybackStart + dt;

    for (const [file, info] of this.nowPlaying) {
      if (file.playbackOffset !== info.offset) {
        info.node.stop();
        info.node.disconnect();

        if (file.playbackOffset + file.duration < this.playhead) {
          this.nowPlaying.delete(file);
          continue;
        }

        info.node = this.playFile(file, this.ctxT0);
        info.offset = file.playbackOffset;
      }

      if (file.playbackOffset + file.duration < this.playhead) {
        info.node.disconnect();
        this.nowPlaying.delete(file);
      }
    }

    for (const file of this.videoFiles) {
      if (this.nowPlaying.has(file) || file.playbackOffset + file.duration < this.playhead) {
        continue;
      }

      const node = this.playFile(file, this.ctxT0);
      this.nowPlaying.set(file, { node, offset: file.playbackOffset });
    }

    if (!this.nowPlaying.size) {
      this.stop();
    }
  };

  private playFile(file: VideoFile, t0: number): AudioBufferSourceNode {
    const node = new AudioBufferSourceNode(this.ctx, { buffer: file.audio.result });
    node.connect(this.ctx.destination);

    if (file.playbackOffset >= this.playhead) {
      node.start(t0 + file.playbackOffset - this.playhead);
    } else {
      node.start(t0, this.playhead - file.playbackOffset);
    }

    return node;
  }

  stop(): void {
    if (this.playbackState !== PlaybackState.Playing) {
      return;
    }

    this.stopPlayback();
    this.playhead = this.lastPlaybackStart;
    this.playbackState = PlaybackState.Stopped;
  }

  pause(): void {
    if (this.playbackState !== PlaybackState.Playing) {
      return;
    }

    this.stopPlayback();
    this.playbackState = PlaybackState.Paused;
  }

  private stopPlayback(): void {
    cancelAnimationFrame(this.nextTick);

    for (const { node } of this.nowPlaying.values()) {
      node.stop();
      node.disconnect();
    }

    this.nowPlaying.clear();
  }

  seekTo(time: number): void {
    const wasPlaying = this.playbackState === PlaybackState.Playing;
    this.pause();
    this.playhead = Math.max(this.timelineStart, Math.min(this.timelineEnd, time));

    if (wasPlaying) {
      this.play();
    }
  }
}
