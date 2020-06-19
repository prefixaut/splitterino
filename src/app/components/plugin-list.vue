<template>
    <ul class="plugin-list">
        <li v-for="plugin in plugins" :key="plugin.name + ':' + plugin.version">
            <div class="plugin">
                <div class="name">{{ plugin.name }}</div>
                <div class="version">{{ plugin.version }}</div>

                <spl-checkbox :value="isEnabled(plugin)" @change="togglePlugin(plugin)" />
            </div>
        </li>
    </ul>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { PluginMetaFile } from '../../models/files';
import { PluginIdentifier } from '../../models/states/plugins.state';
import { HANDLER_ENABLE_PLUGIN, HANDLER_DISABLE_PLUGIN } from '../../store/modules/plugin.module';

@Component({ name: 'spl-plugin-list' })
export default class PluginListComponent extends Vue {
    @Prop()
    public plugins: PluginMetaFile[];

    @Prop()
    public enabledPlugins: PluginIdentifier[];

    public get isEnabled() {
        return (plugin: PluginMetaFile) => this.enabledPlugins.find(
            id => id.name === plugin.name && id.version === plugin.version
        ) != null;
    }

    public togglePlugin(plugin: PluginMetaFile) {
        if (this.isEnabled(plugin)) {
            this.$commit(HANDLER_ENABLE_PLUGIN, plugin);
        } else {
            this.$commit(HANDLER_DISABLE_PLUGIN, plugin);
        }
    }
}
</script>

<style lang="scss" scoped>

</style>
