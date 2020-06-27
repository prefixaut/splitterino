import { Injector } from 'lightweight-di';
import { first, map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { IPC_CLIENT_SERVICE_TOKEN, IPC_PLUGIN_CLIENT_NAME, STORE_SERVICE_TOKEN } from '../common/constants';
import { LogLevel } from '../common/log-level';
import { IPCClientInterface, MessageType, PluginProcessDedNotification } from '../models/ipc';
import { RootState } from '../models/store';
import { HandlerStoreService } from '../services/handler-store.service';
import { Logger } from '../utils/logger';
import { createPluginInjector } from '../utils/services';
import { PluginManager } from './plugin-manager';

(async () => {
    const injector = createPluginInjector();

    // Initialize the logger
    Logger.initialize(injector, LogLevel.DEBUG);

    const ipcClient = injector.get(IPC_CLIENT_SERVICE_TOKEN);
    const initResponse = await ipcClient.initialize({ name: IPC_PLUGIN_CLIENT_NAME });
    // Update the Logger log-level from the registration
    if (initResponse) {
        // eslint-disable-next-line no-underscore-dangle
        Logger._setInitialLogLevel(initResponse.logLevel);
    }

    setupShutdownListener(ipcClient);

    await setupStore(injector);

    PluginManager.init(injector);
    PluginManager.setupIPCHooks();
    await PluginManager.loadPluginsIntoContext();

    ipcClient.sendDealerMessage({
        id: uuid(),
        type: MessageType.NOTIFY_PLUGIN_PROCESS_READY
    });
})().catch((error: Error) => {
    Logger.error({
        msg: 'Unknown error thrown in plugin process!',
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    });
});

function setupShutdownListener(ipcClient: IPCClientInterface) {
    ipcClient.listenToSubscriberSocket().pipe(
        map(packet => packet.message),
        first(message => message.type === MessageType.BROADCAST_APP_SHUTDOWN)
    ).subscribe(() => {
        PluginManager.teardown().then(() => {
            const message: PluginProcessDedNotification = {
                id: uuid(),
                type: MessageType.NOTIFY_PLUGIN_PROCESS_DED
            };
            ipcClient.sendDealerMessage(message);
        });
    });
}

async function setupStore(injector: Injector) {
    const store = injector.get(STORE_SERVICE_TOKEN) as HandlerStoreService<RootState>;
    store.setupIpcHooks();

    await store.requestNewState();

    Logger.debug('registering plugins namespace ...');
    // Register the store namespace
    await store.registerNamespace('plugins');
    Logger.debug('namespace registered!');
}
