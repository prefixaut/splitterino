<template>
    <div class="splits-editor-view container">
        <spl-splits-editor />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component({ name: 'spl-splits-editor-view' })
export default class SplitsEditorView extends Vue {}
</script>
