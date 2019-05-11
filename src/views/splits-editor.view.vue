<template>
    <div class="splits-editor-view" v-spl-ctx-menu="['def']">
        <spl-splits-editor />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component({ name: 'spl-splits-editor-view' })
export default class SplitsEditorView extends Vue {}
</script>

<style lang="scss" scoped>
.splits-editor-view {
    height: 100%;
}
</style>
