<template>
    <div class="keybindings-editor-view" v-spl-ctx-menu="['def']">
        <h1>Keybindings</h1>

        <spl-keybinding-editor />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component({ name: 'spl-property-decorator-view' })
export default class KeybindingEditorView extends Vue {

}
</script>
