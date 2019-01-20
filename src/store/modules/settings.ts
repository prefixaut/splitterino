import { set } from 'lodash';
import { ActionContext, Module } from 'vuex';
import { Typeguard } from '../../common/typeguard';
import { getValueFromObject } from '../../utils/get-from-object';
import { RootState } from '../states/root';
import { SettingsState, Settings } from '../states/settings';
import { saveJSONToFile } from '../../utils/file-save-load';

const moduleState: SettingsState = {
    settings: {
        splitterino: {
            core: {
            }
        },
        plugins: {}
    },
    configuration: [
        {
            key: 'splitterino',
            type: 'group',
            label: 'Splitterino',
            children: [
                {
                    key: 'core',
                    type: 'group',
                    label: 'Core',
                    children: [
                        {
                            key: 'testGroup',
                            type: 'group',
                            label: 'Test Group',
                            children: [
                                {
                                    key: 'testSetting',
                                    type: 'setting',
                                    component: 'input',
                                    defaultValue: 'test value',
                                    label: 'Test Setting',
                                    props: {
                                        placeholder: 'Whatever'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            key: 'plugins',
            type: 'group',
            label: 'Plugins',
            children: [
                {
                    key: 'testPlugin',
                    type: 'group',
                    label: 'Test Plugin',
                    children: [
                        {
                            key: 'pluginSetting',
                            type: 'setting',
                            component: 'spl-number-input',
                            defaultValue: 5,
                            label: 'Plugin Setting',
                            props: {
                                min: 3,
                                max: 8
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

const getters = {
    settings(state: SettingsState) {
        return state.settings;
    },
    configuration(state: SettingsState) {
        return state.configuration;
    },
    getSettingByPath(state: SettingsState) {
        return (
            path: string | string[],
            defaultValue: any = null,
            typeguard: Typeguard = null
        ) => {
            const value = getValueFromObject(state.settings, path);

            if (value == null || (typeguard && !typeguard(value))) {
                return defaultValue;
            } else {
                return value;
            }
        };
    }
};

const mutations = {
    setSetting(
        state: SettingsState,
        { payload: { key, value } }: { payload: { key: string; value: any} }
    ) {
        set(state.settings, key, value);
    },
    saveSettingsToFile(state: SettingsState) {
        saveJSONToFile('settings.json', state.settings);
    },
    setAllSettings(
        state: SettingsState,
        settings: Settings
    ) {
        state.settings = settings;
    }
};

const actions = {
    setSetting(context: ActionContext<SettingsState, RootState>, payload: any) {
        context.commit('setSetting', payload);
    },
    setAllSettings(
        context: ActionContext<SettingsState, RootState>,
        { settings }: { settings: Settings }
    ) {
        context.commit('setAllSettings', settings);
    }
};

export const settingsStoreModule: Module<SettingsState, any> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions
};
