<template>
    <div class="keybinding-input">
        <div
            ref="content"
            contenteditable
            class="content"
            tabindex="0"
            @keydown="handleKey($event)"
            @keyup="handleKeyUp($event)"
            v-html="displayString"
        />

        <spl-checkbox
            class="global"
            label="Global"
            :value="internalValue.global"
            @change="globalChange($event)"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import { Keybinding } from '../../models/keybindings';
import { keyToDisplayString, keyToAcceleratorString } from '../../utils/keys';

@Component({ name: 'spl-keybinding-input' })
export default class KeybingingInputComponent extends Vue {
    @Prop()
    public value: Keybinding;

    public internalValue: Keybinding = {
        accelerator: null,
        global: true,
        keys: [],
    };

    public altRightPressed: boolean = false;
    public acceleratorString: string = '';

    public get displayString(): string {
        const mapped = this.internalValue.keys
            .map(keyToDisplayString)
            .filter(str => str != null && str.trim().length > 0);

        return mapped.join('+');
    }

    handleKey(event: KeyboardEvent) {
        // Ignore the Tab-Key
        if (event.key === 'Tab') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        const keys = [];

        if ((
            event.key === 'Control' ||
            event.key === 'Alt' ||
            event.key === 'Shift'
        )) {
            return;
        }

        if (event.ctrlKey) {
            keys.push('Ctrl');
        }

        if (event.shiftKey) {
            keys.push('Shift');
        }

        if (event.altKey) {
            keys.push('Alt');
        }

        if (event.metaKey) {
            keys.push('Super');
        }

        if (this.altRightPressed) {
            keys.push('AltGr');
        }

        if (event.code === 'AltRight') {
            this.altRightPressed = true;

            return;
        }

        switch (event.key) {
            case 'Shift':
            case 'Alt':
            case 'Super':
            case 'Ctrl':
            case 'AltGr':
                break;
            default:
                keys.push(event.key);
        }

        this.$set(this.internalValue, 'keys', keys);
        this.$set(this.internalValue, 'accelerator', keys.map(keyToAcceleratorString).join('+'));
        this.$emit('change', this.internalValue);
    }

    handleKeyUp(event: KeyboardEvent) {
        if (event.code === 'AltRight') {
            this.altRightPressed = false;
        }
    }

    globalChange(newValue: boolean) {
        this.$set(this.internalValue, 'global', newValue);
        this.$emit('change', this.internalValue);
    }

    @Watch('value', { immediate: true, deep: true })
    onValuePropChange(newValue: any) {
        this.internalValue = newValue;
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


}
</style>

