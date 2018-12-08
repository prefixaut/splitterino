import { Aevum } from 'aevum';
import Vue from 'vue';
import { OverlayHost } from 'vue-overlay-host';

import App from './App.vue';

import ButtonComponent from './components/button.vue';
import ConfigurationEditorComponent from './components/configuration-editor.vue';
import NumberInputComponent from './components/number-input.vue';
import SplitsComponents from './components/splits.vue';
import TimeInputComponent from './components/time-input.vue';
import TimerComponent from './components/timer.vue';
import { contextMenuDirective } from './directives/context-menu';
import { router } from './router';
import { getClientStore } from './store';

// Global Event Bus
Vue.prototype.$eventHub = new Vue();

// Register Components
Vue.component('spl-button', ButtonComponent);
Vue.component('spl-configuiration-editor', ConfigurationEditorComponent);
Vue.component('spl-number-input', NumberInputComponent);
Vue.component('spl-splits', SplitsComponents);
Vue.component('spl-time-input', TimeInputComponent);
Vue.component('spl-timer', TimerComponent);

// Register Directives
Vue.directive('spl-ctx-menu', contextMenuDirective);

// Register Filters
const formatter = new Aevum('(h:#:)(m:#:)(s:#.)(ddd)');
Vue.filter('aevum', value => {
    if (value == null) {
        return '';
    }

    return formatter.format(value);
});

Vue.component('vue-overlay-host', OverlayHost);

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
    store: getClientStore(Vue),
    router
}).$mount('#app');
