import { Injector } from 'lightweight-di';
import Vue from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        $eventHub: Vue;
        $services: Injector;
    }
}

// tslint:disable-next-line no-default-export
export default Vue;
