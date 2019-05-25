import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Aevum } from 'aevum';
import Vue from 'vue';
import { OverlayHost } from 'vue-overlay-host';
import draggable from 'vuedraggable';
import VueSelect from 'vue-select';
import { Injector } from 'lightweight-di';

import App from './app.vue';

// Components
import ButtonComponent from './components/button.vue';
import CheckboxComponent from './components/checkbox.vue';
import ConfigurationEditorComponent from './components/configuration-editor.vue';
import GameInfoEditorComponent from './components/game-info-editor.vue';
import KeybindingEditorComponent from './components/keybinding-editor.vue';
import KeybindingInputComponent from './components/keybinding-input.vue';
import NumberInputComponent from './components/number-input.vue';
import SplitsEditorComponent from './components/splits-editor.vue';
import SplitsComponent from './components/splits.vue';
import TextInputComponent from './components/text-input.vue';
import TimeInputComponent from './components/time-input.vue';
import TimerComponent from './components/timer.vue';
import TitleBarComponent from './components/title-bar.vue';
import SettingsEditorComponent from './components/settings-editor.vue';
import SettingsEditorSettingComponent from './components/settings-editor-setting.vue';
import SettingsEditorSidebarEntryComponent from './components/settings-editor-sidebar-entry.vue';

// Directives
import { contextMenuDirective } from './directives/context-menu.directive';

// Misc
import { router } from './router';
import { getClientStore } from './store';
import { remote } from 'electron';
import { loadSettings } from './common/load-settings';
import { registerDefaultFunctions } from './common/function-registry';
import { ElectronService } from './services/electron.service';
import { ELECTRON_INTERFACE_TOKEN } from './common/interfaces/electron-interface';

// FontAwesome Icons
library.add(fas);
Vue.component('fa-icon', FontAwesomeIcon);

// Draggable
Vue.component('draggable', draggable);

// Overlay Host
Vue.component('vue-overlay-host', OverlayHost);

// Select
Vue.component('vue-select', VueSelect);

// Register Components
Vue.component('spl-button', ButtonComponent);
Vue.component('spl-checkbox', CheckboxComponent);
Vue.component('spl-configuiration-editor', ConfigurationEditorComponent);
Vue.component('spl-game-info-editor', GameInfoEditorComponent);
Vue.component('spl-keybinding-editor', KeybindingEditorComponent);
Vue.component('spl-keybinding-input', KeybindingInputComponent);
Vue.component('spl-number-input', NumberInputComponent);
Vue.component('spl-splits-editor', SplitsEditorComponent);
Vue.component('spl-splits', SplitsComponent);
Vue.component('spl-text-input', TextInputComponent);
Vue.component('spl-time-input', TimeInputComponent);
Vue.component('spl-timer', TimerComponent);
Vue.component('spl-title-bar', TitleBarComponent);
Vue.component('spl-settings-editor', SettingsEditorComponent);
Vue.component('spl-settings-editor-setting', SettingsEditorSettingComponent);
Vue.component('spl-settings-editor-sidebar-entry', SettingsEditorSidebarEntryComponent);

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

// Disable tips
Vue.config.productionTip = false;

// Initialize the Dependency-Injection
const injector = Injector.resolveAndCreate([
    { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
]);

// Update the Prototype with an injector and event-hub
Vue.prototype.$injector = injector;
Vue.prototype.$eventHub = new Vue();

// Setup the default/core functions in the Function-Registry
registerDefaultFunctions();

// Initialize the Application
const vue = new Vue({
    render: h => h(App),
    store: getClientStore(Vue),
    router
}).$mount('#app');

// Only execute certain functionality if window is main window
if (remote.getCurrentWindow().id === 1) {
    // loadSettings(vue);
}
