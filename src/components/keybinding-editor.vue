<template>
    <div class="keybinding-editor">
        <p>
            Edit the Keybindings for your actions!<br>
            <small><b>Note</b>: Keybindings will not trigger when a modal is opened!</small>
        </p>
        <div class="bindings">
            <div v-for="(binding, index) of bindings" :key="index" class="binding">
                <vue-select
                    class="action-select"
                    label="label"
                    :options="actions"
                    :value="getBindingAction(index)"
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
import { cloneDeep } from 'lodash';
import { Vue, Component } from 'vue-property-decorator';

import { ActionKeybinding, KeybindingDescriptor, Keybinding, isActionKeybinding } from '../models/keybindings';
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

    getBindingAction(index: number) {
        const id = this.bindings[index].action;

        return this.actions.find(action => action.id === id);
    }

    setAction(index: number, action: KeybindingDescriptor) {
        if (action == null) {
            this.bindings[index].action = null;
        } else {
            this.bindings[index].action = action.id;
        }
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
        const filteredBindings = this.bindings.slice(0).filter(isActionKeybinding);
        if (filteredBindings.length > 0) {
            this.$store.dispatch(ACTION_SET_BINDINGS, filteredBindings).then(didSave => {
            if (didSave) {
                window.close();
            }
        });
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.keybinding-editor {
    padding: 0 20px;

    .binding {
        display: flex;
        margin: 15px 0;

        .action-select {
            flex: 1 1 50%;
            margin-right: 10px;
        }

        .keybinding-input {
            flex: 1 1 50%;
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
