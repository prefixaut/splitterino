<template>
    <div class="keybinding-input">
        <div
            contenteditable
            ref="content"
            class="content"
            tabindex="0"
            v-html="internalValue.accelerator"
            @keydown="handleKey($event)"
        ></div>

        <spl-checkbox
            class="global"
            label="Global"
            :value="internalValue.global"
            @change="globalChange($event)"
        />

        <button
            class="clear"
            tabindex="0"
            title="clear combination"
            @click="clearInput($event)"
        >
            <fa-icon icon="times" />
        </button>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { Keybinding } from '../common/interfaces/keybindings';

@Component({ name: 'spl-keybinding-input' })
export default class KeybingingInputComponent extends Vue {
    @Prop()
    public value: Keybinding;

    public internalValue: Keybinding = { accelerator: null };

    handleKey(event: KeyboardEvent) {
        // Ignore the Tab-Key
        if (event.key === 'Tab') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        const parts = [];
        if (event.ctrlKey) {
            parts.push('Ctrl');
        }
        if (event.shiftKey) {
            parts.push('Shift');
        }
        if (event.altKey) {
            parts.push('Alt');
        }

        switch (event.key) {
            case 'Control':
            case 'Alt':
            case 'Shift':
                break;
            default:
                parts.push(event.key.toLocaleUpperCase());
        }

        this.$set(this.internalValue, 'accelerator', parts.join('+'));
        this.$emit('change', this.internalValue);
    }

    globalChange(newValue: boolean) {
        this.$set(this.internalValue, 'global', newValue);
        this.$emit('change', this.internalValue);
    }

    clearInput(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.$set(this.internalValue, 'accelerator', null);
        this.$emit('change', this.internalValue);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.keybinding-input {
    display: flex;

    .content {
        flex: 1 1 auto;

        border: 1px solid $spl-color-off-black;
        background: $spl-color-off-black;
        color: $spl-color-off-white;
        padding: 8px 13px;
        width: 100%;
        transition: 200ms;

        &.outline {
            border-color: $spl-color-dark-gray;
        }

        &:focus {
            outline: none;
            border-color: $spl-color-primary;
        }
    }

    .global {
        flex: 0 0 auto;
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
</style>

