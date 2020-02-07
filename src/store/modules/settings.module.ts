import { cloneDeep, get, isEqual, merge } from 'lodash';
import { ActionContext, Module } from 'vuex';

import { CORE_SETTINGS } from '../../common/constants';
import { RootState } from '../../models/states/root.state';
import {
    Settings,
    SettingsConfigurationNamespace,
    SettingsConfigurationValue,
    SettingsState,
} from '../../models/states/settings.state';
import { Injector } from 'lightweight-di';
import { IPC_CLIENT_TOKEN } from '../../models/ipc';

export const MODULE_PATH = 'splitterino/settings';

export const ID_GETTER_GET_VALUE_BY_PATH = 'getValueByPath';
export const ID_GETTER_GET_CONFIGURATIONS_BY_PATH = 'getConfigurationsByPath';

export const ID_MUTATION_SET_ALL_SETTINGS = 'setAllSettings';
export const ID_MUTATION_BULK_SET_SETTINGS = 'bulkSetSettings';

export const ID_ACTION_SET_ALL_SETTINGS = 'setAllSettings';
export const ID_ACTION_BULK_SET_SETTINGS = 'bulkSetSettings';

export const GETTER_VALUE_BY_PATH = `${MODULE_PATH}/${ID_GETTER_GET_VALUE_BY_PATH}`;
export const GETTER_CONFIGURATIONS_BY_PATH = `${MODULE_PATH}/${ID_GETTER_GET_CONFIGURATIONS_BY_PATH}`;

export const MUTATION_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_MUTATION_SET_ALL_SETTINGS}`;
export const MUTATION_BULK_SET_SETTINGS = `${MODULE_PATH}/${ID_MUTATION_BULK_SET_SETTINGS}`;

export const ACTION_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_ACTION_SET_ALL_SETTINGS}`;
export const ACTION_BULK_SET_SETTINGS = `${MODULE_PATH}/${ID_ACTION_BULK_SET_SETTINGS}`;

export interface SettingsPayload {
    values: Settings;
}

export function getSettingsStoreModule(injector: Injector): Module<SettingsState, RootState> {
    return {
        namespaced: true,
        state: {
            values: {
                splitterino: {
                    core: {},
                },
                plugins: {},
            },
            configuration: {
                splitterino: [CORE_SETTINGS],
                plugins: []
            },
        },
        getters: {
            [ID_GETTER_GET_CONFIGURATIONS_BY_PATH](state: SettingsState) {
                return (path: string): SettingsConfigurationValue[] => {
                    const splitPath = path.split('.');

                    if (splitPath.length < 3) {
                        return [];
                    }

                    const modulE = state.configuration[splitPath[0]] as SettingsConfigurationNamespace[];
                    if (modulE == null) {
                        return [];
                    }

                    const namespacE = modulE.find(value => value.key === splitPath[1]);
                    if (namespacE == null) {
                        return [];
                    }

                    const group = namespacE.groups.find(value => value.key === splitPath[2]);
                    if (group == null) {
                        return [];
                    }

                    return group.settings;
                };
            },
            [ID_GETTER_GET_VALUE_BY_PATH](state: SettingsState) {
                return (path: string | string[], defaultValue: any = null) => get(state.values, path, defaultValue);
            },
        },
        mutations: {
            [ID_MUTATION_SET_ALL_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                // TODO: check if there is not conflict with interface so state stays conistent
                state.values = payload.values;
            },
            [ID_MUTATION_BULK_SET_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                const newSettings = merge({}, state.values, payload.values);
                const oldSettings = cloneDeep(state.values);

                state.values = newSettings;

                for (const [moduleKey, modulE] of Object.entries(payload.values)) {
                    for (const [namespaceKey, namespacE] of Object.entries(modulE)) {
                        for (const [groupKey, group] of Object.entries(namespacE)) {
                            for (const [settingKey, setting] of Object.entries(group)) {
                                const path = `${moduleKey}.${namespaceKey}.${groupKey}.${settingKey}`;
                                const oldValue = get(
                                    oldSettings,
                                    path
                                );
                                if (!isEqual(setting, oldValue)) {
                                    injector.get(IPC_CLIENT_TOKEN)
                                        .sendLocalMessage(`setting-changed:${path}`, setting);
                                }
                            }
                        }
                    }
                }

                injector.get(IPC_CLIENT_TOKEN)
                    .sendLocalMessage('settings-changed');
            }
        },
        actions: {
            [ID_ACTION_SET_ALL_SETTINGS](context: ActionContext<SettingsState, RootState>, payload: SettingsPayload) {
                context.commit(ID_MUTATION_SET_ALL_SETTINGS, payload);
            },
            [ID_ACTION_BULK_SET_SETTINGS](context: ActionContext<SettingsState, RootState>, payload: SettingsPayload) {
                context.commit(ID_MUTATION_BULK_SET_SETTINGS, payload);
            }
        },
    };
}
