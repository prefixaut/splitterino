import { filter, first, map } from 'rxjs/operators';
import uuid from 'uuid/v4';
import Vue from 'vue';
import Vuex, { ActionContext } from 'vuex';

import {
    IPC_CLIENT_TOKEN,
    IPCPacket,
    MessageType,
    PluginActionDiffRequest,
    PluginActionDiffResponse,
    PluginProcessDedNotification,
} from '../../models/ipc';
import { RootState } from '../../models/states/root.state';
import { IO_SERVICE_TOKEN } from '../../services/io.service';
import { DIFF_OPTION, getPluginStore, getStoreConfig } from '../../store';
import { Logger, LogLevel } from '../../utils/logger';
import { PLUGIN_CLIENT_ID } from '../../utils/plugin';
import { createPluginInjector } from '../../utils/services';
import { getModuleActionAndMutationNames } from '../../utils/store';
import { IPC_SERVER_NAME } from '../constants';
import { getPluginList } from './load-plugin';

(async () => {
    const injector = createPluginInjector();

    // Initialize the logger
    Logger.initialize(injector, LogLevel.DEBUG);

    Vue.use(Vuex);

    // Setup the store
    const storeOptions = getStoreConfig(injector);
    const names = getModuleActionAndMutationNames(storeOptions);
    const store = await getPluginStore(Vue, storeOptions);

    // Register plugin modules
    const testModule = {
        namespaced: true,
        state: {
            hi: 456,
        },
        actions: {
            action(context: ActionContext<{}, RootState>) {
                Logger.info('Test action called!');
                context.commit('mutation');

                return { test: 123 };
            },
        },
        mutations: {
            mutation(state: any) {
                state.hi = 890;
            }
        },
    };
    store.registerModule('test', testModule);
    const testModuleNames = getModuleActionAndMutationNames(testModule, 'test', 'splitterino/plugins');
    names.actions.push(...testModuleNames.actions);
    names.mutations.push(...testModuleNames.mutations);
    console.log('>>> test-module', testModuleNames);

    const ipcClient = injector.get(IPC_CLIENT_TOKEN);
    const response = await ipcClient.initialize(store, { name: PLUGIN_CLIENT_ID });

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

    ipcClient.listenToSubscriberSocket().pipe(
        filter(packet => packet.sender === IPC_SERVER_NAME
            && packet.message.type === MessageType.REQUEST_PLUGIN_ACTION_DIFF),
    ).subscribe((packet: IPCPacket) => {
        const { message, sender } = packet;
        const req = message as PluginActionDiffRequest;

        Logger.info(names);
        if (!names.actions.includes(req.action)) {
            Logger.info(`Plugin will not handle unknown action "${req.action}"`);

            return;
        }

        store.dispatch(req.action, req.payload, {
            ...req.options,
            [DIFF_OPTION]: message.id,
        } as any).then(result => {
            const responseMessage: PluginActionDiffResponse = {
                id: uuid(),
                type: MessageType.RESPONSE_PLUGIN_ACTION_DIFF,
                respondsTo: message.id,
                successful: true,
                changes: result.changes,
                returnValue: result.response,
            };

            ipcClient.sendDealerMessage(responseMessage, sender);
        }).catch(error => {
            const responseMessage: PluginActionDiffResponse = {
                id: uuid(),
                type: MessageType.RESPONSE_PLUGIN_ACTION_DIFF,
                respondsTo: message.id,
                successful: false,
                error: error,
            };

            ipcClient.sendDealerMessage(responseMessage, sender);
        });
    });

    getPluginList(injector.get(IO_SERVICE_TOKEN));

    ipcClient.sendDealerMessage({
        id: uuid(),
        type: MessageType.NOTIFY_PLUGIN_PROCESS_READY
    });
})();
