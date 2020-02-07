<template>
    <div class="checkbox" :class="{checked: internalValue}">
        <input
            :id="'spl-checkbox-' + _uid"
            :value="internalValue"
            type="checkbox"
            @change="inputChange($event)"
        >
        <label
            tabindex="0"
            :for="'spl-checkbox-' + _uid"
            @keypress="labelKeyPress($event)"
        >{{ label }}</label>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Model, Prop, Watch } from 'vue-property-decorator';

import { convertToBoolean } from '../utils/converters';

@Component({ name: 'spl-checkbox' })
export default class CheckboxComponent extends Vue {
    @Model('change')
    public value: boolean;

    @Prop(String)
    public label: string;

    public internalValue: boolean = false;

    public inputChange(event) {
        this.internalValue = convertToBoolean(event.target.checked);
        this.$emit('change', this.internalValue);
    }

    public labelKeyPress(event: KeyboardEvent) {
        switch (event.key) {
            case ' ':
            case 'Enter':
                this.internalValue = !this.internalValue;
                event.preventDefault();
                event.stopPropagation();
                this.$emit('change', this.internalValue);
        }
    }

    @Watch('value', { immediate: true })
    onValueChange(newValue) {
        this.internalValue = convertToBoolean(newValue);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.checkbox {
    position: relative;
    min-width: 35px;
    padding: 0 8px;
    display: inline-block;

    > input {
        appearance: none;
        display: none;
    }

    label {
        text-align: center;
        display: block;
        padding-top: 17px;
        cursor: pointer;

        &::before {
            content: '';
            position: absolute;
            border: 1px solid $spl-color-off-black;
            background: $spl-color-off-black;
            color: $spl-color-off-white;
            padding: 7px 7px;
            transition: 200ms;
            top: 0;
            left: 50%;
            margin-left: -8px;
        }

        &:focus {
            outline: none;

            &::before {
                border: 1px solid $spl-color-primary;
            }
        }
    }

    &.checked {
        label::before {
            background: $spl-color-primary;
        }
    }
}
</style>

