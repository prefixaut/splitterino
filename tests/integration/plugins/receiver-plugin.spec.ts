/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { Injector } from 'lightweight-di';

import { createPluginTestInjector } from '../../utils';
import { Plugin } from '../../../src/models/plugins';
import { STORE_SERVICE_TOKEN, IPC_CLIENT_SERVICE_TOKEN } from '../../../src/models/services';
import { ReceiverStoreService } from '../../../src/services/receiver-store.service';
import { RootState } from '../../../src/models/store';

let pluginInjector: Injector;

before(async () => {
    pluginInjector = createPluginTestInjector();
    const ipcClient = pluginInjector.get(IPC_CLIENT_SERVICE_TOKEN);
    await ipcClient.initialize({
        name: 'test-plugin',
    });
    const store = pluginInjector.get(STORE_SERVICE_TOKEN) as ReceiverStoreService<RootState>;
    store.setupIpcHooks();
    await store.requestNewState();
});

function createPluginInstance(): Plugin {
    return {
        initialize: (injector: Injector) => {
            const store = injector.get(STORE_SERVICE_TOKEN);
            if (store != null) {
                return Promise.resolve(true);
            }

            return Promise.resolve(false);
        },
        destroy: () => {
            return Promise.resolve(true);
        }
    };
}

describe('Receiver Plugin', () => {
    it('should initialize properly', async () => {
        const instance = createPluginInstance();
        const result = await instance.initialize(pluginInjector);
        expect(result).to.equal(true);
    });
});
