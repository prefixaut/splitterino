import Vue from 'vue';
import Router from 'vue-router';

import {
    DEFAULT_ROUTE,
    DEFAULT_ROUTE_NAME,
    KEYBINDINGS_ROUTE,
    KEYBINDINGS_ROUTE_NAME,
    OPEN_SPLITS_ROUTE,
    OPEN_SPLITS_ROUTE_NAME,
    OPEN_TEMPLATE_ROUTE,
    OPEN_TEMPLATE_ROUTE_NAME,
    PLUGIN_MANAGER_ROUTE,
    PLUGIN_MANAGER_ROUTE_NAME,
    SETTINGS_ROUTE,
    SETTINGS_ROUTE_NAME,
    SPLITS_EDITOR_ROUTE,
    SPLITS_EDITOR_ROUTE_NAME,
} from '../common/constants';
import DefaultView from './views/default.view.vue';
import KeybindingsEditorView from './views/keybindings-editor.view.vue';
import OpenSplitsView from './views/open-splits.view.vue';
import OpenTemplateView from './views/open-template.view.vue';
import PluginManagerView from './views/plugin-manager.view.vue';
import SettingsEditorView from './views/settings-editor.view.vue';
import SplitsEditorView from './views/splits-editor.view.vue';

Vue.use(Router);

export const router = new Router({
    mode: 'hash',
    routes: [
        {
            path: '/',
            redirect: DEFAULT_ROUTE,
        },
        {
            path: DEFAULT_ROUTE,
            name: DEFAULT_ROUTE_NAME,
            component: DefaultView,
        },
        {
            path: KEYBINDINGS_ROUTE,
            name: KEYBINDINGS_ROUTE_NAME,
            component: KeybindingsEditorView,
        },
        {
            path: SETTINGS_ROUTE,
            name: SETTINGS_ROUTE_NAME,
            component: SettingsEditorView,
        },
        {
            path: SPLITS_EDITOR_ROUTE,
            name: SPLITS_EDITOR_ROUTE_NAME,
            component: SplitsEditorView,
        },
        {
            path: OPEN_SPLITS_ROUTE,
            name: OPEN_SPLITS_ROUTE_NAME,
            component: OpenSplitsView,
        },
        {
            path: OPEN_TEMPLATE_ROUTE,
            name: OPEN_TEMPLATE_ROUTE_NAME,
            component: OpenTemplateView,
        },
        {
            path: PLUGIN_MANAGER_ROUTE,
            name: PLUGIN_MANAGER_ROUTE_NAME,
            component: PluginManagerView,
        },
    ]
});
