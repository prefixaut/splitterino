<template>
    <div class="splits-editor-view" v-spl-ctx-menu="['def']">
        <div class="container">
            <h1>Game Information</h1>
            <spl-game-info-editor></spl-game-info-editor>
        </div>
        <spl-splits-editor>
            <h1>Splits Editor</h1>
        </spl-splits-editor>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component({ name: 'spl-splits-editor-view' })
export default class SplitsEditorView extends Vue {}
</script>

<style lang="scss" scoped>
.splits-editor-view {
    height: auto;
}
</style>
