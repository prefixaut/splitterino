<template>
    <div class="title-bar">
        <div class="title">{{ title }}</div>
        <div class="controls">
            <div v-if="minimizable" class="control minimize" @click="minimize()">
                <fa-icon icon="window-minimize" />
            </div>
            <div v-if="maximizable" class="control maximize" @click="maximize()">
                <fa-icon icon="window-maximize" />
            </div>
            <div v-if="closeable" class="control close" @click="close()">
                <fa-icon icon="times"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { remote } from 'electron';
import { Vue, Component } from 'vue-property-decorator';

@Component
export default class TitleBarComponent extends Vue {
    public minimizable = true;
    public maximizable = true;
    public closeable = true;
    public title = 'Splitterino';

    minimize() {
        const win = remote.getCurrentWindow();
        if (win != null) {
            win.minimize();
        }
    }

    maximize() {
        const win = remote.getCurrentWindow();
        if (win != null) {
            win.maximize();
        }
    }

    close() {
        const win = remote.getCurrentWindow();
        if (win != null) {
            win.close();
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.title-bar {
    background: $spl-color-very-dark-gray;
    display: flex;

    .title {
        -webkit-app-region: drag;
        display: inline-block;
        flex: 1 1 auto;
        text-align: center;
        padding: 1px 15px;
        font-size: 12px;
    }

    .controls {
        display: flex;
        flex: 0 0 auto;
        flex-direction: row;
        height: 20px;
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
