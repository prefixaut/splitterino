<template>
    <div class="title-bar" :class="{ 'show-only-on-hover': showOnlyOnHover }">
        <div class="title">{{ title }}</div>
        <div class="controls">
            <div v-if="minimizable" class="control minimize" @click="minimize()">
                <fa-icon icon="window-minimize" />
            </div>
            <div v-if="maximizable" class="control maximize" @click="toggleMaximize()">
                <fa-icon :icon="maximized ? 'window-restore' : 'window-maximize'" />
            </div>
            <div v-if="closeable" class="control close" @click="close()">
                <fa-icon icon="times" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { BrowserWindow } from 'electron';
import { Vue, Component, Prop } from 'vue-property-decorator';

import { ElectronInterface, ELECTRON_INTERFACE_TOKEN } from '../models/electron';
import { GETTER_VALUE_BY_PATH } from '../store/modules/settings.module';

@Component({ name: 'spl-title-bar' })
export default class TitleBarComponent extends Vue {
    @Prop({ type: Boolean, default: false })
    public showOnlyOnHover: boolean;

    public minimizable = true;
    public maximizable = true;
    public closeable = true;

    public title = 'Splitterino';
    public maximized = false;
    public windowRef: BrowserWindow;

    created() {
        this.windowRef = this.$services.get(ELECTRON_INTERFACE_TOKEN).getCurrentWindow();
        this.minimizable = this.windowRef.isMinimizable();
        this.maximizable = this.windowRef.isMaximizable();
        this.closeable = this.windowRef.isClosable();
        this.maximized = this.windowRef.isMaximized();
        this.title = this.windowRef.getTitle() || 'Splitterino';

        this.windowRef.on('maximize', () => {
            this.maximized = true;
        });
        this.windowRef.on('unmaximize', () => {
            this.maximized = false;
        });
    }

    minimize() {
        if (this.windowRef != null) {
            this.windowRef.minimize();
        }
    }

    toggleMaximize() {
        if (this.windowRef != null) {
            if (this.windowRef.isMaximized()) {
                this.windowRef.unmaximize();
            } else {
                this.windowRef.maximize();
            }
        }
    }

    close() {
        if (this.windowRef != null) {
            // Destroy the vue instance, to tear down everything
            this.$root.$destroy();

            this.windowRef.close();
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.title-bar {
    background: $spl-color-off-black;
    display: flex;
    height: $spl-title-bar-height;
    transition: 200ms;

    &.show-only-on-hover {
        opacity: 0;

        &:hover {
            opacity: 1;
        }
    }

    .title {
        -webkit-app-region: drag;
        display: inline-block;
        flex: 1 1 auto;
        padding: 1px 15px;
        font-size: 12px;
    }

    .controls {
        display: flex;
        flex: 0 0 auto;
        flex-direction: row;
        height: 100%;
        margin: 0 0 auto;

        .control {
            padding: 1px 8px;
            transition: 200ms;
            font-size: 12px;

            &.close:hover {
                background: $spl-color-danger;
            }

            &.minimize:hover,
            &.maximize:hover {
                background: $spl-color-dark-gray;
            }
        }
    }
}
</style>
