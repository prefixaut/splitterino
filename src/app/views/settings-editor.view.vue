<template>
    <div v-spl-ctx-menu="['def']" class="settings-editor-view">
        <spl-settings-editor />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { ACTION_DISABLE_BINDINGS } from '../../store/modules/keybindings.module';

@Component({ name: 'spl-settings-editor-view' })
export default class SettingsEditorView extends Vue {
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
.settings-editor-view {
    height: 100%;
}
</style>

