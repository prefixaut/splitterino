import { set, get } from 'lodash';
import Vue from 'vue';

import { RootState } from '../store/states/root';
import { SettingsConfigurationObject, SettingsGroupConfigurationObject } from '../store/states/settings';
import { loadJSONFromFile } from '../utils/io';
import { Logger } from '../utils/logger';

export function loadSettings(vue: Vue) {
    const settings = loadJSONFromFile('settings.json');
    const config = (vue.$store.state as RootState).splitterino.settings.configuration;

    const loopOverGroup = (
        children: SettingsConfigurationObject[] | SettingsGroupConfigurationObject[],
        path: string
    ) => {
        for (const child of children) {
            if (child.type === 'group') {
                loopOverGroup(child.children, `${path}.${child.key}`);
            } else if (get(settings, `${path}.${child.key}`, null) === null) {
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

    vue.$store.dispatch('splitterino/settings/setAllSettings', { settings });
}
