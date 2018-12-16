'use strict';
import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import Vue from 'vue';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import { OverlayHostPlugin } from 'vue-overlay-host';
import Vuex from 'vuex';

import { config as storeConfig } from './store';
import { RootState } from './store/states/root';

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

// Main instance of the Vuex-Store
Vue.use(Vuex);
const store = new Vuex.Store<RootState>({
    ...storeConfig,
    plugins: [
        OverlayHostPlugin,
        vuexStore => {
            vuexStore.subscribe(mutation => {
                Object.keys(clients).forEach(id => {
                    clients[id].send('vuex-apply-mutation', mutation);
                });
            });
        }
    ]
});

// Listener to transfer the current state of the store
ipcMain.on('vuex-connect', event => {
    const windowId = BrowserWindow.fromWebContents(event.sender).id;
    console.log('[background] vuex-connect', windowId);

    clients[windowId] = event.sender;
    event.returnValue = store.state;
});

ipcMain.on('vuex-disconnect', event => {
    const windowId = BrowserWindow.fromWebContents(event.sender).id;
    console.log('[background] vuex-disconnect', windowId);

    delete clients[windowId];
});

// Listener to perform a delegate mutation on the main store
ipcMain.on('vuex-mutate', (event, { type, payload }) => {
    console.log('[background] vuex-mutate', type, payload);
    store.dispatch(type, ...payload);
});

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true });
function createMainWindow() {
    const window = new BrowserWindow({
        useContentSize: true,
        title: 'Splitterino',
        frame: false,
        titleBarStyle: 'hidden',
    });

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
