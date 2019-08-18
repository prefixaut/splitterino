import {
    BrowserWindow,
    BrowserWindowConstructorOptions,
    Menu,
    MessageBoxOptions,
    OpenDialogOptions,
    SaveDialogOptions,
} from 'electron';
import { InjectionToken } from 'lightweight-di';
import { VNode } from 'vue';

import { ContextMenuItem } from './context-menu-item';
import { Observable } from 'rxjs';

export interface ActionResult {
    result?: any;
    error?: any;
}

export interface ElectronInterface {
    isRenderProcess(): boolean;
    getAppPath(): string;
    getWindowById(id: number): BrowserWindow;
    getCurrentWindow(): BrowserWindow;
    reloadCurrentWindow(): void;
    closeCurrentWindow(): void;
    showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]>;
    showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string>;
    showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number>;
    newWindow(settings: BrowserWindowConstructorOptions, route: string): BrowserWindow;
    createMenu(menuItems: ContextMenuItem[], vNode: VNode): Menu;
    ipcSend(channel: string, ...args: any[]): void;
    broadcastEvent(event: string, payload?: any): void;
    listenEvent<T>(event: string): Observable<T>;
}

export const ELECTRON_INTERFACE_TOKEN = new InjectionToken<ElectronInterface>('electron');
