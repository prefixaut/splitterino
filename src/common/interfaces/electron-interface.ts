import { BrowserWindow, OpenDialogOptions, SaveDialogOptions, BrowserWindowConstructorOptions } from 'electron';
import { InjectionToken } from 'lightweight-di';

export interface ElectronInterface {
    getCurrentWindow(): BrowserWindow;
    reloadCurrentWindow(): void;
    closeCurrentWindow(): void;
    showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]>;
    showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string>;
    newWindow(settings: BrowserWindowConstructorOptions, route: string): void;
}

export const ELECTRON_INTERFACE_TOKEN = new InjectionToken<ElectronInterface>('electron');
