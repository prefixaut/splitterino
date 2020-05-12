import {
    BrowserWindow,
    BrowserWindowConstructorOptions,
    Menu,
    MessageBoxOptions,
    OpenDialogOptions,
    SaveDialogOptions,
} from 'electron';
import { Injectable } from 'lightweight-di';
import { VNode } from 'vue';

import { ContextMenuItem } from '../../src/models/context-menu-item';
import { ElectronServiceInterface } from '../../src/models/services';

@Injectable
export class ElectronMockService implements ElectronServiceInterface {
    private responseIsRenderProcess: boolean = false;
    private responseAppPath: string = '';
    private responseCurrentWindow: BrowserWindow = null;
    private responseOpenDialog: string[] = [];
    private responseSaveDialog: string = null;
    private responseMessageDialog: number = 0;

    isRenderProcess() {
        return this.responseIsRenderProcess;
    }

    public setResponseIsRenderProcess(value: boolean) {
        this.responseIsRenderProcess = value;
    }

    getAppPath() {
        return this.responseAppPath;
    }

    public setResponseAppPath(value: string) {
        this.responseAppPath = value;
    }

    getWindowById(id: number) {
        return null;
    }

    getCurrentWindow() {
        return this.responseCurrentWindow;
    }

    public setResponseCurrentWindow(value: BrowserWindow) {
        this.responseCurrentWindow = value;
    }

    reloadCurrentWindow() {
        // No-op
    }

    closeCurrentWindow() {
        // No-op
    }

    showOpenDialog(browserWindow: BrowserWindow, options: OpenDialogOptions): Promise<string[]> {
        return Promise.resolve(this.responseOpenDialog);
    }

    public setResponseOpenDialog(value: string[]) {
        this.responseOpenDialog = value;
    }

    showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
        return Promise.resolve(this.responseSaveDialog);
    }

    public setResponseSaveDialog(value: string) {
        this.responseSaveDialog = value;
    }

    showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number> {
        return Promise.resolve(this.responseMessageDialog);
    }

    public setResponseMessageDialog(value: number) {
        this.responseMessageDialog = value;
    }

    newWindow(settings: BrowserWindowConstructorOptions, route: string) {
        return null;
    }

    createMenu(menuItems: ContextMenuItem[], vNode: VNode): Menu {
        return null;
    }

    broadcastEvent(event: string, payload?: any) {
        // Noop
    }
}
