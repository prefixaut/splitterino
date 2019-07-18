<template>
    <div class="settings-editor">
        <spl-settings-editor-sidebar @groupSelected="onGroupSelected($event)"/>

        <div class="settings-editor-main">
            <div class="settings-wrapper">
                <div
                    v-for="setting of activeSettingsConfig"
                    :key="configPath + setting.key"
                    class="setting"
                >
                    <div class="setting-label">{{ setting.label }}</div>
                    <component
                        :is="setting.component"
                        v-bind="setting.componentProps"
                        @change="onValueChange($event, setting.key)"
                        :value="settingsValue(configPath + '.' + setting.key)"
                    />
                </div>
            </div>

            <spl-button
                v-if="(activeSettingsConfig != null && activeSettingsConfig.length > 0) || haveSettingsChanged"
                outline
                theme="primary"
                @click="applySettings"
            >Save Settings</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { set, isEqual, merge } from 'lodash';

import { SettingsConfigurationValue, Settings } from '../store/states/settings.state';
import { GETTER_SETTINGS_CONFIGURATION_VALUES_BY_PATH, GETTER_SETTING_BY_PATH, ACTION_BULK_SET_SETTINGS } from '../store/modules/settings.module';
import { IO_SERVICE_TOKEN } from '../services/io.service';
import { RootState } from '../store/states/root.state';
import { createHash } from 'crypto';

@Component({ name: 'spl-settings-editor' })
export default class SettingsEditorComponent extends Vue {
    public activeSettingsConfig: SettingsConfigurationValue[] = [];
    public configPath: string = '';
    public changesValues: Settings = {
        splitterino: {
            core: {}
        },
        plugins: {}
    };

    public get settingsValue() {
        return this.$store.getters[GETTER_SETTING_BY_PATH];
    }

    public get haveSettingsChanged() {
        const state: RootState = this.$store.state;
        const values = state.splitterino.settings.values;
        const mergedValues = merge({}, values, this.changesValues);

        return !isEqual(values, mergedValues);
    }

    public created() {
        this.$eventHub.$on('settings-changed', () => {
            this.$services.get(IO_SERVICE_TOKEN).saveSettingsToFile(this.$store);
        });
    }

    public onGroupSelected(group: string) {
        this.configPath = group;
        this.activeSettingsConfig = this.$store.getters[GETTER_SETTINGS_CONFIGURATION_VALUES_BY_PATH](group);
    }

    public onValueChange(value: any, settingKey: string) {
        set(this.changesValues, `${this.configPath}.${settingKey}`, value);
    }

    public applySettings() {
        this.$store.dispatch(ACTION_BULK_SET_SETTINGS, { settings: this.changesValues });
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.settings-editor {
    display: flex;
    height: 100%;

    .settings-editor-sidebar {
        flex: 1 1 20%;
        height: 100%;
        min-width: 130px;
        max-width: 250px;
        border-right: 2px solid $spl-color-off-black;
    }

    .settings-editor-main {
        flex: 1 1 100%;
        margin: 15px;

        .settings-wrapper {
            margin-bottom: 25px;
        }
    }
}
</style>
