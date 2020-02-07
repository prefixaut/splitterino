<template>
    <div v-spl-ctx-menu="['def']" class="keybindings-editor-view">
        <h1>Keybindings</h1>

        <spl-keybinding-editor />
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

import { ACTION_DISABLE_BINDINGS } from '../store/modules/keybindings.module';

@Component({ name: 'spl-property-decorator-view' })
export default class KeybindingEditorView extends Vue {
    created() {
        // Disable the bindings while in the editor
        this.$store.dispatch(ACTION_DISABLE_BINDINGS, true);
    }

    beforeDestroy() {
        // Enable the bindings again, as the editor is getting removed
        this.$store.dispatch(ACTION_DISABLE_BINDINGS, false);
    }
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
