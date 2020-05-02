import { Injector } from 'lightweight-di';
import { cloneDeep } from 'lodash';
import uuid from 'uuid/v4';
import Vuex, { DispatchOptions, Module, ModuleOptions, Mutation, Payload, Store, StoreOptions } from 'vuex';

import { IPCServer } from '../common/ipc-server';
import { IPC_CLIENT_TOKEN, MessageType } from '../models/ipc';
import { RootState } from '../models/states/root.state';
import { Logger } from '../utils/logger';
import {
    difference,
    getActionHandler,
    getModuleActionAndMutationNames,
    getNestedState,
    makeLocalContext,
    unifyObjectStyle,
} from '../utils/store';
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

export function getPluginStore(vueRef, storeOptions: StoreOptions<RootState>): Promise<Store<RootState>> {
    vueRef.use(Vuex);

    const store = new Vuex.Store<RootState>(storeOptions);

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
        console.log('>>> REGISTERING MODULE!');
        if (typeof path === 'string') {
            path = [path];
        } else if (!Array.isArray(path)) {
            path = [];
        }

        if (path.length < 1) {
            Logger.info('Cannot register module as root-module');
        }

        path.unshift('splitterino', 'plugins');

        const moduleName = path.pop();
        const namespace = path.join('/');
        const { mutations: moduleMutations, actions: moduleActions } = module;
        const mutationHandlerTable: { [name: string]: Mutation<T>[] } = {};

        // Delete the mutations and actions from the module to not register them twice
        delete module.mutations;
        delete module.actions;

        Logger.info({
            msg: 'Register-Module override',
            path,
            moduleName,
            namespace,
        });

        try {
            // Register the module to the store
            originalRegisterModule.call(store, path, module, options);
        } catch (error) {
            Logger.error(error);

            return;
        }

        // Local/Module instance
        const local = makeLocalContext(store, namespace, path);

        // The current changes
        const currentDiff = {};

        // Register the mutation-handlers into a seperate table
        if (moduleMutations != null && typeof moduleMutations === 'object') {
            Object.keys(moduleMutations).forEach(mutationName => {
                const namespacedType = [namespace, moduleName, mutationName].join('/');
                const handler = moduleMutations[mutationName];
                const entry = mutationHandlerTable[namespacedType] || (mutationHandlerTable[namespacedType] = []);

                // This state is not reactive anymore and a copy.
                // All changes are going to be performed in this commit are not going to be saved directly,
                // but forwarded to the main-process to be processed there.
                const clonedState = cloneDeep(store.state);

                // Custom wrapper to create a copy of the state before manipulating it and then
                entry.push((payload: any, mutationOption: { DIFF_OPTION?: boolean }) => {
                    if (mutationOption != null && mutationOption[DIFF_OPTION]) {
                        // The module-state for the handler
                        const moduleState = getNestedState(clonedState, [namespace, moduleName]);

                        // Call the handler to perform the changes to the state
                        handler.call(clonedState, moduleState, payload);

                        const diff = difference(store.state, clonedState);
                        currentDiff[mutationOption[DIFF_OPTION]] = diff;
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
                        currentDiff[dispatchOptions[DIFF_OPTION]] = {};
                    }

                    const response = handler.call(store, {
                        dispatch: local.dispatch,
                        commit: (dispatchOptions && dispatchOptions[DIFF_OPTION])
                            ? (commitType, commitPayload, commitOptions) => {
                                const args = unifyObjectStyle(commitType, commitPayload, commitOptions);
                                // Calling the regular commit, but with the diff-option enabled
                                local.commit(args.type, args.payload, {
                                    ...args.options,
                                    [DIFF_OPTION]: dispatchOptions[DIFF_OPTION],
                                });
                            }
                            : local.commit,
                        getters: (local as any).getters,
                        state: (local as any).state,
                        rootGetters: store.getters,
                        rootState: store.state
                    }, payload);

                    if (dispatchOptions && dispatchOptions[DIFF_OPTION]) {
                        return Promise.resolve({
                            changes: currentDiff[dispatchOptions[DIFF_OPTION]],
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

        const action = { type: args.type, payload: args.payload };
        // eslint-disable-next-line no-underscore-dangle
        const entry = this._actions[args.type];

        if (!entry) {
            if (process.env.NODE_ENV !== 'production') {
                Logger.error(`[vuex] unknown action type: ${args.type}`);
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
            ? Promise.all(entry.map(handler => handler(args.payload, {
                [DIFF_OPTION]: args.options[DIFF_OPTION] ?? null
            })))
            : entry[0](args.payload, {
                [DIFF_OPTION]: args.options[DIFF_OPTION] ?? null
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
        _type: string | P,
        _payload?: any | DispatchOptions,
        _options?: DispatchOptions
    ) {
        // Drop all actions which are done before init
        // TODO: Queue them and replay them later?
        if (!ipcServer.isInitialized()) {
            return;
        }

        const args = unifyObjectStyle(_type, _payload, _options);

        if (args.type == null) {
            const errorMsg = 'The type for the dispatch could not be determined';
            Logger.error({
                msg: errorMsg,
                // eslint-disable-next-line prefer-rest-params
                arguments: arguments,
            });

            return Promise.reject(new Error(errorMsg));
        }

        // It is a non-standard action from a plugin
        if (!names.actions.includes(args.type)) {
            return ipcServer.sendPluginActionDiffRequest({
                id: uuid(),
                type: MessageType.REQUEST_PLUGIN_ACTION_DIFF,
                action: args.type,
                payload: args.payload,
                options: args.options,
            });
        }

        // Call the default dispatch-function and return it's result
        return originalDispatch(args.type, args.payload, args.options);
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
        _type: string | P,
        _payload?: any | DispatchOptions,
        _options?: DispatchOptions
    ) {
        // Drop all actions which are done before init
        // TODO: Queue them and replay them later?
        if (!client.isInitialized()) {
            return;
        }

        const args = unifyObjectStyle(_type, _payload, _options);

        if (args.type == null) {
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
            type: args.type,
            payload: args.payload,
            options: args.options,
        });

        return client.dispatchAction(args.type, args.payload, args.options);
    };

    return Promise.resolve(store);
}
