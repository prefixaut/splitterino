import {
    app,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    Menu,
    MenuItemConstructorOptions,
    MessageBoxOptions,
    OpenDialogOptions,
    remote,
    SaveDialogOptions,
} from 'electron';
import { Injectable } from 'lightweight-di';
import { VNode } from 'vue';

import { FunctionRegistry } from '../common/function-registry';
import { ContextMenuItem } from '../common/interfaces/context-menu-item';
import { ElectronInterface } from '../common/interfaces/electron-interface';
import { Logger } from '../utils/logger';

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

    public isRenderProcess() {
        return !!remote;
    }

    public getAppPath() {
        return this.isRenderProcess() ? remote.app.getAppPath() : app.getAppPath();
    }

    public getWindowById(id: number): BrowserWindow {
        return BrowserWindow.fromId(id);
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

    public showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                Logger.debug('Showing message dialog');
                remote.dialog.showMessageBox(browserWindow, options, response => resolve(response));
            } catch (e) {
                Logger.debug('Error while opening message dialog:', e);
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

    public createMenu(menuItems: ContextMenuItem[], vNode: VNode): Menu {
        const contextMenu = new Menu();

        menuItems.forEach(menu => {
            const options = this.prepareMenuItemOptions(menu, vNode);
            contextMenu.append(new remote.MenuItem(options));
        });

        return contextMenu;
    }

    private prepareMenuItemOptions(menuItem: ContextMenuItem, vNode: VNode): MenuItemConstructorOptions {
        const options: MenuItemConstructorOptions = {
            label: menuItem.label,
            enabled: menuItem.enabled,
            visible: menuItem.visible,
        };

        if (Array.isArray(menuItem.actions)) {
            options.click = (electronMenuItem, browserWindow, event) => {
                menuItem.actions
                    .filter(actionName => typeof actionName === 'string' && actionName.length > 0)
                    .map(actionName => FunctionRegistry.getContextMenuAction(actionName))
                    .filter(action => typeof action === 'function')
                    .forEach(action =>
                        action({
                            vNode,
                            menuItem: electronMenuItem,
                            browserWindow,
                            event,
                        })
                    );
            };
        }

        return options;
    }
}
