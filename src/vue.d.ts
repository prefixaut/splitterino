import { Injector } from 'lightweight-di';
import { WatchOptions } from 'vue';
import Vue from 'vuex';

import { Commit, RootState } from './models/store';

type StoreObserveHandler = (state: RootState) => any;

declare module 'vue/types/vue' {
    interface Vue {
        $eventHub: Vue;
        $services: Injector;
        $state: RootState;
        $observe(
            expOrFn: string | StoreObserveHandler,
            callback: (newValue: any, oldValue: any) => void,
            options?: WatchOptions
        ): () => void;
        $commit: (handlerOrCommit: string | Commit, data?: any) => Promise<boolean>;
    }
}

export default Vue;
