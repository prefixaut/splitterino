/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { Injector } from 'lightweight-di';

import { IPC_CLIENT_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from '../../../src/common/constants';
import { PluginApi, SplitterinoPlugin } from '../../../src/models/plugins';
import { RootState } from '../../../src/models/store';
import { ReceiverStoreService } from '../../../src/services/receiver-store.service';
import { createPluginApiInstance } from '../../../src/utils/plugin';
import { createPluginTestInjector } from '../../utils';

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

function createPluginInstance(): SplitterinoPlugin {
    return {
        initialize: (api: PluginApi) => {
            const store = api.injector.get(STORE_SERVICE_TOKEN);
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
        const api = createPluginApiInstance(pluginInjector);
        const result = await instance.initialize(api);
        expect(result).to.equal(true);
    });
});
