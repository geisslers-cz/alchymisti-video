import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import path from 'path';
import process from 'process';
import { RenderOptions, RenderResult, VideoFileMetadata } from '../common';

type FfmpegProgressEvent = {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number;
};

const PADDING = 8;

type MainRenderOptions = RenderOptions<string> & {
  signal?: AbortSignal;
};

export class Ffmpeg {
  constructor() {
    const mac = os.platform() === 'darwin';
    const resourcesPath = process.resourcesPath.includes('node_modules')
      ? path.resolve(__dirname, `../../lib/${mac ? 'mac' : 'win'}`)
      : process.resourcesPath;
    const ext = mac ? '' : '.exe';

    ffmpeg.setFfmpegPath(path.join(resourcesPath, 'bin', `ffmpeg${ext}`));
    ffmpeg.setFfprobePath(path.join(resourcesPath, 'bin', `ffprobe${ext}`));
  }

  async analyseFile(path: string): Promise<VideoFileMetadata> {
    const [meta, thumbnail] = await Promise.all([this.getMetadata(path), this.getThumbnail(path)]);
    return { ...meta, thumbnail };
  }

  private async getMetadata(path: string): Promise<Omit<VideoFileMetadata, 'thumbnail'>> {
    const { promise, resolve, reject } =
      Promise.withResolvers<Omit<VideoFileMetadata, 'thumbnail'>>();

    ffmpeg(path).ffprobe((err, info) => {
      if (err) {
        return reject(err);
      }

      const audio = info.streams.find((stream) => stream.codec_type === 'audio');
      const video = info.streams.find((stream) => stream.codec_type === 'video');

      if (!audio || !video) {
        return reject(new Error(`No ${!audio ? 'audio ' : !video ? 'video ' : ''}streams found`));
      }

      resolve({
        width: video.width ?? video.coded_width ?? 0,
        height: video.height ?? video.coded_height ?? 0,
        rotation: this.parseRotation(video.rotation) ?? 0,
        offset: (audio.start_time ?? 0) - (video.start_time ?? 0),
      });
    });

    return promise;
  }

  private async getThumbnail(path: string): Promise<ArrayBuffer> {
    const { promise, resolve, reject } = Promise.withResolvers<ArrayBuffer>();
    const stream = ffmpeg(path)
      .addInputOption('-display_rotation', '0')
      .videoFilter([
        "scale='640:640:force_original_aspect_ratio=decrease:force_divisible_by=2'",
        'setsar=1/1',
      ])
      .frames(1)
      .format('mjpeg')
      .pipe(undefined, { end: true });

    const chunks: ArrayBuffer[] = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk.buffer);
    });

    stream.on('end', async () => {
      resolve(await new Blob(chunks).arrayBuffer());
    });

    stream.on('error', reject);

    return promise;
  }

  async render({
    files,
    outputPath,
    duration,
    onprogress,
    signal,
  }: MainRenderOptions): Promise<RenderResult> {
    const { resolve, promise }: PromiseWithResolvers<RenderResult> = Promise.withResolvers();
    const cmd = ffmpeg();

    for (const video of files) {
      cmd.addInput(video.file).seekInput(video.seek).addInputOption('-display_rotation', '0');
    }

    const videoWidth = Math.floor((1920 - 4 * PADDING) / 5);
    const panelWidth = videoWidth + PADDING;
    let aborted = false;

    cmd
      .complexFilter([
        '[0:a][1:a][2:a][3:a][4:a] amerge=inputs=5, pan=1c|c0=c0+c1+c2+c3+c4 [oa]',
        ...files.map((video, idx) => this.formatFilter(idx, videoWidth, video.rotate)),
        ...range(1, 4).map((p, o) => `[o${o}][p${p}] overlay=${p * panelWidth} [o${p}]`),
        `[o4] fade=type=out:start_time=${duration - 4}:duration=4 [ov]`,
      ])
      .map('[ov]')
      .map('[oa]');

    cmd.on('progress', (evt: FfmpegProgressEvent) => {
      if (!aborted) {
        onprogress?.(this.parseTimemark(evt.timemark));
      }
    });

    cmd.on('end', () => {
      signal?.removeEventListener('abort', abort);
      onprogress?.(duration);
      resolve({ success: true });
    });

    cmd.on('error', (e: any) => {
      if (aborted) {
        return;
      }

      console.log('FFMPEG ERROR:');
      console.log(e);
      console.log('Command:');
      console.log(
        `ffmpeg ${cmd
          ._getArguments()
          .map((a: string) => `'${a}'`)
          .join(' ')}`,
      );
      signal?.removeEventListener('abort', abort);
      resolve({ success: false, message: 'Error during render' });
    });

    signal?.addEventListener('abort', abort);

    cmd
      .videoCodec('libx264')
      .addOption('-crf', '18')
      .withDuration(duration)
      .output(outputPath)
      .run();

    return promise;

    function abort(): void {
      aborted = true;
      resolve({ success: false, message: 'Render aborted' });
      cmd.kill('SIGTERM');
    }
  }

  private formatFilter(idx: number, videoWidth: number, rotate: number): string {
    const chain: (string | undefined)[] = [
      this.maybeRotate(rotate),
      'scale=608:1080',
      `crop=${videoWidth}`,
      idx === 0 ? `pad=1920:1080` : undefined,
    ];

    return `[${idx}:v] ${chain.filter((f) => f !== undefined).join(' , ')} [${idx > 0 ? 'p' : 'o'}${idx}]`;
  }

  private maybeRotate(rotate: number): string | undefined {
    switch (rotate) {
      case 90:
        return 'transpose=clock';
      case 180:
        return 'hflip, vflip';
      case 270:
        return 'transpose=cclock';
      default:
        return undefined;
    }
  }

  private parseRotation(rotation?: number | string): number | undefined {
    switch (typeof rotation) {
      case 'string':
        return rotation.length ? parseFloat(rotation) : undefined;
      case 'number':
        return rotation;
      default:
        return undefined;
    }
  }

  private parseTimemark(timemark: string): number {
    if (!/^(\d+:)*\d+(\.\d+)?$/.test(timemark)) {
      return 0;
    }

    return timemark
      .split(/:/g)
      .map(parseFloat)
      .reverse()
      .reduce((s, p, i) => s + p * 60 ** i);
  }
}

function range(start: number, end: number): number[] {
  return [...new Array(end - start + 1).keys()].map((v) => v + start);
}
