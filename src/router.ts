import Vue from 'vue';
import Router from 'vue-router';

import DefaultView from './views/default.view.vue';
import KeybindingsEditorView from './views/keybindings-editor.view.vue';
import SettingsEditorView from './views/settings-editor.view.vue';
import SplitsEditorView from './views/splits-editor.view.vue';
import OpenSplitsView from './views/open-splits.view.vue';
import OpenTemplateView from './views/open-template.view.vue';

Vue.use(Router);

export const router = new Router({
    mode: 'hash',
    routes: [
        {
            path: '/',
            redirect: '/default'
        },
        {
            path: '/default',
            name: 'default',
            component: DefaultView,
        },
        {
            path: '/keybindings',
            name: 'keybindings',
            component: KeybindingsEditorView,
        },
        {
            path: '/settings',
            name: 'settings',
            component: SettingsEditorView,
        },
        {
            path: '/splits-editor',
            name: 'editor',
            component: SplitsEditorView,
        },
        {
            path: '/open-splits',
            name: 'open-splits',
            component: OpenSplitsView,
        },
        {
            path: '/open-template',
            name: 'open-template',
            component: OpenTemplateView,
        },
    ]
});
