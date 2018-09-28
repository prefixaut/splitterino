import Vue from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        $eventHub: Vue;
    }
}

export default Vue;
