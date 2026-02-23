import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import icon from '../../resources/icon.png?asset';
import { RenderOptions } from '../common';
import { analyseFile, getSavePath, render, terminate } from './api';

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 620,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('cz.geisslers.alchymisti-video');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle('file:analyse', (_, path: string) => analyseFile(path));
  ipcMain.handle('file:get-save-path', (_, prefix: string) =>
    getSavePath(prefix, BrowserWindow.getFocusedWindow() ?? undefined),
  );
  ipcMain.handle(
    'render',
    async (evt, options: Omit<RenderOptions<string>, 'onprogress' | 'signal'>) => {
      return render(evt.sender, options);
    },
  );

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('quit', () => {
  terminate();
});
