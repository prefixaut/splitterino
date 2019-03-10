import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Aevum } from 'aevum';
import Vue from 'vue';
import { OverlayHost } from 'vue-overlay-host';
import draggable from 'vuedraggable';

import App from './app.vue';
import ButtonComponent from './components/button.vue';
import ConfigurationEditorComponent from './components/configuration-editor.vue';
import GameInfoEditorComponent from './components/game-info-editor.vue';
import NumberInputComponent from './components/number-input.vue';
import SplitsEditorComponent from './components/splits-editor.vue';
import SplitsComponent from './components/splits.vue';
import TextInputComponent from './components/text-input.vue';
import TimeInputComponent from './components/time-input.vue';
import TimerComponent from './components/timer.vue';
import TitleBarComponent from './components/title-bar.vue';
import SettingsEditorComponent from './components/settings-editor.vue';
import SettingsEditorGroupComponent from './components/settings-editor-group.vue';
import SettingsEditorMainComponent from './components/settings-editor-main.vue';

import { contextMenuDirective } from './directives/context-menu';
import { router } from './router';
import { getClientStore } from './store';
import { remote } from 'electron';
import { loadSettings } from './common/load-settings';

// Global Event Bus
Vue.prototype.$eventHub = new Vue();

// FontAwesome Icons
library.add(fas);
Vue.component('fa-icon', FontAwesomeIcon);

// Draggable
Vue.component('draggable', draggable);

// Register Components
Vue.component('spl-button', ButtonComponent);
Vue.component('spl-configuiration-editor', ConfigurationEditorComponent);
Vue.component('spl-game-info-editor', GameInfoEditorComponent);
Vue.component('spl-number-input', NumberInputComponent);
Vue.component('spl-splits-editor', SplitsEditorComponent);
Vue.component('spl-splits', SplitsComponent);
Vue.component('spl-text-input', TextInputComponent);
Vue.component('spl-time-input', TimeInputComponent);
Vue.component('spl-timer', TimerComponent);
Vue.component('spl-title-bar', TitleBarComponent);
Vue.component('spl-settings-editor', SettingsEditorComponent);
Vue.component('spl-settings-editor-group', SettingsEditorGroupComponent);
Vue.component('spl-settings-editor-main', SettingsEditorMainComponent);

// Register Directives
Vue.directive('spl-ctx-menu', contextMenuDirective);

// Register Filters
const formatter = new Aevum('(h:#:)(m:#:)(s:#.)(ddd)');
Vue.filter('aevum', value => {
    if (value == null) {
        return '';
    }

    return formatter.format(value, { padding: true });
});

Vue.component('vue-overlay-host', OverlayHost);

Vue.config.productionTip = false;

const vue = new Vue({
    render: h => h(App),
    store: getClientStore(Vue),
    router
}).$mount('#app');

// Only execute certain functionality if window is main window
if (remote.getCurrentWindow().id === 1) {
    loadSettings(vue);
}
