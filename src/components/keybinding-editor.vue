<template>
    <div class="keybinding-editor">
        <div class="bindings">
            <div class="binding" v-for="(binding, index) of bindings" :key="index">
                <vue-select class="action-select" :options="actions" v-model="bindings[index].action" />

                <spl-keybinding-input v-model="bindings[index]" />

                <button class="clear" tabindex="0" title="clear combination" @click="clearInput($event, index)">
                    <fa-icon icon="times" />
                </button>
            </div>
        </div>

        <spl-button class="add-button" theme="primary" outline @click="addNew()">
            <fa-icon icon="plus" />
            <span>&nbsp;Add new Keybinding</span>
        </spl-button>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { cloneDeep } from 'lodash';

import { ActionKeybinding, KeybindingDescriptor } from '../common/interfaces/keybindings';

@Component({ name: 'spl-keybinding-editor' })
export default class KeybindingEditorComponent extends Vue {
    public actions: KeybindingDescriptor[] = [];
    public bindings: ActionKeybinding[] = [];

    created() {
        this.actions = cloneDeep(
            this.$store.state.splitterino.keybindings.actions || []);
        this.bindings = cloneDeep(
            this.$store.state.splitterino.keybindings.bindings || []);
    }

    clearInput(event: MouseEvent, index: number) {
        event.preventDefault();
        event.stopPropagation();

        this.$set(this.bindings[index], 'accelerator', null);
        this.$set(this.bindings[index], 'keys', []);
    }

    addNew() {
        this.bindings.push({
            action: null,
            accelerator: '',
            keys: [],
            global: true,
        });
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.keybinding-editor {
    .binding {
        display: flex;
        padding: 0 25px;
        margin: 15px 0;

        .action-select {
            flex: 1 1 auto;
            margin-right: 10px;
        }

        .keybinding-input {
            flex: 1 1 auto;
        }

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

    .add-button {
        margin: 0 auto;
        display: block;
    }
}
</style>
