<template>
    <div id="app">
        <spl-title-bar />
        <div class="app-content">
            <router-view />
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

export default class AppComponent extends Vue { }
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
}
</style>
