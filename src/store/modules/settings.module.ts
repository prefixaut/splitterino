import { get } from 'lodash';

import { CORE_SETTINGS, ID_HANDLER_MERGE_SETTINGS } from '../../common/constants';
import {
    Settings,
    SettingsConfigurationNamespace,
    SettingsConfigurationValue,
    SettingsState
} from '../../models/states/settings.state';
import { Module } from '../../models/store';

export interface SettingsPayload {
    values: Settings;
}

export function getSettingsStoreModule(): Module<SettingsState> {
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
            [ID_HANDLER_MERGE_SETTINGS](state: SettingsState, payload: SettingsPayload) {
                return { values: payload.values };
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
