import { set, get } from 'lodash';
import Vue from 'vue';
import { Injector } from 'lightweight-di';

import { RootState } from '../store/states/root.state';
import { SettingsConfigurationObject, SettingsGroupConfigurationObject } from '../store/states/settings.state';
import { Logger } from '../utils/logger';
import { IOService } from '../services/io.service';

export function loadSettings(vue: Vue, injector: Injector) {
    const io = injector.get(IOService);
    const settings = io.loadJSONFromFile('settings.json');
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
