import { get, mergeWith } from 'lodash';
import { createDecorator } from 'vue-class-component';

import { Commit } from '../models/store';
import { getValueByPath } from '../store/modules/settings.module';

export const State = (path: string) => createDecorator((options, key) => {
    if (options.computed == null) {
        options.computed = {};
    }

    options.computed[key] = {
        get() {
            return get(this.$state, path);
        },
    };
});

export const Config = (path: string, defaultValue?: any) => createDecorator((options, key) => {
    if (options.computed == null) {
        options.computed = {};
    }

    options.computed[key] = {
        get() {
            if (typeof defaultValue === 'function') {
                return getValueByPath(this.$state.splitterino.settings)(path, defaultValue());
            } else {
                return getValueByPath(this.$state.splitterino.settings)(path, defaultValue);
            }
        }
    };
});

export function storeMerge(dest: any, ...sources: any[]): any {
    return mergeWith(dest, ...sources, (origin, src) => {
        if (Array.isArray(src)) {
            return src;
        } else if (src != null && typeof src === 'object') {
            return storeMerge(origin, src);
        }
    });
}

export function createGetterTree<T>(
    referenceObj: T,
    valueObj: any = referenceObj,
    allowSet?: () => boolean,
    basePath: (string | number | symbol)[] = []
): T {
    const getterObj: T = {} as any;

    Object.keys(valueObj).forEach(key => {
        defineGetterProperty(referenceObj, getterObj, key, allowSet, basePath);
    });

    return getterObj;
}

export function defineGetterProperty<T>(
    referenceObj: T,
    getterObj: T,
    key: string | number | symbol,
    allowSet?: () => boolean,
    basePath: (string | number | symbol)[] = []
): void {
    if (getterObj == null || typeof getterObj !== 'object') {
        return;
    }

    Object.defineProperty(getterObj, key, {
        enumerable: true,
        configurable: true,
        get() {
            return makeValueGetter(
                referenceObj,
                key,
                allowSet,
                basePath
            );
        },
        set(value: any) {
            if (typeof allowSet === 'function' && allowSet()) {
                let valueObj = referenceObj;
                for (const part of basePath) {
                    valueObj = valueObj[part];
                }
                valueObj[key] = value;
            } else {
                throw new Error('This object is immutable and can not be edited!');
            }
        },
    });
}

export function createGetterArray<T>(
    referenceObj: any,
    valueObj: T[] = referenceObj,
    allowSet?: () => boolean,
    basePath: (string | number | symbol)[] = []
): T[] {
    const getterObj = [];

    for (let index = 0; index < valueObj.length; index++) {
        getterObj.push(makeValueGetter(
            referenceObj,
            index,
            allowSet,
            basePath
        ));
    }

    return getterObj as T[];
}

export function makeValueGetter(
    referenceObj: any,
    keyOrIndex: string | number | symbol,
    allowSet: () => boolean,
    basePath: (string | number | symbol)[] = [],
) {
    let value = referenceObj;
    for (const part of basePath) {
        value = value[part];
    }
    value = value[keyOrIndex];

    if (value != null && typeof value === 'object') {
        if (Array.isArray(value)) {
            return createGetterArray(referenceObj, value, allowSet, [...basePath, keyOrIndex]);
        } else {
            return createGetterTree(referenceObj, value, allowSet, [...basePath, keyOrIndex]);
        }
    } else {
        return value;
    }
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
