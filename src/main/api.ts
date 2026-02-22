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

export async function render(
  win: WebContents,
  options: Omit<RenderOptions<string>, 'signal' | 'onprogress'>,
): Promise<RenderResult> {
  const ctrl = new AbortController();

  try {
    ipcMain.on('render:abort', abort);
    return await ffmpeg.render({ ...options, onprogress, signal: ctrl.signal });
  } finally {
    ipcMain.off('render:abort', abort);
  }

  function abort(): void {
    ctrl.abort();
  }

  function onprogress(progress: number, time: number): void {
    win.send('render:progress', { progress, time });
  }
}
