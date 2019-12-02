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
                @click="saveSettings"
            >Save Settings</spl-button>
            <spl-button
                v-if="(activeSettingsConfig != null && activeSettingsConfig.length > 0) || haveSettingsChanged"
                outline
                theme="primary"
                @click="applySettings"
            >Apply Settings</spl-button>
            <spl-button
                outline
                theme="primary"
                @click="close"
            >Cancel</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { set, isEqual, merge } from 'lodash';
import { Component, Vue } from 'vue-property-decorator';

import { ELECTRON_INTERFACE_TOKEN } from '../models/electron';
import { SettingsConfigurationValue, Settings } from '../models/states/settings.state';
import { IO_SERVICE_TOKEN } from '../services/io.service';
import { GETTER_VALUE_BY_PATH, GETTER_CONFIGURATIONS_BY_PATH, ACTION_BULK_SET_SETTINGS } from '../store/modules/settings.module';

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
        return this.$store.getters[GETTER_VALUE_BY_PATH];
    }

    public get haveSettingsChanged() {
        const state = this.$store.state;
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
        this.activeSettingsConfig = this.$store.getters[GETTER_CONFIGURATIONS_BY_PATH](group);
    }

    public onValueChange(value: any, settingKey: string) {
        set(this.changesValues, `${this.configPath}.${settingKey}`, value);
    }

    public applySettings() {
        this.$store.dispatch(ACTION_BULK_SET_SETTINGS, { values: this.changesValues });
    }

    public saveSettings() {
        this.applySettings();
        this.close();
    }

    public close() {
        this.$services.get(ELECTRON_INTERFACE_TOKEN).getCurrentWindow().close();
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
