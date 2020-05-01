import { Injector } from 'lightweight-di';
import { cloneDeep } from 'lodash';
import { first, map, timeout } from 'rxjs/operators';
import uuid from 'uuid/v4';
import Vuex, { DispatchOptions, Module, ModuleOptions, Mutation, Payload, Store, StoreOptions } from 'vuex';

import { IPCServer } from '../common/ipc-server';
import { IPC_CLIENT_TOKEN, MessageType, PluginActionDiffRequest, PluginActionDiffResponse, Response } from '../models/ipc';
import { RootState } from '../models/states/root.state';
import { Logger } from '../utils/logger';
import { PLUGIN_CLIENT_ID } from '../utils/plugin';
import {
    getActionHandler,
    getModuleActionAndMutationNames,
    getNestedState,
    makeLocalContext,
    unifyObjectStyle,
} from '../utils/store';
import { MUTATION_APPLY_DIFF } from './modules/core.module';
import { getSplitterinoStoreModules } from './modules/index.module';

export function getStoreConfig(injector: Injector): StoreOptions<RootState> {
    return {
        strict: true,
        modules: {
            splitterino: {
                namespaced: true,
                modules: getSplitterinoStoreModules(injector),
            }
        }
    };
}

export const DIFF_OPTION = Symbol('diff-option');

export function getPluginStore(vueRef, injector: Injector): Promise<Store<RootState>> {
    vueRef.use(Vuex);

    const store = new Vuex.Store<RootState>(getStoreConfig(injector));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalRegisterModule = store.registerModule;

    // Override the default implementation of the register-module to manually register the
    // mutations for further use.
    // eslint-disable-next-line dot-notation,@typescript-eslint/unbound-method
    store['_registerModule'] = store.registerModule = function <T extends any, S extends RootState>(
        path: string | string[],
        module: Module<T, S>,
        options?: ModuleOptions
    ) {
        if (typeof path === 'string') {
            path = [path];
        }

        const moduleName = path.pop();
        const namespace = path.join('/');
        const { mutations: moduleMutations, actions: moduleActions } = module;
        const mutationHandlerTable: { [name: string]: Mutation<T>[] } = {};

        // Delete the mutations and actions from the module to not register them twice
        delete module.mutations;
        delete module.actions;

        // Register the module to the store
        originalRegisterModule.call(store, path, module, options);

        // Local/Module instance
        const local = makeLocalContext(store, namespace, path);

        // The current changes
        let currentDiff = {};

        // Register the mutation-handlers into a seperate table
        if (moduleMutations != null && typeof moduleMutations === 'object') {
            Object.keys(moduleMutations).forEach(mutationName => {
                const namespacedType = [namespace, moduleName, mutationName].join('/');
                const handler = moduleMutations[mutationName];
                const entry = mutationHandlerTable[namespacedType] || (mutationHandlerTable[namespacedType] = []);

                // Custom wrapper to create a copy of the state before manipulating it and then
                entry.push((payload: any, mutationOption: { DIFF_OPTION?: boolean }) => {
                    if (mutationOption != null && mutationOption[DIFF_OPTION] === true) {
                        // This state is not reactive anymore and a copy.
                        // All changes are going to be performed in this commit are not going to be saved directly,
                        // but forwarded to the main-process to be processed there.
                        const clonedState = cloneDeep(store.state);
                        // The module-state for the handler
                        const moduleState = getNestedState(clonedState, [namespace, moduleName]);

                        // Call the handler to perform the changes to the state
                        handler.call(clonedState, moduleState, payload);

                        const diff = {}; // TODO: Create the diff of store.state and the clonedState.
                        currentDiff = diff; // TODO: Merge the currentDiff with diff
                    } else {
                        // The module-state for the handler
                        const moduleState = getNestedState(store.state, [namespace, moduleName]);
                        // Call the handler to perform the changes to the state
                        handler.call(store.state, moduleState, payload);
                    }
                });
            });
        }

        if (moduleActions != null && typeof moduleActions === 'object') {
            Object.keys(moduleActions).forEach(actionName => {
                const action = moduleActions[actionName];
                const { type, handler } = getActionHandler(action, [namespace, moduleName].join('/'), actionName);
                // eslint-disable-next-line no-underscore-dangle
                const entry = (store as any)._actions[type] || ((store as any)._actions[type] = []);

                entry.push((payload, dispatchOptions) => {
                    if (dispatchOptions && dispatchOptions[DIFF_OPTION]) {
                        // Reset the diff
                        currentDiff = {};
                    }

                    const response = handler.call(store, {
                        dispatch: local.dispatch,
                        commit: (dispatchOptions && dispatchOptions[DIFF_OPTION]) ? (commitType, commitPayload, commitOptions) => {
                            const args = unifyObjectStyle(commitType, commitPayload, commitOptions);
                            // Calling the regular commit, but with the diff-option enabled
                            local.commit(args.type, args.payload, {
                                ...args.options,
                                [DIFF_OPTION]: true,
                            });
                        } : local.commit,
                        getters: (local as any).getters,
                        state: (local as any).state,
                        rootGetters: store.getters,
                        rootState: store.state
                    }, payload);

                    if (dispatchOptions && dispatchOptions[DIFF_OPTION]) {
                        return Promise.resolve({
                            changes: currentDiff,
                            response,
                        });
                    } else {
                        return Promise.resolve(response);
                    }
                });
            });
        }
    }.bind(store);

    // Reimplementation of the original dispatch action, except that it's forwarding the diff-option
    // to the handler as well.
    // eslint-disable-next-line dot-notation
    store['_dispatch'] = store.dispatch = function <P extends Payload>(
        _type: string | P,
        _payload?: any | DispatchOptions,
        _options?: DispatchOptions
    ) {
        const args = unifyObjectStyle(_type, _payload, _options);
        const type = args.type;
        const payload = args.payload;
        const options = args.options;

        const action = { type: type, payload: payload };
        // eslint-disable-next-line no-underscore-dangle
        const entry = this._actions[type];

        if (!entry) {
            if (process.env.NODE_ENV !== 'production') {
                Logger.error(`[vuex] unknown action type: ${type}`);
            }

            return;
        }

        try {
            // eslint-disable-next-line no-underscore-dangle
            this._actionSubscribers
                .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
                .filter(sub => sub.before)
                .forEach(sub => sub.before(action, this.state));
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                Logger.warn('[vuex] error in before action subscribers: ');
                Logger.error(e);
            }
        }

        const result = entry.length > 1
            ? Promise.all(entry.map(handler =>handler(payload, {
                [DIFF_OPTION]: options && options[DIFF_OPTION]
            })))
            : entry[0](payload, {
                [DIFF_OPTION]: options && options[DIFF_OPTION]
            });

        return result.then(res => {
            try {
                // eslint-disable-next-line no-underscore-dangle
                this._actionSubscribers
                    .filter(sub => sub.after)
                    .forEach(sub => sub.after(action, this.state));
            } catch (e) {
                if (process.env.NODE_ENV !== 'production') {
                    Logger.warn('[vuex] error in after action subscribers: ');
                    Logger.error(e);
                }
            }

            return res;
        });
    }.bind(store);

    return Promise.resolve(store);
}

