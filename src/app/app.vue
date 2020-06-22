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

import { ELECTRON_SERVICE_TOKEN, SETTING_APP_SHOW_TITLE_BAR } from '../common/constants';
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
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        overflow: auto;
    }

    &.is-main-window:not(.show-title-bar) .app-content {
        height: 100%;
    }

    .title-bar + .app-content {
        height: calc(100% - #{$spl-title-bar-height});
        top: #{$spl-title-bar-height};
    }
}
</style>
