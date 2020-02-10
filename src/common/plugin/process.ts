import { createPluginInjector } from './services';
import { IPC_CLIENT_TOKEN, MessageType } from '../../models/ipc';
import Vue from 'vue';
import Vuex from 'vuex';
import { getClientStore } from '../../store';
import uuid from 'uuid/v4';

(async () => {
    const injector = createPluginInjector();
    const ipcClient = injector.get(IPC_CLIENT_TOKEN);

    Vue.use(Vuex);
    const store = await getClientStore(Vue, injector);

    await ipcClient.initialize(store, { name: 'plugin-process' });

    ipcClient.sendDealerMessage({
        id: uuid(),
        type: MessageType.NOTIFY_PLUGIN_PROCESS_READY
    });
})();
