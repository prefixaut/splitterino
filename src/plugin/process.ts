import { first, map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { IPC_CLIENT_SERVICE_TOKEN, IPC_PLUGIN_CLIENT_NAME } from '../common/constants';
import { LogLevel } from '../common/log-level';
import { IPCClientInterface, MessageType, PluginProcessDedNotification } from '../models/ipc';
import { Logger } from '../utils/logger';
import { createPluginInjector } from '../utils/services';
import { PluginManager } from './plugin-manager';
import { setupStore } from './setup-store';

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
})().catch(error => {
    Logger.error({
        msg: 'Unknown error thrown in plugin process!',
        error: {
            message: error.message,
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
