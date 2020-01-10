import {
    app,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    dialog,
    Menu,
    MenuItemConstructorOptions,
    MessageBoxOptions,
    OpenDialogOptions,
    remote,
    SaveDialogOptions,
} from 'electron';
import { Inject, Injectable } from 'lightweight-di';
import { merge } from 'lodash';
import { join } from 'path';
import { format as formatUrl } from 'url';
import { v4 as uuid } from 'uuid';
import { VNode } from 'vue';

import { FunctionRegistry } from '../common/function-registry';
import { IPC_CLIENT_TOKEN, IPCClient } from '../common/ipc/client';
import { ContextMenuItem } from '../models/context-menu-item';
import { ElectronInterface } from '../models/electron';
import { MessageType, PublishGlobalEventRequest } from '../models/ipc';
import { isDevelopment } from '../utils/is-development';
import { Logger } from '../utils/logger';

export const DEFAULT_WINDOW_SETTINGS: BrowserWindowConstructorOptions = {
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

@Injectable
export class ElectronService implements ElectronInterface {
    private readonly url = 'http://localhost:8080#';

    constructor(@Inject(IPC_CLIENT_TOKEN) protected ipcClient: IPCClient) { }

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
        Logger.debug('Opening "open-file" dialog ...');
        const dialogToUse = this.isRenderProcess() ? remote.dialog : dialog;

        return dialogToUse.showOpenDialog(browserWindow, options).then(result => {
            Logger.debug({
                msg: '"open-file" dialog closed',
                result,
            });

            return result.filePaths;
        }).catch(error => {
            Logger.debug({
                msg: 'Error while opening "open-file" dialog',
                error,
            });

            throw error;
        });
    }

    public showSaveDialog(browserWindow: BrowserWindow, options: SaveDialogOptions): Promise<string> {
        Logger.debug('Opening "save-file" dialog ...');
        const dialogToUse = this.isRenderProcess() ? remote.dialog : dialog;

        return dialogToUse.showSaveDialog(browserWindow, options).then(result => {
            Logger.debug({
                msg: '"save-file" dialog closed',
                result,
            });

            return result.filePath;
        }).catch(error => {
            Logger.debug({
                msg: 'Error while opening "save-file" dialog',
                error,
            });

            throw error;
        });
    }

    public showMessageDialog(browserWindow: BrowserWindow, options: MessageBoxOptions): Promise<number> {
        Logger.debug('Opening "message" dialog');
        const dialogToUse = this.isRenderProcess() ? remote.dialog : dialog;

        return dialogToUse.showMessageBox(browserWindow, options).then(result => {
            Logger.debug({
                msg: '"message" dialog closed',
                result,
            });

            return result.response;
        }).catch(error => {
            Logger.debug({
                msg: 'Error while opening "message" dialog',
                error,
            });

            throw error;
        });
    }

    public newWindow(settings: BrowserWindowConstructorOptions, route: string = ''): BrowserWindow {
        Logger.debug({
            msg: 'Creating new window ...',
            settings,
            route
        });

        try {
            const win = new remote.BrowserWindow(merge({}, DEFAULT_WINDOW_SETTINGS, settings));

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
        } catch (error) {
            Logger.error({
                msg: 'Error while creating a new window!',
                error,
            });

            // Bubble the error up
            throw error;
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
        // Has some additional properties that are not really necessary
        // Filtering out these properties is also not that useful
        const options: MenuItemConstructorOptions = menuItem;

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

    /**
     * Send event to background process and all renderer processes
     * @param event Event ID to send
     * @param payload Optional payload to send with event
     */
    public broadcastEvent(event: string, payload?: any) {
        if (this.isRenderProcess()) {
            Logger.trace({
                msg: 'Broadcast event sent',
                event: event,
                payload: payload
            });

            const message: PublishGlobalEventRequest = {
                id: uuid(),
                type: MessageType.REQUEST_PUBLISH_GLOBAL_EVENT,
                eventName: event,
                payload: payload
            };
            this.ipcClient.sendPushMessage(message);
        }
    }
}
