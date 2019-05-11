<template>
    <div class="keybinding-editor">
        <div class="bindings">
            <div class="binding" v-for="(binding, index) of bindings" :key="index">
                <vue-select :options="actions" v-model="bindings[index].action" />

                <spl-keybinding-input v-model="bindings[index]" />

                <button class="clear" tabindex="0" title="clear combination" @click="clearInput($event, index)">
                    <fa-icon icon="times" />
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

import { ActionKeybinding, KeybindingAction } from '../common/interfaces/keybindings';

@Component({ name: 'spl-keybinding-editor' })
export default class KeybindingEditorComponent extends Vue {
    public actions: KeybindingAction[] = [];
    public bindings: ActionKeybinding[] = [];

    clearInput(event: MouseEvent, index: number) {
        event.preventDefault();
        event.stopPropagation();

        this.$set(this.bindings[index], 'accelerator', null);
        this.$set(this.bindings[index], 'keys', []);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.keybinding-editor {
    .clear {
        flex: 0 0 auto;
        margin-left: 10px;
        cursor: pointer;

        border: 1px solid $spl-color-off-black;
        background: $spl-color-light-danger;
        color: $spl-color-off-white;
        padding: 8px 13px;
        transition: 200ms;

        &.outline {
            border-color: $spl-color-primary;
        }

        &:focus {
            outline: none;
            border-color: $spl-color-primary;
        }
    }
}
</style>
