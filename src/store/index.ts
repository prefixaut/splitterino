import { Injector } from 'lightweight-di';
import Vuex, { DispatchOptions, Payload } from 'vuex';

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

export async function getClientStore(vueRef, client: IPCClientInterface, injector: Injector) {
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

                    client.sendLocalMessage(
                        `commit:${mutation.type}${id}`,
                        payload
                    );
                });
            },
        ],
        ...getStoreConfig(injector)
    });

    // Override the dispatch function to delegate it to the main process instead
    // tslint:disable-next-line only-arrow-functions no-string-literal
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
