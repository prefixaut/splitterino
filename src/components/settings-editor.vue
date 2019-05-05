<template>
    <div class="settings-editor">
        <div class="sidebar">
            <spl-settings-editor-sidebar-entry
                v-for="(item, index) in configuration"
                type="main"
                :key="index"
                :group="item"
                :parentKey="item.key"
            />
        </div>

        <div class="content">
            <spl-settings-editor-setting
                :activeSettingsConfig="activeSettingsConfig"
                :activeSettingsPath="activeSettingsPath"
                @settingChanged="onSettingChanged"
            />

            <div class="footer">
                <spl-button outline @click="saveSettings">Save</spl-button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { set, isEqual } from 'lodash';

import { SettingsConfigurationObject, SettingsNamespace, Settings } from '../store/states/settings.state';

const settingsModule = namespace('splitterino/settings');

@Component({ name: 'spl-settings-editor' })
export default class SettingsEditorComponent extends Vue {
    @settingsModule.Getter
    public configuration;

    @settingsModule.Getter
    public getSettingByPath;

    /**
     * Temporary settings object
     */
    private changedSettings: Settings = {
        splitterino: {
            core: {}
        },
        plugins: {}
    };

    /**
     * Current settings config active in main section
     */
    public activeSettingsConfig: SettingsConfigurationObject[] = [];

    /**
     * Path to settings for currently active settings config
     */
    public activeSettingsPath: any = null;

    created() {
        // Listen for change event on groups
        // Update main section
        this.$eventHub.$on(
            'settingsGroupClicked',
            ({ activeSettingsConfig, settingsPath }) => {
                this.activeSettingsPath = settingsPath;
                this.activeSettingsConfig = activeSettingsConfig;
            }
        );
    }

    /**
     * Child event when a settings has changed
     *
     * Sets changed setting in temp settings object
     */
    onSettingChanged({ key, setting }: { key: string; setting: any }) {
        set(this.changedSettings, `${this.activeSettingsPath}.${key}`, setting);
    }

    /**
     * Save settings to store
     *
     * Store handles file saving
     */
    saveSettings() {
        let lastSetting: string;

        // Loop over first groups
        for (const [key, value] of Object.entries(this.changedSettings)) {
            lastSetting = this.saveGroupSettingsToStore(value, key);
        }

        // Wait for last setting to be commited to store then save to file
        this.$eventHub.$on(
            `commit:splitterino/settings/setSetting:${lastSetting}`,
            ({ key }) => {
                this.$store.commit('splitterino/settings/saveSettingsToFile');
            });
    }

    private saveGroupSettingsToStore(group: object, path: string) {
        let lastSetting: string;

        for (const [key, value] of Object.entries(group)) {
            // TODO: Check if setting has actually changed before updating it
            const fullKey = lastSetting = `${path}.${key}`;

            if (typeof value === 'object') {
                this.saveSetting(value, path, fullKey);
            } else {
                this.saveSingleSettingToStore(fullKey, value);
            }
        }

        return lastSetting;
    }

    private saveSetting(value: object, path: string, key: string) {
        // Check if object is settings object
        if (
            value != null &&
            value.hasOwnProperty('value')
        ) {
            this.saveSingleSettingToStore(key, value);
        } else {
            this.saveGroupSettingsToStore(value, `${path}.${key}`);
        }
    }

    private saveSingleSettingToStore(setting: string, value: any) {
        this.$store.dispatch(
            'splitterino/settings/setSetting',
            {
                id: setting,
                payload: {
                    key: setting,
                    value
                }
            }
        );
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.settings-editor {
    display: flex;
    height: 100%;

    .sidebar {
        flex: 0 0 200px;
        height: 100%;
        padding: 10px 10px 20px 0;
        background-color: $spl-color-off-black;
    }

    .content {
        flex: 1 1 auto;
        height: 100%;
        padding: 20px;
    }

    .footer {
        margin-top: 25px;
    }
}
</style>
