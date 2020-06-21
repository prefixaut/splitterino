<template>
    <div class="settings-editor">
        <spl-settings-editor-sidebar @groupSelected="onGroupSelected($event)" />

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
                        :value="settingsValue(configPath + '.' + setting.key)"
                        @change="onValueChange($event, setting.key)"
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
import { Subscription } from 'rxjs';
import { Component, Vue } from 'vue-property-decorator';

import { HANDLER_SET_SETTINGS_BULK } from '../../common/constants';
import { ELECTRON_SERVICE_TOKEN, IO_SERVICE_TOKEN, IPC_CLIENT_SERVICE_TOKEN } from '../../models/services';
import { SettingsConfigurationValue, Settings } from '../../models/states/settings.state';
import { getConfigurationByPath, getValueByPath } from '../../store/modules/settings.module';

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
    private settingsSubscription: Subscription;

    public created() {
        this.settingsSubscription = this.$services.get(IPC_CLIENT_SERVICE_TOKEN)
            .listenForLocalMessage('settings-changed')
            .subscribe(() => {
                this.$services.get(IO_SERVICE_TOKEN).saveSettingsToFile();
            });
    }

    public get settingsValue() {
        return getValueByPath(this.$state.splitterino.settings);
    }

    public get haveSettingsChanged() {
        const values = this.$state.splitterino.settings.values;
        const mergedValues = merge({}, values, this.changesValues);

        return !isEqual(values, mergedValues);
    }

    public onGroupSelected(group: string) {
        this.configPath = group;
        this.activeSettingsConfig = getConfigurationByPath(this.$state.splitterino.settings)(group);
    }

    public onValueChange(value: any, settingKey: string) {
        set(this.changesValues, `${this.configPath}.${settingKey}`, value);
    }

    public applySettings() {
        this.$commit(HANDLER_SET_SETTINGS_BULK, { values: this.changesValues });
    }

    public saveSettings() {
        this.applySettings();
        this.close();
    }

    public close() {
        this.$services.get(ELECTRON_SERVICE_TOKEN).getCurrentWindow().close();
    }

    public beforeDestroy() {
        if (this.settingsSubscription != null) {
            this.settingsSubscription.unsubscribe();
        }
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
