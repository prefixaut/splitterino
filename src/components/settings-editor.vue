<template>
    <div class="settings-editor">
        <div class="settings-sidebar">
            <spl-settings-editor-group
                v-for="(item, index) in configuration"
                type="main"
                :key="index"
                :group="item"
                :parentKey="item.key"
            />
        </div>

        <div class="settings-content">
            <spl-settings-editor-main
                :activeSettingsConfig="activeSettingsConfig"
                :activeSettingsPath="activeSettingsPath"
                @settingChanged="onSettingChanged"
            />
            <div class="settings-footer">
                <spl-button outline @click="saveSettings">Save</spl-button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { set, isEqual } from 'lodash';

import { SettingsConfigurationObject, SettingsNamespace, Settings } from '../store/states/settings';
import { getValueFromObject } from '../utils/get-from-object';

const settingsModule = namespace('splitterino/settings');

@Component
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
        // TODO: Check if setting has actually changed before updating it
        const loopOverGroup = (group: object, path: string) => {
            for (const [key, value] of Object.entries(group)) {
                const k = lastSetting = `${path}.${key}`;
                if (typeof value === 'object') {
                    // Check if object is settings object
                    if (
                        value != null &&
                        value.hasOwnProperty('value')
                    ) {
                        this.$store.dispatch(
                            'splitterino/settings/setSetting',
                            {
                                id: k,
                                payload: {
                                    key: k,
                                    value
                                }
                            }
                        );
                    } else {
                        loopOverGroup(value, `${path}.${key}`);
                    }
                } else {
                    this.$store.dispatch(
                        'splitterino/settings/setSetting',
                        {
                            id: k,
                            payload: {
                                key: k,
                                value
                            }
                        }
                    );
                }
            }
        };

        // Loop over first groups
        for (const [key, value] of Object.entries(this.changedSettings)) {
            loopOverGroup(value, key);
        }

        // Wait for last setting to be commited to store then save to file
        this.$eventHub.$on(
            `commit:splitterino/settings/setSetting:${lastSetting}`,
            ({ key }) => {
                this.$store.commit('splitterino/settings/saveSettingsToFile');
            });
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.settings-editor {
    display: flex;
    height: 100%;

    .settings-sidebar {
        flex: 0 0 200px;
        height: 100%;
        padding: 10px 10px 20px 0;
        background-color: $spl-color-off-black;
    }

    .settings-content {
        flex: 1 1 auto;
        height: 100%;
        padding: 20px;
    }
}
</style>
