import { ipcRenderer, remote } from 'electron';
import { Injector } from 'lightweight-di';
import Vuex, { DispatchOptions, Payload } from 'vuex';

import { ActionResult } from '../common/interfaces/electron';
import { Logger } from '../utils/logger';
import { getSplitterinoStoreModules } from './modules/index.module';
import { RootState } from './states/root.state';

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

export function getClientStore(vueRef, injector: Injector) {
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

    // ! FIXME: Just a workaround for store instantiation
    // ! Try to not instantiate store first and then replace state
    // ! Problem: Modules in config overwrite store if given in options
    store.replaceState(ipcRenderer.sendSync('vuex-connect'));

    const windowRef = remote.getCurrentWindow();
    windowRef.on('close', () => {
        ipcRenderer.send('vuex-disconnect');
    });

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

        return new Promise((resolve, reject) => {
            try {
                const actionResult: ActionResult = ipcRenderer.sendSync('vuex-dispatch', {
                    type: actualType,
                    payload: actualPayload,
                    options: actualOptions
                });
                if (actionResult.error == null) {
                    resolve(actionResult.result);
                } else {
                    reject(actionResult.error);
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    ipcRenderer.on('vuex-apply-mutation', (event, { type, payload }) => {
        Logger.debug({
            msg: 'vuex-apply-mutation',
            type,
            payload
        });

        try {
            store.commit(type, payload);
        } catch (err) {
            Logger.error({
                msg: 'Could not apply vuex-mutation!',
                error: err,
            });
        }
    });

    return store;
}
