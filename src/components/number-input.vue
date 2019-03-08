<template>
    <div class="number-input">
        <label v-if="label != null && label.trim() !== ''">{{ label }}</label>

        <input
            type="number"
            ref="input"
            tabindex="0"
            :value="internalValue"
            :disabled="disabled"
            :min="min"
            :max="max"
            @input="onValueInputChange($event)"
            @keydown.down.prevent.stop="down()"
            @keydown.up.prevent.stop="up()"
        />
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model, Watch } from 'vue-property-decorator';

import { convertToBoolean } from '../utils/convert-to-boolean';

@Component
export default class NumberInputComponent extends Vue {
    @Model('change', { type: [Number, String] })
    public value: string | number;

    @Prop({ type: Number })
    public min: number;

    @Prop({ type: Number })
    public max: number;

    @Prop({ type: Boolean })
    public decimals: boolean;

    @Prop({ type: Boolean })
    public disabled: boolean;

    @Prop({ type: String })
    public label: string;

    /**
     * Internal value to prevent Prop-Mutations
     */
    public internalValue = 0;

    /**
     * Internal Disabled-State to prevent Prop-Mutations
     */
    public internalDisabled: boolean = false;

    /**
     * If the user should be able to enter decimal values
     */
    public internalDecimal: boolean = false;

    /**
     * If increasing the value is currently allowed/possible
     */
    public enableUp = true;

    /**
     * If decreasing the value is currently allowed/possible
     */
    public enableDown = true;

    public readonly flatRegex = /^[+-]?([\d])*$/;
    public readonly decimalRegex = /^[+-]?([\d])*(\.[\d])?$/;

    onValueInputChange(event: any) {
        const value = event.target.value;
        if (value !== this.internalValue) {
            this.internalValue = value;
            this.$emit('change', this.internalValue);
        }
    }

    up() {
        if (!this.enableUp) {
            return;
        }
        (this.$refs.input as any).focus();
        this.internalValue++;
        this.updateContent();
    }

    down() {
        if (!this.enableDown) {
            return;
        }
        (this.$refs.input as any).focus();
        this.internalValue--;
        this.updateContent();
    }

    updateContent() {
        let changed = false;

        const str = `${this.internalValue}`;
        if (typeof this.internalValue === 'string') {
            if (this.decimals && !this.decimalRegex.test(str)) {
                this.internalValue = parseFloat(str);
                changed = true;
            } else if (!this.decimals && !this.flatRegex.test(str)) {
                this.internalValue = parseInt(str, 10);
                changed = true;
            } else {
                this.internalValue = 0;
            }
        }

        if (this.max != null && this.internalValue > this.max) {
            this.internalValue = this.max;
            this.enableUp = false;
            changed = true;
        } else {
            this.enableUp = true;
        }

        if (this.min != null && this.internalValue < this.min) {
            this.internalValue = this.min;
            this.enableDown = false;
            changed = true;
        } else {
            this.enableDown = true;
        }

        if (changed) {
            this.$emit('change', this.internalValue);
        }
    }

    @Watch('value', { immediate: true })
    onValuePropChange(val, old) {
        if (val === old) {
            return;
        }
        this.internalValue = val;
        this.updateContent();
    }

    @Watch('disabled', { immediate: true })
    onDisabledPropChange(value) {
        this.internalDisabled = convertToBoolean(value);
    }

    @Watch('min', { immediate: true })
    onMinPropChange(val, old) {
        if (typeof this.max === 'number' && val > this.max) {
            throw new RangeError(
                'The minimal amount cannot be higher than the maximal!'
            );
        }
        if (val === old) {
            return;
        }
        this.updateContent();
    }

    @Watch('max', { immediate: true })
    onMaxPropChange(val, old) {
        if (typeof this.min === 'number' && val < this.min) {
            throw new RangeError(
                'The maximal amount cannot be lower than the minimal!'
            );
        }
        if (val === old) {
            return;
        }
        this.updateContent();
    }
}
</script>

<style lang="scss" scoped>
@import "../styles/config";

.number-input {
  width: 100%;
  box-sizing: content-box;

  label {
    display: block;
    flex: none;
    font-size: 10px;
  }

  input {
    width: 100%;
    border: 1px solid $spl-color-off-black;
    background: $spl-color-off-black;
    color: $spl-color-off-white;
    padding: 3px 3px;
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
