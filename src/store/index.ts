import { Injector } from 'lightweight-di';
import Vuex, { DispatchOptions, Payload } from 'vuex';

import { IPCClient } from '../common/ipc/client';
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

export async function getClientStore(vueRef, client: IPCClient, injector: Injector) {
    vueRef.use(Vuex);

    const store = new Vuex.Store<RootState>({
        plugins: [
            events => {
                events.subscribe(mutation => {
                    let payload: any;
                    let id = '';

                    if (
                        typeof mutation.payload === 'object' &&
                        'id' in mutation.payload &&
                        'payload' in mutation.payload
                    ) {
                        payload = mutation.payload.payload;
                        id = `:${mutation.payload.id}`;
                    } else {
                        payload = mutation.payload;
                    }

                    vueRef.prototype.$eventHub.$emit(
                        `commit:${mutation.type}${id}`,
                        payload
                    );
                });
            },
        ],
        ...getStoreConfig(injector)
    });

    // * Probably fine if we don't do any heavy init stuff in state
    store.replaceState(await client.getStoreState());

    // Override the dispatch function to delegate it to the main process instead
    // tslint:disable-next-line only-arrow-functions no-string-literal
    store['_dispatch'] = store.dispatch = function <P extends Payload>(
        typeMaybeWithPayload: string | P,
        payloadOrOptions?: any | DispatchOptions,
        options?: DispatchOptions
    ) {
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
                arguments: arguments
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

    return store;
}
