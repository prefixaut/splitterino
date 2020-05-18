import { Injector } from 'lightweight-di';
import Vue from 'vuex';

import { RootState } from './models/states/root.state';
import { Commit } from './store';


declare module 'vue/types/vue' {

    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $state: RootState;
        $commit: (handlerOrCommit: string | Commit, data?: any) => Promise<boolean>;
    }
}

export default Vue;
