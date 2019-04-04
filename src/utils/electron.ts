import { BrowserWindow, BrowserWindowConstructorOptions, OpenDialogOptions, remote, SaveDialogOptions } from 'electron';

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
    return new Promise((resolve, reject) => {
        try {
            Logger.debug('Showing Open-File dialog');
            const paths = remote.dialog.showOpenDialog(browserWindow, options);
            resolve(paths);
        } catch (e) {
            Logger.debug('Error while opening file open dialog:', e);
            reject(e);
        }
    });
}

export function showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            Logger.debug('Showing Save-File dialog');
            remote.dialog.showSaveDialog(browserWindow, options, path => resolve(path));
        } catch (e) {
            Logger.debug('Error while opening file save dialog:', e);
            reject(e);
        }
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
