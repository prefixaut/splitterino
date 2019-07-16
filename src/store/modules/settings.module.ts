import { get, set, merge, cloneDeep, isEqual } from 'lodash';
import { ActionContext, Module } from 'vuex';

import { Typeguard } from '../../utils/is-type';
import { RootState } from '../states/root.state';
import { Settings, SettingsState, SettingsConfigurationValue, SettingsConfigurationNamespace } from '../states/settings.state';
import { eventHub } from '../../utils/event-hub';

export const MODULE_PATH = 'splitterino/settings';

const ID_GETTER_GET_SETTING_BY_PATH = 'getSettingByPath';
const ID_GETTER_GET_SETTINGS_CONFIGURATION_VALUES_BY_PATH = 'getSettingsConfigurationValueByPath';

const ID_MUTATION_SET_ALL_SETTINGS = 'setAllSettings';
const ID_MUTATION_BULK_SET_SETTINGS = 'bulkSetSettings';

const ID_ACTION_SET_ALL_SETTINGS = 'setAllSettings';
const ID_ACTION_BULK_SET_SETTINGS = 'bulkSetSettings';

export const GETTER_SETTING_BY_PATH = `${MODULE_PATH}/${ID_GETTER_GET_SETTING_BY_PATH}`;
export const GETTER_SETTINGS_CONFIGURATION_VALUES_BY_PATH =
    `${MODULE_PATH}/${ID_GETTER_GET_SETTINGS_CONFIGURATION_VALUES_BY_PATH}`;

export const MUTATION_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_MUTATION_SET_ALL_SETTINGS}`;
export const MUTATION_BULK_SET_SETTINGS = `${MODULE_PATH}/${ID_MUTATION_BULK_SET_SETTINGS}`;

export const ACTION_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_ACTION_SET_ALL_SETTINGS}`;
export const ACTION_BULK_SET_SETTINGS = `${MODULE_PATH}/${ID_ACTION_BULK_SET_SETTINGS}`;

export interface SettingsPayload {
    settings: Settings;
}

export function getSettingsStoreModule(): Module<SettingsState, RootState> {
    return {
        namespaced: true,
        state: {
            settings: {
                splitterino: {
                    core: {},
                },
                plugins: {},
            },
            configuration: {
                splitterino: [
                    {
                        key: 'core',
                        label: 'Core',
                        groups: [
                            {
                                key: 'test',
                                label: 'Test',
                                settings: [
                                    {
                                        key: 'mysetting',
                                        label: 'My Label',
                                        component: 'spl-text-input',
                                        componentProps: {},
                                        defaultValue: 'hello'
                                    }
                                ]
                            }
                        ]
                    }
                ],
                plugins: []
            },
        },
        getters: {
            [ID_GETTER_GET_SETTINGS_CONFIGURATION_VALUES_BY_PATH](state: SettingsState) {
                return (path: string): SettingsConfigurationValue[] => {
                    const splitPath = path.split('.');

                    if (splitPath.length < 3) {
                        return [];
                    }

                    const modulE = state.configuration[splitPath[0]] as SettingsConfigurationNamespace[];
                    if (modulE == null) {
                        return [];
                    }

                    const namespacE = modulE.find(value => {
                        return value.key === splitPath[1];
                    });
                    if (namespacE == null) {
                        return [];
                    }

                    const group = namespacE.groups.find(value => {
                        return value.key === splitPath[2];
                    });
                    if (group == null) {
                        return [];
                    }

                    return group.settings;
                };
            },
            [ID_GETTER_GET_SETTING_BY_PATH](state: SettingsState) {
                return (path: string | string[], defaultValue: any = null, typeguard: Typeguard = null) => {
                    const value = get(state.settings, path, null);

                    if (value == null || (typeguard && !typeguard(value))) {
                        return defaultValue;
                    } else {
                        return value;
                    }
                };
            },
        },
        mutations: {
            [ID_MUTATION_SET_ALL_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                state.settings = payload.settings;
            },
            [ID_MUTATION_BULK_SET_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                const newSettings = merge({}, state.settings, payload.settings);
                const oldSettings = cloneDeep(state.settings);

                state.settings = newSettings;

                for (const [moduleKey, modulE] of Object.entries(payload.settings)) {
                    for (const [namespaceKey, namespacE] of Object.entries(modulE)) {
                        for (const [groupKey, group] of Object.entries(namespacE)) {
                            for (const [settingKey, setting] of Object.entries(group)) {
                                const path = `${moduleKey}.${namespaceKey}.${groupKey}.${settingKey}`;
                                const oldValue = get(
                                    oldSettings,
                                    path
                                );
                                if (!isEqual(setting, oldValue)) {
                                    eventHub.$emit(`setting-changed:${path}`, setting);
                                }
                            }
                        }
                    }
                }

                eventHub.$emit('settings-changed');
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
