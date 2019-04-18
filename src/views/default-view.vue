<template>
    <div class="default-view container" v-spl-ctx-menu="['settings', 'splitter', 'def']">
        <spl-splits/>
        <spl-timer/>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class DefaultView extends Vue {}
</script>

<style lang="scss" scoped>
.default-view {
    height: 100%;
}
</style>
