'use strict';
import { app, BrowserWindow, protocol } from 'electron';
import { join } from 'path';
import * as pino from 'pino';
import { first, map, timeout } from 'rxjs/operators';
import { format as formatUrl } from 'url';
import uuid from 'uuid';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';

import { registerDefaultKeybindingFunctions } from './common/function-registry';
import { AppShutdownBroadcast, MessageType } from './models/ipc';
import { IO_SERVICE_TOKEN, IPC_SERVER_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from './models/services';
import { RootState } from './models/states/root.state';
import { ServerStoreService } from './services/server-store.service';
import { Module } from './store';
import { getContextMenuStoreModule } from './store/modules/context-menu.module';
import { getGameInfoStoreModule } from './store/modules/game-info.module';
import { getKeybindingsStoreModule, HANDLER_SET_BINDINGS } from './store/modules/keybindings.module';
import { getMetaStoreModule } from './store/modules/meta.module';
import { getSettingsStoreModule } from './store/modules/settings.module';
import { getSplitsStoreModule } from './store/modules/splits.module';
import { getTimerStoreModule } from './store/modules/timer.module';
import { parseArguments } from './utils/arguments';
import { isDevelopment } from './utils/is-development';
import { Logger, LogLevel } from './utils/logger';
import { forkPluginProcess } from './utils/plugin';
import { createBackgroundInjector } from './utils/services';

process.on('uncaughtException', (error: Error) => {
    console.log(error);

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
    const injector = createBackgroundInjector();

    /** Parsed command line arguments */
    const args = parseArguments();

    // Initialize the logger
    Logger.initialize(injector, args.logLevel);

    // Setting up a log-handler which logs the messages to a file
    const io = injector.get(IO_SERVICE_TOKEN);
    const logFile = join(io.getAssetDirectory(), 'application.log');
    Logger.registerHandler(pino.destination(logFile), { level: args.logLevel });

    // Get the IPC Server
    const ipcServer = injector.get(IPC_SERVER_SERVICE_TOKEN);

    // Initialize the IPC Server with the store
    await ipcServer.initialize(args.logLevel || LogLevel.INFO);

    // Initialize the Store and it's modules
    const store = injector.get(STORE_SERVICE_TOKEN) as ServerStoreService<RootState>;
    store.setupIpcHooks();
    const coreStoreModules: { [name: string]: Module<any> } = {
        contextMenu: getContextMenuStoreModule(),
        gameInfo: getGameInfoStoreModule(),
        keybindings: getKeybindingsStoreModule(),
        settings: getSettingsStoreModule(injector),
        splits: getSplitsStoreModule(injector),
        timer: getTimerStoreModule(),
        meta: getMetaStoreModule(),
    };
    for (const moduleName of Object.keys(coreStoreModules)) {
        store.registerModule('splitterino', moduleName, coreStoreModules[moduleName]);
    }

    // load application settings
    const appSettings = await io.loadApplicationSettingsFromFile(args.splitsFile);
    // load user settings
    await io.loadSettingsFromFileToStore();

    // Setup the Keybiding Functions
    registerDefaultKeybindingFunctions(injector);

    // Start plugin child process
    let pluginProcess = await forkPluginProcess(ipcServer);
    if (pluginProcess == null) {
        Logger.fatal('Could not start plugin process');
    } else {
        Logger.debug('Started plugin process');
    }

    function createMainWindow() {
        const window = new BrowserWindow(appSettings.windowOptions);

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
            io.saveApplicationSettingsToFile(mainWindow);
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

        return window;
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
            mainWindow = createMainWindow();
        }
    });

    // create main BrowserWindow when electron is ready
    app.whenReady().then(async () => {
        if (isDevelopment() && !process.env.IS_TEST) {
            // Install Vue Devtools
            await installVueDevtools();
        }

        // Load the keybindings once the application is actually loaded
        // Has to be done before creating the main window.
        if (Array.isArray(appSettings.keybindings)) {
            store.commit(HANDLER_SET_BINDINGS, appSettings.keybindings);
        }

        createMainWindow();
    });

    let sentShutdown = false;
    app.on('before-quit', event => {
        // TODO: Check if timer is running
        if (pluginProcess != null) {
            Logger.debug('Trying to gracefully shut down plugin process');

            event.preventDefault();
            ipcServer.listenToRouterSocket().pipe(
                map(packet => packet.message),
                first(message => message.type === MessageType.NOTIFY_PLUGIN_PROCESS_DED),
                timeout(5000)
            ).subscribe(() => {
                pluginProcess.kill('SIGTERM');
                pluginProcess = null;
                Logger.debug('Plugin process shut down gracefully');
                app.quit();
            }, () => {
                pluginProcess.kill('SIGKILL');
                pluginProcess = null;
                Logger.error('Plugin process could not be shut down');
                app.quit();
            });
        }

        if (!sentShutdown) {
            const message: AppShutdownBroadcast = {
                id: uuid(),
                type: MessageType.BROADCAST_APP_SHUTDOWN
            };
            ipcServer.publishMessage(message);
            sentShutdown = true;
        }
    });

    app.on('quit', (event, exitCode) => {
        ipcServer.close();
        Logger.info({ msg: 'App quit!', exitCode });
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
    console.log(err);
    Logger.fatal({
        msg: 'Unknown Error in the main thread!',
        error: err,
    });
});
