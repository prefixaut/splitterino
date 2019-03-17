import { BrowserWindow, BrowserWindowConstructorOptions, dialog, OpenDialogOptions, remote, SaveDialogOptions } from 'electron';

import { Logger } from './logger';

const defSettings: BrowserWindowConstructorOptions = {
    webPreferences: {
        webSecurity: false,
    },
    useContentSize: true,
    title: 'Splitterino',
    frame: false,
    titleBarStyle: 'hidden',
    minWidth: 440,
    minHeight: 220,
};

const url = 'http://localhost:8080#';

export function reloadWindow() {
    location.reload();
}

export function closeWindow() {
    remote.getCurrentWindow().close();
}

export function showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]> {
    return new Promise(resolve => {
        Logger.debug('Showing Open-File dialog');
        dialog.showOpenDialog(browserWindow, options, paths => {
            resolve(paths);
        });
    });
}

export function showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
    return new Promise(resolve => {
        Logger.debug('Showing Save-File dialog');
        dialog.showSaveDialog(browserWindow, options, path => {
            resolve(path);
        });
    });
}

export function newWindow(settings: BrowserWindowConstructorOptions, route: string = '') {
    const win = new remote.BrowserWindow({
        ...defSettings,
        ...settings,
    });

    if (!process.env.IS_TEST) {
        win.webContents.openDevTools({ mode: 'detach' });
    }

    win.loadURL(url + route);
    win.show();
}
