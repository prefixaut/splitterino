<template>
    <div class="settings-editor-sidebar">
        <div
            v-for="mod of modules"
            :key="mod"
            class="module-wrapper"
        >
            <div class="module-label">{{ mod }}</div>
            <div
                v-for="namespace of configuration[mod]"
                :key="namespace.key"
                class="namespace-wrapper"
            >
                <div class="namespace-label">{{ namespace.label }}</div>
                <div
                    v-for="group of namespace.groups"
                    :key="namespace.key + group.key"
                    class="group-wrapper"
                    @click="onGroupClicked(mod, namespace.key, group.key)"
                >{{ group.label }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import {  } from '../store/modules/settings.module';
import { SettingsConfiguration } from '../store/states/settings.state';
import { RootState } from '../store/states/root.state';

@Component({ name: 'spl-settings-editor-sidebar' })
export default class SettingsEditorSidebarComponent extends Vue {
    public readonly modules = ['splitterino', 'plugins'];

    public get configuration() {
        return (this.$store.state as RootState).splitterino.settings.configuration;
    }

    public onGroupClicked(moduleKey: string, namespaceKey: string, groupKey: string) {
        this.$emit('groupSelected', `${moduleKey}.${namespaceKey}.${groupKey}`);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.settings-editor-sidebar {
    .module-wrapper {
        & > .module-label {
            color: red;
        }

        & > .namespace-wrapper {
            color: lightblue;

            & > .namespace-label {
               margin-left: 20px;
            }

            & > .group-wrapper {
                margin-left: 40px;
                color: greenyellow;
            }
        }
    }
}
</style>
