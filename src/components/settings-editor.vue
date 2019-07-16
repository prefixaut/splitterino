<template>
    <div class="settings-editor">
        <spl-settings-editor-sidebar @groupSelected="onGroupSelected($event)"/>
        <div class="settings-editor-main">
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
            <button @click="applySettings">Save</button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { SettingsConfigurationValue, Settings } from '../store/states/settings.state';
import { GETTER_SETTINGS_CONFIGURATION_VALUES_BY_PATH, GETTER_SETTING_BY_PATH, ACTION_BULK_SET_SETTINGS, MUTATION_BULK_SET_SETTINGS } from '../store/modules/settings.module';
import { set } from 'lodash';
import { IOService } from '../services/io.service';

@Component({ name: 'spl-settings-editor' })
export default class SettingsEditorComponent extends Vue {
    public activeSettingsConfig: SettingsConfigurationValue[] = [];
    public configPath: string = '';
    public changedSettings: Settings = {
        splitterino: {
            core: {}
        },
        plugins: {}
    };

    public get settingsValue() {
        return this.$store.getters[GETTER_SETTING_BY_PATH];
    }

    public created() {
        this.$eventHub.$on('settings-changed', () => {
            this.$services.get(IOService).saveSettingsToFile(this.$store);
        });
    }

    public onGroupSelected(group: string) {
        this.configPath = group;
        this.activeSettingsConfig = this.$store.getters[GETTER_SETTINGS_CONFIGURATION_VALUES_BY_PATH](group);
    }

    public onValueChange(value: any, settingKey: string) {
        set(this.changedSettings, `${this.configPath}.${settingKey}`, value);
    }

    public applySettings() {
        this.$store.commit(ACTION_BULK_SET_SETTINGS, { settings: this.changedSettings });
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.settings-editor {
    display: flex;
}
</style>
