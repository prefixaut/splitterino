import { Injector } from 'lightweight-di';
import Vue from 'vue';
import { RootState } from '../store/states/root.state';
import { Store } from 'vuex';

declare module 'vue/types/vue' {
    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $store: Store<RootState>;
    }
}

// tslint:disable-next-line no-default-export
export default Vue;
