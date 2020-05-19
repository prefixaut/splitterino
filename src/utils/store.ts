import { Action, ActionHandler, Module, StoreOptions } from 'vuex';
import { Commit } from '../store';

export function getModuleActionAndMutationNames(
    module: StoreOptions<any> | Module<any, any>,
    name: string = '',
    namespace?: string
): { actions: string[]; mutations: string[] } {
    const actionNames = [];
    const mutationNames = [];

    if (namespace == null || namespace.trim().length < 1) {
        namespace = name;
    }

    if (module != null && typeof module === 'object') {
        if ((module as any).namespaced) {
            namespace += `/${name}`;
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
    const handler = typeof action === 'function' ? action : action.handler;

    return { type, handler };
}

export function createGetterTree<T>(reference: T, obj: any = reference, basePath: (string | number | symbol)[] = []): T {
    const getterObj = {};

    Object.keys(obj).forEach(key => {
        Object.defineProperty(getterObj, key, {
            get() {
                let value = reference;
                for (const part of [...basePath, key]) {
                    value = value[part];
                }

                if (value != null && typeof obj[key] === 'object') {
                    if (Array.isArray(obj[key])) {
                        return createGetterArray(reference, value as unknown as any[], [...basePath, key]);
                    } else {
                        return createGetterTree(reference, value, [...basePath, key]);
                    }
                } else {
                    return value;
                }
            },
            set() {
                throw new Error('This object is immutable and can not be edited!');
            },
        });
    });

    return getterObj as T;
}

export function createGetterArray<T>(reference: any, obj: T[] = reference, basePath: (string | number | symbol)[] = []): T[] {
    const getterObj = {};

    Object.defineProperty(getterObj, 'length', {
        get() {
            let value = reference;
            for (const part of basePath) {
                value = value[part];
            }

            return value.length;
        }
    });

    Object.defineProperty(getterObj, 'splice', () => {
        throw new Error('This array is immutable and can not be edited!');
    });

    for (let index = 0; index < obj.length; index++) {
        Object.defineProperty(getterObj, index, {
            get() {
                let value = reference;
                for (const part of [...basePath, index]) {
                    value = value[part];
                }

                if (value != null && typeof obj[index] === 'object') {
                    if (Array.isArray(obj[index])) {
                        return createGetterArray(reference, value, [...basePath, index]);
                    } else {
                        return createGetterTree(reference, value, [...basePath, index]);
                    }
                } else {
                    return value;
                }
            },
            set() {
                throw new Error('This array is immutable and can not be edited!');
            }
        });
    }

    return getterObj as T[];
}

export function createCommit(handler: string, data?: any): Commit {
    const parts = handler.split('/');
    const commit: Commit = {
        namespace: parts.shift(),
        module: parts.shift(),
        handler: parts.join('/'),
        data: data,
    };

    return commit;
}
