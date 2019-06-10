'use strict';
import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import { merge } from 'lodash';
import * as path from 'path';
import { format as formatUrl } from 'url';
import Vue from 'vue';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import { OverlayHostPlugin } from 'vue-overlay-host';
import Vuex from 'vuex';

import { applicationSettingsDefaults } from './common/application-settings-defaults';
import { registerDefaultKeybindingFunctions } from './common/function-registry';
import { ActionResult } from './common/interfaces/electron';
import { IOService } from './services/io.service';
import { getStoreConfig } from './store';
import { getKeybindingsStorePlugin } from './store/plugins/keybindings';
import { RootState } from './store/states/root.state';
import { Logger } from './utils/logger';
import { createInjector } from './utils/services';

(async () => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
        // Don't load any native (external) modules until the following line is run:
        // tslint:disable-next-line no-require-imports no-var-requires
        require('module').globalPaths.push(process.env.NODE_MODULES_PATH);
    }

    // global reference to mainWindow (necessary to prevent window
    // from being garbage collected)
    let mainWindow: BrowserWindow;

    const clients: any[] = [];

    // Initialize the Dependency-Injection
    const injector = createInjector();
    const io = injector.get(IOService);

    // Main instance of the Vuex-Store
    Vue.use(Vuex);
    const store = new Vuex.Store<RootState>({
        ...getStoreConfig(injector),
        plugins: [
            OverlayHostPlugin,
            storeInstance => {
                storeInstance.subscribe(mutation => {
                    try {
                        Object.keys(clients).forEach(id => {
                            clients[id].send('vuex-apply-mutation', mutation);
                        });
                    } catch (error) {
                        Logger.error('Error while sending mutation to other processes:', JSON.stringify(mutation));
                    }
                });
            },
            getKeybindingsStorePlugin(injector),
        ]
    });

    const appSettings = await io.loadApplicationSettingsFromFile(store);

    // Setup the Keybiding Functions
    registerDefaultKeybindingFunctions();

    // Listener to transfer the current state of the store
    ipcMain.on('vuex-connect', event => {
        const windowId = BrowserWindow.fromWebContents(event.sender).id;
        Logger.debug('[background] vuex-connect', windowId);

        clients[windowId] = event.sender;
        event.returnValue = store.state;
    });

    ipcMain.on('vuex-disconnect', event => {
        const windowId = BrowserWindow.fromWebContents(event.sender).id;
        Logger.debug('[background] vuex-disconnect', windowId);

        delete clients[windowId];
    });

    // Listener to perform a delegate mutation on the main store
    ipcMain.on('vuex-dispatch', async (event, { type, payload, options }) => {
        Logger.debug('[background] vuex-dispatch', type, payload, options);
        try {
            const dispatchResult = await store.dispatch(type, payload, options);
            const eventResponse: ActionResult = { result: dispatchResult, error: null };
            event.returnValue = eventResponse;
        } catch (error) {
            const eventResponse: ActionResult = { result: null, error };
            event.returnValue = eventResponse;
        }
    });

    // Standard scheme must be registered before the app is ready
    protocol.registerStandardSchemes(['app'], { secure: true });

    function createMainWindow() {
        const loadedBrowserWindowOptions = appSettings ? appSettings.window : {};
        const browserWindowOptions = merge({}, applicationSettingsDefaults.window, loadedBrowserWindowOptions);

        const window = new BrowserWindow(browserWindowOptions);

        if (isDevelopment) {
            // Load the url of the dev server if in development mode
            window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
            if (!process.env.IS_TEST) {
                window.webContents.openDevTools({ mode: 'detach' });
            }
        } else {
            createProtocol('app');
            //   Load the index.html when not in development
            window.loadURL(
                formatUrl({
                    pathname: path.join(__dirname, 'index.html'),
                    protocol: 'file',
                    slashes: true
                })
            );
        }

        window.on('close', () => {
            io.saveApplicationSettingsToFile(mainWindow, store);
        });

        window.on('closed', () => {
            mainWindow = null;
        });

        window.webContents.on('devtools-opened', () => {
            window.focus();
            setImmediate(() => {
                window.focus();
            });
        });

        return window;
    }

    // quit application when all windows are closed
    app.on('window-all-closed', () => {
        // on macOS it is common for applications to stay open
        // until the user explicitly quits
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // on macOS it is common to re-create a window
        // even after all windows have been closed
        if (mainWindow === null) {
            mainWindow = createMainWindow();
        }
    });

    // create main BrowserWindow when electron is ready
    app.on('ready', async () => {
        if (isDevelopment && !process.env.IS_TEST) {
            // Install Vue Devtools
            await installVueDevtools();
        }
        mainWindow = createMainWindow();
    });
})();
