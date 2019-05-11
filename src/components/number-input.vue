<template>
    <div class="number-input">
        <label v-if="label != null && label.trim() !== ''">{{ label }}</label>
        <spl-text-input
            :value="inputValue"
            @change="onValueChange($event)"
            @blur="defaultValueOnBlur($event)"
            ref="input"
            tabindex="1"
        ></spl-text-input>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model, Watch, Constructor } from 'vue-property-decorator';
import { clamp } from 'lodash';

import { convertToBoolean } from '../utils/converters';
import TextInputComponent from './text-input.vue';

@Component({ name: 'spl-number-input' })
export default class NumberInputComponent extends Vue {
    @Model('change', { type: [Number, String] })
    public value: number | string;

    @Prop({ type: Number })
    public min: number;

    @Prop({ type: Number })
    public max: number;

    @Prop({
        type: Boolean,
        default: false
    })
    public decimals: boolean;

    @Prop({
        type: Boolean,
        default: false
    })
    public disabled: boolean;

    @Prop({ type: String })
    public label: string;

    /**
     * Internal value to prevent Prop-Mutations
     */
    public internalValue = 0;
    /**
     * Value for underlying input component.
     * Used for verification and force updating input
     */
    public inputValue = '';

    /**
     * Flag for when component is mounted.
     * Prevents watchers to check for validity multiple times
     * on component initialization
     */
    private isMounted = false;

    public mounted() {
        this.isMounted = true;
        // If value was given validate it
        // Otherwise set default value
        if (this.value) {
            this.updateContent(this.value);
        } else {
            this.setDefaultValue();
        }
    }

    /**
     * Set input value to changed value
     */
    public onValueChange(value: string) {
        this.inputValue = value;
    }

    /**
     * Verify input on blur
     */
    public defaultValueOnBlur(event: any) {
        this.updateContent(this.inputValue);
        this.$emit('blur', event);
    }

    /**
     * Emit change event for internal value
     */
    private emitNewValue() {
        this.$emit('change', this.internalValue);
    }

    /**
     * Set default value for input
     */
    private setDefaultValue() {
        // Set to min value if min is given and greater than 0. Else set to 0
        this.internalValue = this.min && this.min > 0 ? this.min : 0;
        this.inputValue = this.internalValue.toString();
    }

    /**
     * Check value for validity
     */
    private checkValue(newValue: number) {
        // If not a number or infinite, set to last known value
        if (isNaN(newValue) || !isFinite(newValue)) {
            this.inputValue = '' + this.internalValue;

            return;
        }

        // Truncate if no deccimals allowed
        if (!this.decimals) {
            newValue = Math.trunc(newValue);
        }

        // Clamp to avoid getting into 64 bit range
        newValue = clamp(newValue, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

        // Check for max and min ranges
        if (this.max && newValue > this.max) {
            newValue = this.max;
        } else if (this.min && newValue < this.min) {
            newValue = this.min;
        }

        // Flag if value has changed
        const hasChanged = this.internalValue !== newValue;

        // Update internal and input values
        this.internalValue = newValue;
        this.inputValue = '' + newValue;

        // Emit event if value has changed
        if (hasChanged) {
            this.emitNewValue();
        }
    }

    /**
     * Verifies and updates content for number input
     */
    private updateContent(value?: number | string) {
        // If no value was given, reset to default
        if (value == null) {
            value = this.internalValue;
        }

        let newValue: number;

        // Check if string and try to parse to number
        if (typeof value === 'string') {
            value = value.trim().replace(',', '.');
            this.inputValue = value;

            // Check for decimal mode and use appropriate parse function
            newValue = Number(value);
        } else {
            this.inputValue = value.toString();
            // Just set newValue to value to work with later
            newValue = value;
        }

        // Execute change on next tick to force update of input if needed
        this.$nextTick(() => {
            this.checkValue(newValue);
        });
    }

    /**
     * Validator for max property
     */
    private validateMaxProperty(val: number): boolean {
        if (val == null) {
            return true;
        }

        if (this.min && this.max < this.min) {
            throw new RangeError('Maximum has to be greater than minimum!');

            return false;
        }

        return true;
    }

    /**
     * Validator for min property
     */
    private validateMinProperty(val: number): boolean {
        if (val == null) {
            return true;
        }

        if (this.max && this.min > this.max) {
            throw new RangeError('Minimum has to be less than maximum!');

            return false;
        }

        return true;
    }

    /**
     * Watch for changes of value property and verify
     */
    @Watch('value', { immediate: true })
    onValuePropertyChange(val, old) {
        if (val === this.internalValue) {
            return;
        }

        if (this.isMounted) {
            this.updateContent(val);
        }
    }

    /**
     * Watch for changes of max property and verify
     */
    @Watch('max', { immediate: true })
    onMaxPropertyChange(val, old) {
        if (val === old) {
            return;
        }

        if (this.isMounted && this.validateMaxProperty(val)) {
            this.updateContent();
        }
    }

    /**
     * Watch for changes of min property and verify
     */
    @Watch('min', { immediate: true })
    onMinPropertyChange(val, old) {
        if (val === old) {
            return;
        }

        if (this.isMounted && this.validateMinProperty(val)) {
            this.updateContent();
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/config';

.number-input {
    width: 100%;
    box-sizing: content-box;

    label {
        display: block;
        flex: none;
        font-size: 10px;
    }

    .content {
        width: 100%;
        border: 1px solid $spl-color-off-black;
        background: $spl-color-off-black;
        color: $spl-color-off-white;
        padding: 6px 13px;
        transition: 200ms;

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        &.outline {
            border-color: $spl-color-dark-gray;
        }

        &:focus {
            outline: none;
            border-color: $spl-color-primary;
        }
    }
}
</style>
