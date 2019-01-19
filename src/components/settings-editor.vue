<template>
  <div class="settings-editor">
    <div class="settings-sidebar">
      <spl-settings-editor-group
        v-for="(item, index) in configuration"
        :key="index"
        :group="item"
        :parentKey="item.key"
        type="main"
      />
    </div>
    <div>
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
import { SettingsConfigurationObject, SettingsNamespace, Settings } from '../store/states/settings';
import { set, isEqual } from 'lodash';
import { getValueFromObject } from '../utils/get-from-object';

const settingsModule = namespace('splitterino/settings');

@Component
export default class SettingsEditorComponent extends Vue {
    @settingsModule.Getter configuration;
    @settingsModule.Getter getSettingByPath;

    /** Temporary settings object */
    private changedSettings: Settings = {
        splitterino: {
            core: {}
        },
        plugins: {}
    }

    /** Current settings config active in main section */
    public activeSettingsConfig: SettingsConfigurationObject[] = [];
    /** Path to settings for currently active settings config */
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
    onSettingChanged({ key, setting }: { key: string, setting: any }) {
        set(this.changedSettings, this.activeSettingsPath + '.' + key, setting);
    }

    /**
     * Save settings to store
     *
     * Store handles file saving
     */
    saveSettings() {
        const loopOverGroup = (group: object, path: string = '') => {
            for (const [key, value] of Object.entries(group)) {
                if (typeof value === 'object') {
                    if (
                        value != null &&
                        value.hasOwnProperty('value')
                    ) {
                        this.$store.dispatch(
                            'splitterino/settings/setSetting',
                            {
                                key: `${path}.${key}`,
                                value
                            }
                        );
                    } else {
                        loopOverGroup(value, `${path}.${key}`);
                    }
                } else {
                    this.$store.dispatch(
                        'splitterino/settings/setSetting',
                        {
                            key: `${path}.${key}`,
                            value
                        }
                    );
                }
            }
        }
        for (const [key, value] of Object.entries(this.changedSettings)) {
            loopOverGroup(value, key);
        }
    }
}
</script>

<style lang="scss" scoped>
@import "../styles/core.scss";

.settings-editor {
    display: flex;
    & .settings-sidebar {
        height: calc(100vh - #{$spl-title-bar-height});
        width: 200px;
        background-color: black;
    }
    & .settings-footer {
        width: 100%;
        background-color: $spl-color-very-dark-gray;
        height: 50px;
    }
}
</style>
