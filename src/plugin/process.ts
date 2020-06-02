import { v4 as uuid } from 'uuid';
import { MessageType, IPCClientInterface, PluginProcessDedNotification } from '../models/ipc';
import { IO_SERVICE_TOKEN, IPC_CLIENT_SERVICE_TOKEN } from '../models/services';
import { Logger, LogLevel } from '../utils/logger';
import { PLUGIN_CLIENT_ID } from '../utils/plugin';
import { createPluginInjector } from '../utils/services';
import { loadPluginsIntoContext } from './load-plugin';
import { setupStore } from './setup-store';
import { map, first } from 'rxjs/operators';
import { createContext } from 'vm';

(async () => {
    const injector = createPluginInjector();

    // Initialize the logger
    Logger.initialize(injector, LogLevel.DEBUG);

    const ipcClient = injector.get(IPC_CLIENT_SERVICE_TOKEN);
    const initResponse = await ipcClient.initialize({ name: PLUGIN_CLIENT_ID });
    // Update the Logger log-level from the registration
    if (initResponse) {
        // eslint-disable-next-line no-underscore-dangle
        Logger._setInitialLogLevel(initResponse.logLevel);
    }

    setupShutdownListener(ipcClient);

    await setupStore(injector);

    const pluginContext = createContext({ exports: {} });
    const plugins = await loadPluginsIntoContext(injector.get(IO_SERVICE_TOKEN), pluginContext);

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
        // TODO: Implement teardown logic
        const message: PluginProcessDedNotification = {
            id: uuid(),
            type: MessageType.NOTIFY_PLUGIN_PROCESS_DED
        };
        ipcClient.sendDealerMessage(message);
    });
}
