import Vue, { Store } from 'vuex';
import { Injector } from 'lightweight-di';
import { RootState } from './models/states/root.state';
import { Commit } from './store';


declare module 'vue/types/vue' {

    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $store: Store<RootState>;
        $state: RootState;
        $commit: (handlerOrCommit: string | Commit, data?: any) => Promise<boolean>;
    }
}

export default Vue;
