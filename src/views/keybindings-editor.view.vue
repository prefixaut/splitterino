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

<style lang="scss" scoped>
.keybindings-editor-view {
    h1,
    h2 {
        margin-left: 1.5rem;
        margin-right: 1.5rem;
    }
}
</style>
