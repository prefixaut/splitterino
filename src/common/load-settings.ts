import Vue from 'vue';
import { loadJSONFromFile } from '../utils/file-save-load';
import { Logger } from '../utils/logger';
import { RootState } from '../store/states/root';
import { SettingsConfigurationObject, SettingsGroupConfigurationObject } from '../store/states/settings';
import { getValueFromObject } from '../utils/get-from-object';
import { set } from 'lodash';

export function loadSettings(vue: Vue) {
    const settings = loadJSONFromFile('settings.json');
    const config = (vue.$store.state as RootState)
                        .splitterino.settings.configuration;

    const loopOverGroup =
        (children: SettingsConfigurationObject[] |
            SettingsGroupConfigurationObject[], path: string) => {
        for (const child of children) {
            if (child.type === 'group') {
                loopOverGroup(child.children, `${path}.${child.key}`);
            } else if (
                getValueFromObject(
                    settings,
                    `${path}.${child.key}`
                ) === null
            ) {
                set(settings, `${path}.${child.key}`, child.defaultValue);
            }
        }
    };

    if (settings === null) {
        Logger.error('Unable to load settings');

        return;
    }

    for (const group of config) {
        loopOverGroup(group.children, group.key);
    }

    vue.$store.dispatch(
        'splitterino/settings/setAllSettings',
        { settings }
    );
}
