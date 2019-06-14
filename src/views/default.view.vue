<template>
    <div class="default-view" v-spl-ctx-menu="['settings', 'keybindings', 'splitter', 'def']">
        <spl-splits/>
        <div class="container">
            <spl-timer/>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'spl-default-view' })
export default class DefaultView extends Vue {}
</script>

<style lang="scss" scoped>
.default-view {
    height: 100%;
}
</style>
