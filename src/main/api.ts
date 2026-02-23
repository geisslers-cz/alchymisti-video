import { dialog, ipcMain } from 'electron';
import { RenderOptions, RenderResult, VideoFileMetadata } from '../common';
import { Ffmpeg } from './ffmpeg';
import WebContents = Electron.WebContents;

const ffmpeg = new Ffmpeg();

export async function analyseFile(path: string): Promise<VideoFileMetadata> {
  return ffmpeg.analyseFile(path);
}

export async function getSavePath(
  defaultPath?: string,
  win?: Electron.BrowserWindow,
): Promise<string | undefined> {
  const opts: Electron.SaveDialogOptions = {
    defaultPath,
    buttonLabel: 'Render',
    filters: [{ name: 'Video file', extensions: ['mp4'] }],
  };

  let result: Electron.SaveDialogReturnValue;

  if (win) {
    result = await dialog.showSaveDialog(win, opts);
  } else {
    result = await dialog.showSaveDialog(opts);
  }

  return result.canceled ? undefined : result.filePath;
}

let currentRender: AbortController | undefined;

ipcMain.on('render:abort', () => {
  currentRender?.abort();
});

export async function render(
  win: WebContents,
  options: Omit<RenderOptions<string>, 'signal' | 'onprogress'>,
): Promise<RenderResult> {
  currentRender = new AbortController();

  try {
    return await ffmpeg.render({ ...options, onprogress, signal: currentRender.signal });
  } finally {
    currentRender = undefined;
  }

  function onprogress(currentTime: number): void {
    win.send('render:progress', currentTime);
  }
}

export function terminate(): void {
  currentRender?.abort();
}
