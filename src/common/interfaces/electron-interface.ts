import { BrowserWindow, OpenDialogOptions, SaveDialogOptions, BrowserWindowConstructorOptions, MessageBoxOptions } from 'electron';
import { InjectionToken } from 'lightweight-di';
import { ContextMenuItem } from './context-menu-item';

export interface ElectronInterface {
    getWindowById(id: number): BrowserWindow;
    getCurrentWindow(): BrowserWindow;
    reloadCurrentWindow(): void;
    closeCurrentWindow(): void;
    showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]>;
    showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string>;
    showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number>;
    newWindow(settings: BrowserWindowConstructorOptions, route: string): void;
}

export const ELECTRON_INTERFACE_TOKEN = new InjectionToken<ElectronInterface>('electron');
