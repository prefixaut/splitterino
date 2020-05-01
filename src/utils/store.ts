import { Module, Store, Action, ActionHandler } from 'vuex';

export function getModuleActionAndMutationNames(
    module: Module<any, any>,
    name: string = '',
    namespace?: string
): { actions: string[]; mutations: string[] } {
    const actionNames = [];
    const mutationNames = [];

    if (module != null && typeof module === 'object') {
        if (module.namespaced) {
            if (namespace != null && namespace.trim().length > 0) {
                namespace += `.${name}`;
            } else {
                namespace = name;
            }
        }

        if (module.actions != null && typeof module.actions === 'object') {
            Object.keys(module.actions).forEach(actionName => {
                if (namespace !== '') {
                    actionNames.push(`${namespace}/${actionName}`);
                } else {
                    actionNames.push(actionName);
                }
            });
        }

        if (module.mutations != null && typeof module.mutations === 'object') {
            Object.keys(module.mutations).forEach(mutationName => {
                if (namespace !== '') {
                    mutationNames.push(`${namespace}/${mutationName}`);
                } else {
                    mutationNames.push(mutationName);
                }
            });
        }

        if (module.modules != null && typeof module.modules === 'object') {
            Object.keys(module.modules).forEach(moduleName => {
                const tmp = getModuleActionAndMutationNames(module.modules[moduleName], moduleName, namespace);
                actionNames.push(...tmp.actions);
                mutationNames.push(...tmp.mutations);
            });
        }
    }

    return {
        actions: actionNames,
        mutations: mutationNames,
    };
}

export function getActionHandler<S, R>(
    action: Action<any, any>,
    namespace: string, key: string
): { type: string; handler: ActionHandler<S, R> } {
    const type = typeof action === 'function' || action.root ? `${namespace}/${key}` : key;
    const handler = typeof action === 'function'  ? action : action.handler;

    return { type, handler };
}

/*
 * Following functions are copied from vuex, updated to TypeScript.
 * Used to mock and create a custom action context
 */

/**
 * make localized dispatch, commit, getters and state
 * if there is no namespace, just use root ones
 */
export function makeLocalContext(store: Store<any>, namespace: string, path: string[]) {
    const noNamespace = namespace === '';

    const local = {
        dispatch: noNamespace ? store.dispatch : (_type, _payload, _options) => {
            const args = unifyObjectStyle(_type, _payload, _options);

            if (!args.options || !args.options.root) {
                args.type = `${namespace}${args.type}`;
            }

            return store.dispatch(args.type, args.payload);
        },
        commit: noNamespace ? store.commit : (_type, _payload, _options) => {
            const args = unifyObjectStyle(_type, _payload, _options);

            if (!args.options || !args.options.root) {
                args.type = `${namespace}${args.type}`;
            }

            return store.commit(args.type, args.payload);
        }
    };

    // getters and state object must be gotten lazily
    // because they will be changed by vm update
    Object.defineProperties(local, {
        getters: {
            get: noNamespace
                ? function() { return store.getters; }
                : function() { return makeLocalGetters(store, namespace); }
        },
        state: {
            get: function() { return getNestedState(store.state, path); }
        }
    });

    return local;
}

export function makeLocalGetters(store: any, namespace: string) {
    /* eslint-disable no-underscore-dangle */
    if (!store._makeLocalGettersCache[namespace]) {
        const gettersProxy = {};
        const splitPos = namespace.length;

        Object.keys(store.getters).forEach(type => {
            // skip if the target getter is not match this namespace
            // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
            if (type.slice(0, splitPos) !== namespace) {
                return;
            }
            // extract local getter type
            const localType = type.slice(splitPos);

            // Add a port to the getters proxy.
            // Define as getter property because
            // we do not want to evaluate the getters in this time.
            Object.defineProperty(gettersProxy, localType, {
                get: function() { return store.getters[type]; },
                enumerable: true
            });
        });

        store._makeLocalGettersCache[namespace] = gettersProxy;
    }

    return store._makeLocalGettersCache[namespace];
    /* eslint-enable no-underscore-dangle */
}

export function getNestedState(state: any, path: string[]) {
return path.reduce((innerState, key) => innerState[key], state);
}

export function unifyObjectStyle(type, payload, options) {
    if (type != null && typeof type === 'object' && type.type) {
        options = payload;
        payload = type;
        type = type.type;
    }

    return { type: type, payload: payload, options: options };
}
