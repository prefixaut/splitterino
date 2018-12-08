import Vue from 'vue';
import Router from 'vue-router';

import Splits from './components/Splits.vue';
import SplitsEditor from './views/SplitsEditor.vue';

Vue.use(Router);

export const router = new Router({
    routes: [
        {
            path: '/',
            redirect: '/splits'
        },
        {
            path: '/splits',
            name: 'splits',
            component: Splits
        },
        {
            path: '/settings',
            name: 'settings'
        },
        {
            path: '/splits/edit',
            name: 'splits-edit',
            component: SplitsEditor
        }
    ]
});
