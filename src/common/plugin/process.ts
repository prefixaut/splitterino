import { createPluginInjector } from '../../utils/services';
import { IPC_CLIENT_TOKEN, MessageType, PluginProcessDedNotification } from '../../models/ipc';
import Vue from 'vue';
import Vuex from 'vuex';
import { getClientStore } from '../../store';
import uuid from 'uuid/v4';
import { getPluginList } from './load-plugin';
import { IO_SERVICE_TOKEN } from '../../services/io.service';
import { Logger, LogLevel } from '../../utils/logger';
import { map, first } from 'rxjs/operators';

(async () => {
    const injector = createPluginInjector();

    // Initialize the logger
    Logger.initialize(injector, LogLevel.DEBUG);

    Vue.use(Vuex);
    const store = await getClientStore(Vue, injector);

    const ipcClient = injector.get(IPC_CLIENT_TOKEN);
    const response = await ipcClient.initialize(store, { name: 'plugin-process' });

    // Update the Logger log-level from the registration
    if (response) {
        // eslint-disable-next-line no-underscore-dangle
        Logger._setInitialLogLevel(response.logLevel);
    }

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

    getPluginList(injector.get(IO_SERVICE_TOKEN));

    ipcClient.sendDealerMessage({
        id: uuid(),
        type: MessageType.NOTIFY_PLUGIN_PROCESS_READY
    });
})();
