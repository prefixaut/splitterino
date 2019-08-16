import {
    app,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    dialog,
    ipcRenderer,
    Menu,
    MenuItemConstructorOptions,
    MessageBoxOptions,
    OpenDialogOptions,
    remote,
    SaveDialogOptions,
} from 'electron';
import { Injectable } from 'lightweight-di';
import { VNode } from 'vue';
import { format as formatUrl } from 'url';
import { Subject } from 'rxjs';

import { FunctionRegistry } from '../common/function-registry';
import { ContextMenuItem } from '../common/interfaces/context-menu-item';
import { ElectronInterface } from '../common/interfaces/electron';
import { Logger } from '../utils/logger';
import { join } from 'path';
import { isDevelopment } from '../utils/is-development';

@Injectable
export class ElectronService implements ElectronInterface {
    private readonly defaultWindowSettings: BrowserWindowConstructorOptions = {
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true
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
        return this.isRenderProcess() ? remote.getCurrentWindow() : BrowserWindow.getFocusedWindow();
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
                Logger.debug('Opening "open-file" dialog ...');
                const dialogToUse = this.isRenderProcess() ? remote.dialog : dialog;
                const paths = dialogToUse.showOpenDialog(browserWindow, options);
                Logger.debug({
                    msg: '"open-file" dialog closed',
                    files: paths,
                });
                resolve(paths);
            } catch (e) {
                Logger.debug({
                    msg: 'Error while opening "open-file" dialog',
                    error: e
                });
                reject(e);
            }
        });
    }

    public showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                Logger.debug('Opening "save-file" dialog ...');
                const dialogToUse = this.isRenderProcess() ? remote.dialog : dialog;
                dialogToUse.showSaveDialog(browserWindow, options, path => {
                    Logger.debug({
                        msg: '"save-file" dialog closed',
                        file: path,
                    });
                    resolve(path);
                });
            } catch (e) {
                Logger.debug({
                    msg: 'Error while opening "save-file" dialog',
                    error: e
                });
                reject(e);
            }
        });
    }

    public showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                Logger.debug('Opening "message" dialog');
                const dialogToUse = this.isRenderProcess() ? remote.dialog : dialog;
                dialogToUse.showMessageBox(browserWindow, options, response => {
                    Logger.debug({
                        msg: '"message" dialog closed',
                        response,
                    });
                    resolve(response);
                });
            } catch (e) {
                Logger.debug({
                    msg: 'Error while opening "message" dialog',
                    error: e
                });
                reject(e);
            }
        });
    }

    public newWindow(settings: BrowserWindowConstructorOptions, route: string = ''): BrowserWindow {
        Logger.debug({
            msg: 'Creating new window ...',
            settings,
            route
        });

        try {
            const win = new remote.BrowserWindow({
                ...this.defaultWindowSettings,
                ...settings,
            });

            if (isDevelopment()) {
                win.webContents.openDevTools({ mode: 'detach' });
            }

            let url: string;
            if (isDevelopment()) {
                url = this.url + route;
            } else {
                url = formatUrl({
                    pathname: join(__dirname, 'index.html'),
                    protocol: 'file',
                    slashes: true,
                    hash: route
                });
            }

            win.loadURL(url);
            win.show();

            Logger.debug({
                msg: 'Window successfully created',
                window: win
            });

            return win;
        } catch (err) {
            Logger.error({
                msg: 'Error while creating a new window!',
                error: err,
            });

            // Bubble the error up
            throw err;
        }
    }

    public createMenu(menuItems: ContextMenuItem[], vNode: VNode): Menu {
        const contextMenu = new remote.Menu();

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

    public ipcSend(channel: string, ...args: any[]): void {
        if (this.isRenderProcess()) {
            ipcRenderer.send(channel, ...args);
        } else {
            // Do nothing?
        }
    }

    public ipcReceive(channel: string): Subject<any> {
        const subject = new Subject<any>();

        if (this.isRenderProcess()) {
            ipcRenderer.on(channel, (data: any) => {
                subject.next(data);
            });
        }

        return subject;
    }
}
