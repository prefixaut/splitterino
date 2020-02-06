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
    broadcastEvent(event: string, payload?: any): void;
}

export const ELECTRON_INTERFACE_TOKEN = new InjectionToken<ElectronInterface>('electron');
