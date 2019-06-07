import { Injector } from 'lightweight-di';
import { get, set } from 'lodash';
import { ActionContext, Module } from 'vuex';

import { IOService } from '../../services/io.service';
import { Typeguard } from '../../utils/is-type';
import { RootState } from '../states/root.state';
import { Settings, SettingsState } from '../states/settings.state';

const MODULE_PATH = 'splitterino/settings';

const ID_GETTER_SETTINGS = 'settings';
const ID_GETTER_CONFIGURATION = 'configuration';
const ID_GETTER_GET_SETTING_BY_PATH = 'getSettingByPath';

const ID_MUTATION_SET_SETTING = 'setSetting';
const ID_MUTATION_SAVE_SETTINGS_TO_FILE = 'saveSettingsToFile';
const ID_MUTATION_SET_ALL_SETTINGS = 'setAllSettings';

const ID_ACTION_SET_SETTING = 'setSetting';
const ID_ACTION_SET_ALL_SETTINGS = 'setAllSettings';

export const GETTER_SETTINGS = `${MODULE_PATH}/${ID_GETTER_SETTINGS}`;
export const GETTER_CONFIGURATION = `${MODULE_PATH}/${ID_GETTER_CONFIGURATION}`;
export const GETTER_SETTING_BY_PATH = `${MODULE_PATH}/${ID_GETTER_GET_SETTING_BY_PATH}`;

export const MUTATION_SET_SETTING = `${MODULE_PATH}/${ID_MUTATION_SET_SETTING}`;
export const MUTATION_SAVE_SETTINGS_TO_FILE = `${MODULE_PATH}/${ID_MUTATION_SAVE_SETTINGS_TO_FILE}`;
export const MUTATION_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_MUTATION_SET_ALL_SETTINGS}`;

export const ACTION_SET_SETTING = `${MODULE_PATH}/${ID_ACTION_SET_SETTING}`;
export const ACTION_SET_ALL_SETTINGS = `${MODULE_PATH}/${ID_ACTION_SET_ALL_SETTINGS}`;

export function getSettingsStoreModule(injector: Injector): Module<SettingsState, RootState> {
    const io = injector.get(IOService);

    return {
        state: {
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
                    children: [],
                }
            ],
        },
        getters: {
            [ID_GETTER_SETTINGS](state: SettingsState) {
                return state.settings;
            },
            [ID_GETTER_CONFIGURATION](state: SettingsState) {
                return state.configuration;
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
            [ID_MUTATION_SET_SETTING](
                state: SettingsState,
                { payload: { key, value } }: { payload: { key: string; value: any } }
            ) {
                set(state.settings, key, value);
            },
            [ID_MUTATION_SAVE_SETTINGS_TO_FILE](state: SettingsState) {
                io.saveJSONToFile('settings.json', state.settings);
            },
            [ID_MUTATION_SET_ALL_SETTINGS](state: SettingsState, settings: Settings) {
                state.settings = settings;
            },
        },
        actions: {
            [ID_ACTION_SET_SETTING](context: ActionContext<SettingsState, RootState>, payload: any) {
                context.commit(ID_MUTATION_SET_SETTING, payload);
            },
            [ID_ACTION_SET_ALL_SETTINGS](
                context: ActionContext<SettingsState, RootState>,
                { settings }: { settings: Settings }
            ) {
                context.commit(ID_MUTATION_SET_ALL_SETTINGS, settings);
            },
        },
    };
}
