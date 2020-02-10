import Vue, { Store } from 'vuex';
import { Injector } from 'lightweight-di';
import { RootState } from './models/states/root.state';


declare module 'vue/types/vue' {

    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $store: Store<RootState>;
    }
}

export default Vue;
