import Vue from 'vue';
import Router from 'vue-router';

import DefaultView from './views/default-view.vue';
import SplitsEditorView from './views/splits-editor-view.vue';

Vue.use(Router);

export const router = new Router({
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
            path: '/splits-editor',
            name: 'editor',
            component: SplitsEditorView,
        },
        {
            path: '/settings',
            name: 'settings'
        }
    ]
});
