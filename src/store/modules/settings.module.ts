import { get, set } from 'lodash';
import { ActionContext, Module } from 'vuex';

import { saveJSONToFile } from '../../utils/io';
import { Typeguard } from '../../utils/is-type';
import { RootState } from '../states/root.state';
import { Settings, SettingsState } from '../states/settings.state';

const moduleState: SettingsState = {
    settings: {
        splitterino: {
            core: {},
        },
        plugins: {},
    },
    configuration: [
        {
            key: 'splitterino',
            type: 'group',
            label: 'Splitterino',
            children: [
                {
                    key: 'splits',
                    type: 'group',
                    label: 'Splits',
                    children: [
                        {
                            key: 'controls',
                            type: 'group',
                            label: 'Controls',
                            children: [
                                {
                                    key: 'split',
                                    type: 'setting',
                                    component: 'spl-keybinding-input',
                                    defaultValue: null,
                                    label: 'Splitting',
                                },
                                {
                                    key: 'pause',
                                    type: 'setting',
                                    component: 'spl-keybinding-input',
                                    defaultValue: null,
                                    label: 'Pause/Unpause',
                                },
                            ],
                        },
                    ],
                },
            ],
        }
    ],
};

const getters = {
    settings(state: SettingsState) {
        return state.settings;
    },
    configuration(state: SettingsState) {
        return state.configuration;
    },
    getSettingByPath(state: SettingsState) {
        return (path: string | string[], defaultValue: any = null, typeguard: Typeguard = null) => {
            const value = get(state.settings, path, null);

            if (value == null || (typeguard && !typeguard(value))) {
                return defaultValue;
            } else {
                return value;
            }
        };
    },
};

const mutations = {
    setSetting(state: SettingsState, { payload: { key, value } }: { payload: { key: string; value: any } }) {
        set(state.settings, key, value);
    },
    saveSettingsToFile(state: SettingsState) {
        saveJSONToFile('settings.json', state.settings);
    },
    setAllSettings(state: SettingsState, settings: Settings) {
        state.settings = settings;
    },
};

const actions = {
    setSetting(context: ActionContext<SettingsState, RootState>, payload: any) {
        context.commit('setSetting', payload);
    },
    setAllSettings(context: ActionContext<SettingsState, RootState>, { settings }: { settings: Settings }) {
        context.commit('setAllSettings', settings);
    },
};

export const settingsStoreModule: Module<SettingsState, any> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions,
};
