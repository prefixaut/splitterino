import { Injector } from 'lightweight-di';
import { cloneDeep, get, isEqual, merge } from 'lodash';

import { CORE_SETTINGS, SETTINGS_MODULE_NAME, SPLITTERINO_NAMESPACE_NAME } from '../../common/constants';
import { IPC_CLIENT_SERVICE_TOKEN } from '../../models/services';
import {
    Settings,
    SettingsConfigurationNamespace,
    SettingsConfigurationValue,
    SettingsState,
} from '../../models/states/settings.state';
import { Module } from '../../models/store';

const MODULE_PATH = `${SPLITTERINO_NAMESPACE_NAME}/${SETTINGS_MODULE_NAME}`;

export const ID_HANDLER_SET_ALL_SETTINGS = 'setAllSettings';
export const ID_HANDLER_BULK_SET_SETTINGS = 'bulkSetSettings';

export const HANDLER_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_HANDLER_SET_ALL_SETTINGS}`;
export const HANDLER_BULK_SET_SETTINGS = `${MODULE_PATH}/${ID_HANDLER_BULK_SET_SETTINGS}`;

export interface SettingsPayload {
    values: Settings;
}

export function getSettingsStoreModule(injector: Injector): Module<SettingsState> {
    const ipcClient = injector.get(IPC_CLIENT_SERVICE_TOKEN);

    return {
        initialize() {
            return {
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
            };
        },
        handlers: {
            [ID_HANDLER_SET_ALL_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                // TODO: check if there is not conflict with interface so state stays conistent
                return { values: payload.values };
            },
            [ID_HANDLER_BULK_SET_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                const newSettings = merge({}, state.values, payload.values);
                const oldSettings = cloneDeep(state.values);

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
                                    ipcClient.sendLocalMessage(`setting-changed:${path}`, setting);
                                }
                            }
                        }
                    }
                }

                ipcClient.sendLocalMessage('settings-changed');

                return { values: newSettings };
            }
        },
    };
}

export function getConfigurationByPath(state: SettingsState) {
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
}

export function getValueByPath(state: SettingsState) {
    return (path: string | string[], defaultValue: any = null) => get(state.values, path, defaultValue);
}
