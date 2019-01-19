<template>
  <div>
      <div class="group-label" @click="onClickLabel()">{{ group.label }}</div>
      <div v-if="childrenType === 'group'">
            <spl-settings-editor-group
                v-for="(item, index) in group.children"
                :key="index"
                :group="item"
                :parentKey="parentKey + '.' + item.key"
            />
      </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { SettingsGroupConfigurationObject } from '../store/states/settings';
import { RootState } from '../store/states/root';

@Component
export default class SettingsEditorGroupComponent extends Vue {
    @Prop({
        type: Object,
        required: true
    })
    /** Group object of configuration */
    group: SettingsGroupConfigurationObject;
    @Prop({
        type: String,
        default: 'group'
    })
    /** Type for different style rendering */
    type: 'main' | 'group'
    @Prop({
        type: String,
        default: ''
    })
    /** Recursively concatenated parent key string */
    parentKey: string;
    /**
     * Type of every child in children array
     *
     * Determines if group is clickable
     */
    childrenType: 'group' | 'setting' | null = null;

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
}
</script>

