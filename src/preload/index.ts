import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { MainProcessApi, RenderOptions, RenderResult, VideoFileMetadata } from '../common';
import IpcRendererEvent = Electron.IpcRendererEvent;

// eslint-disable-next-line no-control-regex
const unixPrefixPattern = /^((?:\/[^\x00/]+)+)(?=\/|\x00|$)[^\x00]*(?:\x00\1[^\x00]*)*$/i;
const windowsPrefixPattern =
  // eslint-disable-next-line no-control-regex
  /^([0-9a-z]+:(?:\\[^\x00\\]+)*)(?=\\|\x00|$)[^\x00]*(?:\x00\1[^\x00]*)*$/i;

const main: MainProcessApi = {
  async analyseFile(file: File): Promise<VideoFileMetadata> {
    const path = webUtils.getPathForFile(file);
    return ipcRenderer.invoke('file:analyse', path);
  },
  async getSavePath(files: File[]): Promise<string | undefined> {
    const paths = files.map((file) => webUtils.getPathForFile(file)).join('\x00');
    const prefix = /^[0-9a-z]+:\\/i.test(paths)
      ? paths.match(windowsPrefixPattern)
      : paths.match(unixPrefixPattern);

    return ipcRenderer.invoke('file:get-save-path', prefix?.[1]);
  },
  async render({ files, onprogress, ...options }: RenderOptions<File>): Promise<RenderResult> {
    try {
      ipcRenderer.on('render:progress', handleProgress);

      return await ipcRenderer.invoke('render', {
        files: files.map(({ file, ...info }) => ({
          file: webUtils.getPathForFile(file),
          ...info,
        })),
        ...options,
      });
    } finally {
      ipcRenderer.off('render:progress', handleProgress);
    }

    function handleProgress(_: IpcRendererEvent, currentTime: number): void {
      onprogress?.(currentTime);
    }
  },
  abortRender(): void {
    ipcRenderer.send('render:abort');
  },
};

try {
  contextBridge.exposeInMainWorld('main', main);
} catch (error) {
  console.error(error);
}
