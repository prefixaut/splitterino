import { Injector } from 'lightweight-di';
import { STORE_SERVICE_TOKEN } from '../models/services';
import { RootState } from '../models/states/root.state';
import { Module } from '../models/store';
import { HandlerStoreService } from '../services/handler-store.service';
import { Logger } from '../utils/logger';

export async function setupStore(injector: Injector) {
    const store = injector.get(STORE_SERVICE_TOKEN) as HandlerStoreService<RootState>;
    store.setupIpcHooks();

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
