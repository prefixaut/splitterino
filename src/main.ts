import { Aevum } from 'aevum';
import Vue from 'vue';
import { OverlayHost } from 'vue-overlay-host';

import App from './App.vue';
import ConfigurationEditor from './components/ConfigurationEditor.vue';
import NumberInput from './components/NumberInput.vue';
import Splits from './components/Splits.vue';
import TimeInput from './components/TimeInput.vue';
import Timer from './components/Timer.vue';
import ctxMenuDirective from './directives/context-menu';
import router from './router';
import { getClientStore } from './store';

// Components
// Directives
// Global Event Bus
Vue.prototype.$eventHub = new Vue();

// Register Components
Vue.component('spl-configuiration-editor', ConfigurationEditor);
Vue.component('spl-number-input', NumberInput);
Vue.component('spl-splits', Splits);
Vue.component('spl-time-input', TimeInput);
Vue.component('spl-timer', Timer);

// Register Directives
Vue.directive('spl-ctx-menu', ctxMenuDirective);

// Register Filters
const formatter = new Aevum('(h:#:)(m:#:)(s:#.)(ddd)');
Vue.filter('aevum',value => {
    if (value == null) {
        return '';
    }
    return formatter.format(value);
});

Vue.component('vue-overlay-host', OverlayHost);

Vue.config.productionTip = false;

new Vue({
    render:h => h(App),
    store: getClientStore(Vue),
    router
}).$mount('#app');
