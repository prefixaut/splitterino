import { Injector } from 'lightweight-di';
import { filter, first, map } from 'rxjs/operators';
import uuid from 'uuid/v4';

import { IPC_SERVER_NAME } from '../common/constants';
import {
    IPCPacket,
    MessageType,
    PluginProcessDedNotification,
    StoreCreateDiffRequest,
    StoreCreateDiffResponse,
} from '../models/ipc';
import { IO_SERVICE_TOKEN, IPC_CLIENT_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from '../models/services';
import { RootState } from '../models/states/root.state';
import { Module } from '../models/store';
import { HandlerStoreService } from '../services/handler-store.service';
import { Logger, LogLevel } from '../utils/logger';
import { PLUGIN_CLIENT_ID } from '../utils/plugin';
import { createPluginInjector } from '../utils/services';
import { getPluginList } from './load-plugin';

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

    await setupStore(injector);

    getPluginList(injector.get(IO_SERVICE_TOKEN));

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

async function setupStore(injector: Injector) {
    const ipcClient = injector.get(IPC_CLIENT_SERVICE_TOKEN);
    const store = injector.get(STORE_SERVICE_TOKEN) as HandlerStoreService<RootState>;

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
            && packet.message.type === MessageType.REQUEST_STORE_CREATE_DIFF),
    ).subscribe((packet: IPCPacket) => {
        const { message, sender } = packet;
        const req = message as StoreCreateDiffRequest;
        let response: StoreCreateDiffResponse;

        try {
            const diff = store.getDiff(req.commit);
            response = {
                id: uuid(),
                type: MessageType.RESPONSE_STORE_CREATE_DIFF,
                respondsTo: message.id,
                successful: true,
                diff,
            };
        } catch (error) {
            response = {
                id: uuid(),
                type: MessageType.RESPONSE_STORE_CREATE_DIFF,
                respondsTo: message.id,
                successful: false,
                error: error,
            };
        }

        ipcClient.sendDealerMessage(response, sender);
    });

    Logger.info('register plugins namespace ...');
    // Register the store namespace
    await store.registerNamespace('plugins');
    Logger.info('namespace registered!');

    // Register plugin modules
    const testModule: Module<any> = {
        initialize() {
            return {
                hi: 456,
            };
        },
        handlers: {
            mutation() {
                return { hi: 890 };
            }
        },
    };

    Logger.info('register module ...');
    await store.registerModule('plugins', 'test', testModule);
    Logger.info('module registered!');
}
