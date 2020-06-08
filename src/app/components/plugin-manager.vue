<template>
    <div class="plugin-manager">
        <div class="container">
            <h1>Plugin Manager</h1>
        </div>
        <spl-plugin-list :plugins="plugins" />
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PluginMetaFile } from '../../models/files';
import { State } from '../../utils/store';

@Component({ name: 'spl-plugin-manager' })
export default class PluginManagerComponent extends Vue {

    @State('splitterino.plugins.')
    public plugins: PluginMetaFile;
}
</script>

<style lang="scss" scoped>

</style>