export function getMainStore(vueRef, injector: Injector, ipcServer: IPCServer): Promise<Store<RootState>> {
    vueRef.use(Vuex);

    const storeConfig = getStoreConfig(injector);
    const store = new Vuex.Store<RootState>(storeConfig);
    const names = getModuleActionAndMutationNames(storeConfig);

    const originalDispatch = store.dispatch;

    // Override the dispatch function to delegate it to the main process instead
    // eslint-disable-next-line dot-notation
    store['_dispatch'] = store.dispatch = function <P extends Payload>(
        typeMaybeWithPayload: string | P,
        payloadOrOptions?: any | DispatchOptions,
        options?: DispatchOptions
    ) {
        // Drop all actions which are done before init
        // TODO: Queue them and replay them later?
        if (!ipcServer.isInitialized()) {
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

        // It is a non-standard action from a plugin
        if (!names.actions.includes(actualType)) {
            const request: PluginActionDiffRequest = {
                id: uuid(),
                type: MessageType.REQUEST_PLUGIN_ACTION_DIFF,
                action: actualType,
                payload: actualPayload,
                options: actualOptions,
            };

            return new Promise((resolve, reject) => {
                // Setup a listener for the response
                ipcServer.listenToRouterSocket().pipe(
                    map(packet => packet.message),
                    first(message => message.type === MessageType.RESPONSE_PLUGIN_ACTION_DIFF
                        && (message as Response).respondsTo === request.id),
                    timeout(3_000),
                ).subscribe((response: PluginActionDiffResponse) => {
                    if (response.successful) {
                        // Forward the changes as a Mutation to the root
                        store.commit(MUTATION_APPLY_DIFF, response.changes);
                        resolve(response.returnValue);
                    } else {
                        reject(response.error);
                    }
                });

                // Send the request to the plugin-process
                ipcServer.sendRouterMessage(null, PLUGIN_CLIENT_ID, request).then(successul => {
                    if (!successul) {
                        throw new Error('Could not send the router message!');
                    }
                }).catch(reject);
            });
        }

        // Call the default dispatch-function and return it's result
        return originalDispatch(actualType, actualPayload, actualOptions);
    };

    return Promise.resolve(store);
}

export function getClientStore(vueRef, injector: Injector): Promise<Store<RootState>> {
    vueRef.use(Vuex);

    const store = new Vuex.Store<RootState>(getStoreConfig(injector));

    const client = injector.get(IPC_CLIENT_TOKEN);

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
