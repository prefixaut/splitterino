<template>
    <div class="settings-group" :class="{ 'has-children': childrenType === 'group', 'is-open': isOpen }">
        <div class="group-label">
            <span class="label-content" @click="onClickLabel()">{{ group.label }}</span>
            <div v-if="childrenType === 'group'" class="toggle-icon" @click="toggleOpen()">
                <fa-icon icon="caret-down" />
            </div>
        </div>

        <template v-if="childrenType === 'group'">
            <transition>
                <div v-show="isOpen" class="settings-children">
                    <spl-settings-editor-group
                        v-for="(item, index) in group.children"
                        :key="index"
                        :group="item"
                        :parentKey="parentKey + '.' + item.key"
                    />
                </div>
            </transition>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { SettingsGroupConfigurationObject } from '../store/states/settings';
import { RootState } from '../store/states/root';

@Component
export default class SettingsEditorGroupComponent extends Vue {
    /**
     * Group object of configuration
     */
    @Prop({
        type: Object,
        required: true
    })
    public group: SettingsGroupConfigurationObject;

    /**
     * Type for different style rendering
     */
    @Prop({
        type: String,
        default: 'group'
    })
    public type: 'main' | 'group';

    /**
     * Recursively concatenated parent key string
     */
    @Prop({
        type: String,
        default: ''
    })
    public parentKey: string;

    /**
     * Type of every child in children array
     *
     * Determines if group is clickable
     */
    public childrenType: 'group' | 'setting' | null = null;

    /**
     * If the settings are open or closed
     */
    public isOpen = true;

    beforeMount() {
        // Check for children types
        if (this.group.children.length > 0) {
            this.childrenType = this.group.children[0].type;
        }
    }

    /**
     * Emits event with settings config to load in main
     * and path to settings in settings object
     */
    onClickLabel() {
        if (this.childrenType === 'setting') {
            this.$eventHub.$emit(
                'settingsGroupClicked',
                {
                    activeSettingsConfig: this.group.children,
                    settingsPath: this.parentKey
                }
            );
        }
    }

    toggleOpen() {
        this.isOpen = !this.isOpen;
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.settings-group {
    padding-left: 15px;
    transition: 200ms;

    .group-label {
        padding: 3px 5px;
        transition: 200ms;
        display: flex;

        &:hover {
            background: lighten($spl-color-off-black, 3%);
        }

        .label-content {
            display: inline-block;
            flex: 1 1 auto;
        }

        .toggle-icon {
            transition: 200ms;
            display: inline-block;
            padding: 0 6px;
            cursor: pointer;
            flex: 0 0 auto;
        }
    }

    &.has-children:not(.is-open) {
        .toggle-icon {
            transform: rotate(-90deg);
        }
    }

/* TODO: Fix the transition styles
    .settings-children {
        &.v-enter,
        &.v-leave-to {
            opacity: 0;
            margin-top: -100%;
        }

        &.v-enter-active {
            transition: 200ms;
            margin-top: 0;
            opacity: 1;
            z-index: -1;
        }

        &.v-leave-active {
            transition: 200ms;
            margin-top: -100%;
            opacity: 0;
            z-index: -1;
        }
    }
*/
}
</style>
