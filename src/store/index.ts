import modules from './modules';

export function SplitterinoVuexPlugin(vuex) {
    vuex.registerModule('splitterino', {
        namespaced: true,
        modules
    });
}
