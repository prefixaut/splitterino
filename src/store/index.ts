import { ipcRenderer, remote } from 'electron';
import { OverlayHostPlugin } from 'vue-overlay-host';
import Vuex from 'vuex';

import { splitterinoStoreModules } from './modules';
import { Logger } from '../utils/logger';

export const config = {
    strict: true,
    modules: {
        splitterino: {
            namespaced: true,
            modules: splitterinoStoreModules
        }
    }
};

export function getClientStore(vueRef) {
    vueRef.use(Vuex);

    const store: any = new Vuex.Store({
        plugins: [
            OverlayHostPlugin, events => {
                events.subscribe(mutation => {
                    if (!mutation.type.includes('overlay-host')) {
                        let payload: any;
                        let id = '';
                        if (
                            typeof mutation.payload === 'object' &&
                            'id' in mutation.payload &&
                            'payload' in mutation.payload
                        ) {
                            payload = mutation.payload.payload;
                            id = ':' + mutation.payload.id;
                        } else {
                            payload = mutation.payload;
                        }
                        vueRef.prototype.$eventHub.$emit(
                            `commit:${mutation.type}${id}`,
                            payload
                        );
                    }
                });
            }
        ],
        ...config
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
    // tslint:disable-next-line only-arrow-functions
    store._dispatch = store.dispatch = function(type, ...payload) {
        if (Array.isArray(payload)) {
            if (payload.length === 0) {
                payload = undefined;
            } else if (payload.length === 1) {
                payload = payload[0];
            }
        }

        // Stolen from vuejs/vuex
        if (typeof type === 'object' && type.type && arguments.length === 1) {
            payload = [type.payload];
            type = type.type;
        }

        // FIXME: This is not working in here, needs to be moved
        // to where the mutation is applied
        if (!type.includes('overlay-host')) {
            Logger.debug('[client] dispatching ', type, payload);
            ipcRenderer.send('vuex-mutate', { type, payload });
        }
    };

    ipcRenderer.on('vuex-apply-mutation', (event, { type, payload }) => {
        Logger.debug('[client] vuex-apply-mutation', type);
        if (
            payload != null &&
            typeof payload === 'object' &&
            !Array.isArray(payload)
        ) {
            store.commit({
                type,
                ...payload
            });
        } else {
            store.commit(type, payload);
        }
    });

    return store;
}
