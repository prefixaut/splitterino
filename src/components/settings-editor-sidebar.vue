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
        margin-top: 10px;

        .module-label {
            padding: 5px 10px 5px 20px;
            color: $spl-color-off-white;
        }

        .namespace-label {
            padding: 5px 10px 5px 35px;
            color: $spl-color-off-white;
        }

        .group-wrapper {
            padding: 5px 10px 5px 50px;
            color: $spl-color-off-white;

            &:hover {
                background: $spl-color-dark-gray;
                transition: 200ms;
                cursor: pointer;
            }
        }
    }
}
</style>
