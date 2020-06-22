import { Injector } from 'lightweight-di';

import { STORE_SERVICE_TOKEN } from '../common/constants';
import { RootState } from '../models/store';
import { HandlerStoreService } from '../services/handler-store.service';
import { Logger } from '../utils/logger';

export async function setupStore(injector: Injector) {
    const store = injector.get(STORE_SERVICE_TOKEN) as HandlerStoreService<RootState>;
    store.setupIpcHooks();

    Logger.debug('registering plugins namespace ...');
    // Register the store namespace
    await store.registerNamespace('plugins');
    Logger.debug('namespace registered!');
}
