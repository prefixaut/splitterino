import { BrowserWindow, BrowserWindowConstructorOptions, OpenDialogOptions, remote, SaveDialogOptions } from 'electron';
import { Injectable } from 'lightweight-di';

import { Logger } from '../utils/logger';
import { ElectronInterface } from '../common/interfaces/electron-interface';

@Injectable
export class ElectronService implements ElectronInterface {
    private readonly defaultWindowSettings: BrowserWindowConstructorOptions = {
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

    private readonly url = 'http://localhost:8080#';

    constructor() {
        // No dependencies yet
    }

    public getCurrentWindow(): BrowserWindow {
        return remote.getCurrentWindow();
    }

    public reloadCurrentWindow() {
        location.reload();
    }

    public closeCurrentWindow() {
        this.getCurrentWindow().close();
    }

    public showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]> {
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

    public showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
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

    public newWindow(settings: BrowserWindowConstructorOptions, route: string = '') {
        const win = new remote.BrowserWindow({
            ...this.defaultWindowSettings,
            ...settings,
        });

        if (!process.env.IS_TEST) {
            win.webContents.openDevTools({ mode: 'detach' });
        }

        win.loadURL(this.url + route);
        win.show();
    }
}
