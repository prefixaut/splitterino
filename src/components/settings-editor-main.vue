<template>
    <div class="settings-editor-main">
        <div v-for="(item, index) in activeSettingsConfig" :key="index">
            <div>{{ item.label }}</div>
            <component
                :is="item.component"
                :value="getSettingByPath(activeSettingsPath + '.' + item.key, item.defaultValue)"
                @change="onValueChanged(item.key, $event)"
                v-bind="item.props"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { SettingsConfigurationObject } from '../store/states/settings';

const settingsModule = namespace('splitterino/settings');

@Component
export default class SettingsEditorMainComponent extends Vue {
    @Prop()
    public activeSettingsConfig: SettingsConfigurationObject[];

    @Prop(String)
    public activeSettingsPath: string;

    @settingsModule.Getter
    public getSettingByPath;

    /**
     * Change event for currently loaded components
     */
    onValueChanged(key: string, event: any) {
        const value = typeof event === 'object' && 'target' in event ?
            event.target.value : event;
        // Pass value to parent
        this.$emit(
            'settingChanged',
            {
                key: key,
                // TODO: Check if this works for custom form elements
                setting: value
            }
        );
    }
}
</script>
