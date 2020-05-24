import { Injector } from 'lightweight-di';
import Vue from 'vuex';

import { RootState } from './models/states/root.state';
import { Commit } from './store';
import { WatchOptions } from 'vue';


declare module 'vue/types/vue' {

    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $state: RootState;
        $watch(
            expOrFn: string | Function,
            callback: (n: any, o: any) => void,
            options?: WatchOptions
        ): () => void;
        $commit: (handlerOrCommit: string | Commit, data?: any) => Promise<boolean>;
    }
}

export default Vue;
