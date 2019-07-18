<template>
    <div class="settings-editor-view" v-spl-ctx-menu="['def']">
        <spl-settings-editor/>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ name: 'spl-settings-editor-view' })
export default class SettingsEditorView extends Vue {
}
</script>

<style lang="scss" scoped>
.settings-editor-view {
    height: 100%;
}
</style>

