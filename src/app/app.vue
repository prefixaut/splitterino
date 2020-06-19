<template>
    <div id="app" :class="{ 'is-main-window': isMainWindow, 'show-title-bar': showTitleBar }">
        <spl-title-bar :show-only-on-hover="isMainWindow && !showTitleBar" />

        <div class="app-content">
            <router-view />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { SETTING_APP_SHOW_TITLE_BAR } from '../common/constants';
import { ELECTRON_SERVICE_TOKEN } from '../models/services';
import { getValueByPath } from '../store/modules/settings.module';

@Component
export default class AppComponent extends Vue {

    public get isMainWindow() {
        const electron = this.$services.get(ELECTRON_SERVICE_TOKEN);
        const window = electron.getCurrentWindow();

        return window != null && window.id === 1;
    }

    public get showTitleBar() {
        return getValueByPath(this.$state.splitterino.settings)(SETTING_APP_SHOW_TITLE_BAR);
    }
}
</script>

<style lang="scss">
@import './styles/styles';

#app {
    overflow: hidden;
    height: 100%;

    .app-content {
        overflow: auto;
        height: calc(100% - #{$spl-title-bar-height});
    }

    &.is-main-window:not(.show-title-bar) .app-content {
        height: 100%;
    }
}
</style>
