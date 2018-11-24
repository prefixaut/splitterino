import Vue from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        $eventHub: Vue;
    }
}

// tslint:disable-next-line no-default-export
export default Vue;
