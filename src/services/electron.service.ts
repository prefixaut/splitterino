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
import { ContextMenuItem } from '../models/context-menu-item';
import {
    ContextMenuTriggerBroadcast,
    IPCClientInterface,
    IPCServerInterface,
    MessageType,
    PublishGlobalEventRequest,
} from '../models/ipc';
import { ElectronServiceInterface, IPC_CLIENT_SERVICE_TOKEN, IPC_SERVER_SERVICE_TOKEN } from '../models/services';
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
export class ElectronService implements ElectronServiceInterface {
    private readonly url = 'http://localhost:8080#';

    constructor(
        @Inject(IPC_CLIENT_SERVICE_TOKEN) protected ipcClient: IPCClientInterface,
        @Inject(IPC_SERVER_SERVICE_TOKEN) protected ipcServer: IPCServerInterface
    ) { }

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
                window: win.id,
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
                    .forEach(actionName => {
                        const fn = FunctionRegistry.getContextMenuAction(actionName);

                        if (typeof fn === 'function') {
                            fn({
                                vNode,
                                menuItem: electronMenuItem,
                                browserWindow,
                                event,
                            });
                        }

                        if (this.ipcServer != null) {
                            const msg: ContextMenuTriggerBroadcast = {
                                id: uuid(),
                                type: MessageType.BROADCAST_CONTEXT_MENU_TRIGGER,
                                contextMenu: actionName,
                            };
                            this.ipcServer.publishMessage(msg);
                        }
                    });
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
