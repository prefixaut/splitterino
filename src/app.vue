<template>
    <div id="app" :class="{ 'is-main-window': isMainWindow, 'show-title-bar': showTitleBar }">
        <spl-title-bar :showOnlyOnHover="isMainWindow && !showTitleBar" />

        <div class="app-content">
            <router-view />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { GETTER_VALUE_BY_PATH } from './store/modules/settings.module';
import { ELECTRON_INTERFACE_TOKEN } from './common/interfaces/electron';

@Component
export default class AppComponent extends Vue {

    public get isMainWindow() {
        const electron = this.$services.get(ELECTRON_INTERFACE_TOKEN);
        const window = electron.getCurrentWindow();

        return window != null && window.id === 1;
    }

    public get showTitleBar() {
        return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.app.showTitleBar');
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
