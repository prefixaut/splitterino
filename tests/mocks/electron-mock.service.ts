import { BrowserWindowConstructorOptions, BrowserWindow, OpenDialogOptions, SaveDialogOptions, MessageBoxOptions } from 'electron';

import { ElectronInterface } from '../../src/common/interfaces/electron-interface';
import { Injectable } from 'lightweight-di';

@Injectable
export class ElectronMockService implements ElectronInterface {
    getWindowById(id: number) {
        return null;
    }

    getCurrentWindow() {
        return null;
    }

    reloadCurrentWindow() {
        // No-op
    }

    closeCurrentWindow() {
        // No-op
    }

    showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]> {
        return Promise.resolve([]);
    }

    showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
        return Promise.resolve('');
    }

    showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number> {
        return Promise.resolve(0);
    }

    newWindow(settings: BrowserWindowConstructorOptions, route: string) {
        // No-op
    }
}
