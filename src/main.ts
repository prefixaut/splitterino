import Vue from 'vue';
import { Aevum } from 'aevum';
import { OverlayHost } from 'vue-overlay-host';

import { getClientStore } from './store';
import App from './App.vue';

import ConfigurationEditor from './components/ConfigurationEditor.vue';
import NumberInput from './components/NumberInput.vue';
import Splits from './components/Splits.vue';
import SplitsEditor from './components/SplitsEditor.vue';
import TimeInput from './components/TimeInput.vue';
import ctxMenuDirective from './directives/contextMenu';

// Global Event Bus
Vue.prototype.$eventHub = new Vue();

// Register Components
Vue.component('vue-overlay-host', OverlayHost);
Vue.component('spl-configuiration-editor', ConfigurationEditor);
Vue.component('spl-number-input', NumberInput);
Vue.component('spl-splits', Splits);
Vue.component('spl-splits-editor', SplitsEditor);
Vue.component('spl-time-input', TimeInput);

// Register Directives
Vue.directive('spl-ctx-menu', ctxMenuDirective);

const formatter = new Aevum('(h:#:)(m:#:)(s:#.)(ddd)');
Vue.filter('aevum', value => {
    if (value == null) {
        return '';
    }
    return formatter.format(value);
});

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
    store: getClientStore(Vue) as any
}).$mount('#app');
