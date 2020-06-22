<template>
    <div class="plugin-manager">
        <div class="container">
            <h1>Plugin Manager</h1>
        </div>

        <ul class="plugin-list">
            <li v-for="plugin of plugins" :key="plugin.meta.name + ':' + plugin.meta.version">
                <div class="plugin">
                    <spl-checkbox :value="isEnabled(plugin)" @change="togglePlugin(plugin)" />

                    <div class="name">{{ plugin.meta.name }}</div>
                    <div class="version">{{ plugin.meta.version }}</div>
                </div>
            </li>
        </ul>

        <div class="button-row">
            <spl-button
                outline
                theme="primary"
                @click="save"
            >Save</spl-button>

            <spl-button
                outline
                theme="primary"
                @click="close"
            >Cancel</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { ELECTRON_SERVICE_TOKEN, HANDLER_DISABLE_PLUGIN, HANDLER_ENABLE_PLUGIN } from '../../common/constants';
import { LoadedPlugin, PluginIdentifier } from '../../models/states/plugins.state';
import {
    isPluginEnabledGetter,
} from '../../store/modules/plugins.module';
import { State } from '../../utils/store';

@Component({ name: 'spl-plugin-manager' })
export default class PluginManagerComponent extends Vue {

    @State('splitterino.plugins.pluginList')
    public plugins: LoadedPlugin;

    @State('splitterino.plugins.enabledPlugins')
    public enabledPlugins: PluginIdentifier[];

    public get isEnabled() {
        return (plugin: LoadedPlugin) => isPluginEnabledGetter(this.$state.splitterino.plugins)(plugin.meta);
    }

    public togglePlugin(plugin: LoadedPlugin) {
        if (this.isEnabled(plugin)) {
            this.$commit(HANDLER_DISABLE_PLUGIN, plugin.meta);
        } else {
            this.$commit(HANDLER_ENABLE_PLUGIN, plugin.meta);
        }
    }

    public save() {
        this.close();
    }

    public close() {
        this.$services.get(ELECTRON_SERVICE_TOKEN).getCurrentWindow().close();
    }
}
</script>

<style lang="scss" scoped>
.plugin-manager {
    .plugin-list {
        padding: 0;
        list-style: none;

        .plugin {
            display: flex;
            padding: 0 20px 0 10px;
            margin: 10px 0;

            .checkbox {
                flex: 0 0 auto;
                margin: auto 0;
            }

            .name {
                flex: 1 1 auto;
                margin: auto 10px;
                font-size: 18px;
            }

            .version {
                flex: 0 0 auto;
                margin: auto 0;
                font-size: 12px;
            }
        }
    }

    .button-row {
        padding: 10px 20px;

        .spl-button:not(:first-of-type) {
            margin-left: 20px;
        }
    }
}
</style>
