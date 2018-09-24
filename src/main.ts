import Vue from 'vue';
import App from './App.vue';

import ConfigurationEditor from './components/ConfigurationEditor.vue';
import NumberInput from './components/NumberInput.vue';
import Splits from './components/Splits.vue';
import SplitsEditor from './components/SplitsEditor.vue';
import TimeInput from './components/TimeInput.vue';

// Register Components
Vue.component('spl-configuiration-editor', ConfigurationEditor);
Vue.component('spl-number-input', NumberInput);
Vue.component('spl-splits', Splits);
Vue.component('spl-splits-editor', SplitsEditor);
Vue.component('spl-time-input', TimeInput);

Vue.config.productionTip = false;

new Vue({
    render: h => h(App)
}).$mount('#app');
