import { Injector } from 'lightweight-di';
import { get } from 'lodash';
import { createDecorator } from 'vue-class-component';

import {
    CONTEXT_MENU_MODULE_NAME,
    GAME_INFO_MODULE_NAME,
    KEYBINDINGS_MODULE_NAME,
    META_MODULE_NAME,
    PLUGINS_MODULE_NAME,
    SETTINGS_MODULE_NAME,
    SPLITS_MODULE_NAME,
    TIMER_MODULE_NAME,
} from '../common/constants';
import { Commit, SplitterinoModules } from '../models/store';
import { getContextMenuStoreModule } from '../store/modules/context-menu.module';
import { getGameInfoStoreModule } from '../store/modules/game-info.module';
import { getKeybindingsStoreModule } from '../store/modules/keybindings.module';
import { getMetaStoreModule } from '../store/modules/meta.module';
import { getPluginStoreModule } from '../store/modules/plugins.module';
import { getSettingsStoreModule, getValueByPath } from '../store/modules/settings.module';
import { getSplitsStoreModule } from '../store/modules/splits.module';
import { getTimerStoreModule } from '../store/modules/timer.module';

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

export function getSplitterinoModules(injector: Injector): SplitterinoModules {
    return {
        [CONTEXT_MENU_MODULE_NAME]: getContextMenuStoreModule(),
        [GAME_INFO_MODULE_NAME]: getGameInfoStoreModule(),
        [KEYBINDINGS_MODULE_NAME]: getKeybindingsStoreModule(),
        [META_MODULE_NAME]: getMetaStoreModule(),
        [PLUGINS_MODULE_NAME]: getPluginStoreModule(),
        [SETTINGS_MODULE_NAME]: getSettingsStoreModule(injector),
        [SPLITS_MODULE_NAME]: getSplitsStoreModule(injector),
        [TIMER_MODULE_NAME]: getTimerStoreModule(),
    };
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
