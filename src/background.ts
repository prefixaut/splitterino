'use strict';
import { app, BrowserWindow, protocol } from 'electron';
import { join } from 'path';
import * as pino from 'pino';
import { format as formatUrl } from 'url';
import uuid from 'uuid';
import Vue from 'vue';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import Vuex from 'vuex';

import { registerDefaultKeybindingFunctions } from './common/function-registry';
import { IPCServer } from './common/ipc-server';
import { CommitMutationRequest, MessageType } from './models/ipc';
import { RootState } from './models/states/root.state';
import { IO_SERVICE_TOKEN } from './services/io.service';
import { getStoreConfig } from './store';
import { ACTION_SET_BINDINGS } from './store/modules/keybindings.module';
import { getKeybindingsStorePlugin } from './store/plugins/keybindings';
import { parseArguments } from './utils/arguments';
import { isDevelopment } from './utils/is-development';
import { Logger, LogLevel } from './utils/logger';
import { createInjector } from './utils/services';

process.on('uncaughtException', (error: Error) => {
    Logger.fatal({
        msg: 'Uncaught Exception in background process!',
        error: error,
    });

    Logger.trace({
        error: error.stack
    });

    // exit the application safely
    // FIXME: Does not actually quit app
    app.exit(1);

    // end the process
    process.exit(1);
});

// handle unhandled rejections in main thread
process.on('unhandledRejection', (reason, promise) => {
    Logger.fatal({
        msg: 'There was an unhandled Rejection in the background process!',
        promise,
        error: reason,
    });
});

(async () => {
    if (isDevelopment()) {
        // Don't load any native (external) modules until the following line is run:
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('module').globalPaths.push(process.env.NODE_MODULES_PATH);
    }

    // prevent second instance from starting
    const singleInstanceLock = app.requestSingleInstanceLock();
    if (!singleInstanceLock) {
        app.quit();

        return;
    }

    // Standard scheme must be registered before the app is ready
    protocol.registerSchemesAsPrivileged([{
        scheme: 'app',
        privileges: {
            secure: true,
            standard: true
        }
    }]);

    /**
     * global reference of the main window.
     * necessary to prevent window from being garbage collected.
     */
    let mainWindow: BrowserWindow;

    /** Instance of an injector with resolved services */
    const injector = createInjector();

    /** Parsed command line arguments */
    const args = parseArguments();

    // Initialize the logger
    Logger.initialize(injector, args.logLevel);

    // Setting up a log-handler which logs the messages to a file
    const io = injector.get(IO_SERVICE_TOKEN);
    const logFile = join(io.getAssetDirectory(), 'application.log');
    Logger.registerHandler(pino.destination(logFile), { level: args.logLevel });

    // Create the IPC Server
    const ipcServer = new IPCServer();

    // Main instance of the Vuex-Store
    Vue.use(Vuex);
    const store = new Vuex.Store<RootState>({
        ...getStoreConfig(injector),
        plugins: [
            storeInstance => {
                storeInstance.subscribe(mutation => {
                    try {
                        const commitRequest: CommitMutationRequest = {
                            id: uuid(),
                            type: MessageType.REQUEST_COMMIT_MUTATION,
                            mutation: mutation.type,
                            payload: mutation.payload,
                        };
                        ipcServer.publishMessage(commitRequest);
                    } catch (error) {
                        Logger.error({
                            msg: 'Error while sending mutation to other processes',
                            mutation,
                            error,
                        });
                    }
                });
            },
            getKeybindingsStorePlugin(injector),
        ]
    });

    // Initialize the IPC Server with the store
    await ipcServer.initialize({
        store: store,
        logLevel: args.logLevel || LogLevel.INFO
    });

    // load application settings
    const appSettings = await io.loadApplicationSettingsFromFile(store, args.splitsFile);
    // load user settings
    await io.loadSettingsFromFileToStore(store);

    // Setup the Keybiding Functions
    registerDefaultKeybindingFunctions();

    async function createMainWindow() {
        const window = new BrowserWindow(appSettings.windowOptions);

        if (isDevelopment() && !process.env.IS_TEST) {
            // Install Vue Devtools
            await installVueDevtools();
        }

        if (isDevelopment()) {
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
                    pathname: join(__dirname, 'index.html'),
                    protocol: 'file',
                    slashes: true
                })
            );
        }

        // save app settings before main window close
        window.on('close', () => {
            io.saveApplicationSettingsToFile(mainWindow, store);
        });

        // free window variable after close to avoid usage afterwards
        window.on('closed', () => {
            mainWindow = null;
        });

        window.webContents.on('devtools-opened', () => {
            window.focus();
            setImmediate(() => {
                window.focus();
            });
        });

        mainWindow = window;
    }

    // catch event in case second instance is started
    app.on('second-instance', () => {
        // ? Maybe handle file associations when instance alreay exists
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });

    // quit application when all windows are closed
    app.on('window-all-closed', () => {
        // on macOS it is common for applications to stay open
        // until the user explicitly quits
        if (process.platform !== 'darwin') {
            // Close the IPC Server
            // ipcServer.close();
            // Close the app
            app.quit();
        }
    });

    app.on('activate', () => {
        // on macOS it is common to re-create a window
        // even after all windows have been closed
        if (mainWindow === null) {
            createMainWindow();
        }
    });

    // create main BrowserWindow when electron is ready
    app.on('ready', () => {
        // Load the keybindings once the application is actually loaded
        // Has to be done before creating the main window.
        if (Array.isArray(appSettings.keybindings)) {
            store.dispatch(ACTION_SET_BINDINGS, appSettings.keybindings);
        }

        createMainWindow();
    });

    app.on('quit', (event, exitCode) => {
        ipcServer.close();
        Logger.info({ msg: 'App will quit!', event, exitCode });
    });

    // Exit cleanly on request from parent process in development mode.
    if (process.platform === 'win32') {
        process.on('message', data => {
            if (data === 'graceful-exit') {
                Logger.info('Received message to shutdown! Closing app ...');
                app.quit();
            }
        });
    } else {
        process.on('SIGTERM', () => {
            Logger.info('Received message to shutdown! Closing app ...');
            app.quit();
        });
    }
})().catch(err => {
    Logger.fatal({
        msg: 'Unknown Error in the main thread!',
        error: err,
    });
});
