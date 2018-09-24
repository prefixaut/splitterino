import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import modules from './modules';

Vue.use(Vuex);

export const store = new Store({
    strict: true,
    modules: {
        splitterino: {
            namespaced: true,
            modules: { ...modules }
        }
    }
});
