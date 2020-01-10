import { Injector } from 'lightweight-di';
import Vue from 'vue';
import { Store } from 'vuex';

import { RootState } from '../models/states/root.state';
import { IPCClient } from './ipc/client';

declare module 'vue/types/vue' {
    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $store: Store<RootState>;
    }
}

// tslint:disable-next-line no-default-export
export default Vue;
