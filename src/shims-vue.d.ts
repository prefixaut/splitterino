import { Injector } from 'lightweight-di';
import Vue from 'vue';
import { Store } from 'vuex';

import { RootState } from './models/states/root.state';

declare module '*.vue' {
    export default Vue;
}

declare module 'vue/types/vue' {
    interface Vue {
        $services: Injector;
        $store: Store<RootState>;
    }
}

export default Vue;
