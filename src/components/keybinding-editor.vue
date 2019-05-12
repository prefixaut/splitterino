<template>
    <div class="keybinding-editor">
        <div class="bindings">
            <div class="binding" v-for="(binding, index) of bindings" :key="index">
                <vue-select
                    class="action-select"
                    :options="actions"
                    :value="bindings[index].action"
                    @input="setAction(index, $event)"
                />

                <spl-keybinding-input :value="bindings[index]" @change="setOptions(index, $event)" />

                <button class="clear" tabindex="0" title="clear combination" @click="removeBinding(index, $event)">
                    <fa-icon icon="times" />
                </button>
            </div>
        </div>

        <spl-button class="add-button" theme="primary" outline @click="addNew()">
            <fa-icon icon="plus" />
            <span>&nbsp;Add new Keybinding</span>
        </spl-button>

        <spl-button
            theme="info"
            outline
            @click="saveBindings()"
        >Save Keybindings</spl-button>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { cloneDeep } from 'lodash';

import { ActionKeybinding, KeybindingDescriptor, Keybinding } from '../common/interfaces/keybindings';
import { ACTION_SET_BINDINGS } from '../store/modules/keybindings.module';

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

    setAction(index: number, action: KeybindingDescriptor) {
        this.bindings[index].action = action.id;
    }

    setOptions(index: number, options: Keybinding) {
        this.bindings[index] = {
            ...this.bindings[index],
            ...options,
        };
    }

    removeBinding(index: number, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.bindings.splice(index, 1);
    }

    addNew() {
        this.bindings.push({
            action: null,
            accelerator: '',
            keys: [],
            global: true,
        });
    }

    saveBindings() {
        this.$store.dispatch(ACTION_SET_BINDINGS, [ ...this.bindings]);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.keybinding-editor {
    .binding {
        display: flex;
        padding: 0 20px;
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
