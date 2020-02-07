import { Injector } from 'lightweight-di';
import Vuex, { DispatchOptions, Payload, Store } from 'vuex';

import { IPCClientInterface } from '../models/ipc';
import { RootState } from '../models/states/root.state';
import { Logger } from '../utils/logger';
import { getSplitterinoStoreModules } from './modules/index.module';

export function getStoreConfig(injector: Injector) {
    return {
        strict: true,
        modules: {
            splitterino: {
                namespaced: true,
                modules: getSplitterinoStoreModules(injector)
            }
        }
    };
}

export function getClientStore(vueRef, client: IPCClientInterface, injector: Injector): Promise<Store<RootState>> {
    vueRef.use(Vuex);

    const store = new Vuex.Store<RootState>(getStoreConfig(injector));

    // Override the dispatch function to delegate it to the main process instead
    // eslint-disable-next-line dot-notation
    store['_dispatch'] = store.dispatch = function <P extends Payload>(
        typeMaybeWithPayload: string | P,
        payloadOrOptions?: any | DispatchOptions,
        options?: DispatchOptions
    ) {
        // Drop all actions which are done before init
        // TODO: Queue them and replay them later?
        if (!client.isInitialized()) {
            return;
        }

        let actualType: string;
        let actualPayload: any;
        let actualOptions: DispatchOptions;

        if (typeof typeMaybeWithPayload === 'string') {
            actualType = typeMaybeWithPayload;
            actualPayload = payloadOrOptions;
            actualOptions = options;
        } else if (typeMaybeWithPayload != null && typeof typeMaybeWithPayload === 'object') {
            const { type, ...payloadData } = typeMaybeWithPayload;
            actualType = type;
            actualPayload = payloadData;
            actualOptions = payloadOrOptions;
        }

        if (actualType == null) {
            const errorMsg = 'The type for the dispatch could not be determined';
            Logger.error({
                msg: errorMsg,
                // eslint-disable-next-line prefer-rest-params
                arguments: arguments,
            });

            return Promise.reject(new Error(errorMsg));
        }

        Logger.debug({
            msg: 'Forwarding action to main process',
            type: actualType,
            payload: actualPayload,
            options: actualOptions,
        });

        return client.dispatchAction(actualType, actualPayload, actualOptions);
    };

    return Promise.resolve(store);
}
