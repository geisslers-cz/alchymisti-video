export type VideoFileMetadata = {
  thumbnail: ArrayBuffer;
  width: number;
  height: number;
  rotation: number;
  offset: number;
};

export type FileRenderOptions<Src> = {
  file: Src;
  seek: number;
  rotate: number;
};

export type RenderOptions<Src> = {
  files: FileRenderOptions<Src>[];
  outputPath: string;
  duration: number;
  onprogress?: (currentTime: number) => void;
};

export type RenderResult = {
  success: boolean;
  message?: string;
};

export interface MainProcessApi {
  analyseFile(file: File): Promise<VideoFileMetadata>;
  getSavePath(files: File[]): Promise<string | undefined>;
  render(options: RenderOptions<File>): Promise<RenderResult>;
  abortRender(): void;
}
