<template>
    <div class="text-input">
        <label v-if="label != null && label.trim() !== ''">{{ label }}</label>
        <input
            type="text"
            tabindex="0"
            :value="internalValue"
            :placeholder="placeholder"
            :minlength="internalMinlength"
            :maxlength="internalMaxlength"
            :required="internalRequired"
            :disabled="internalDisabled"
            :class="{ outline: internalOutline }"
            @input="onValueInputChange($event)"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Model, Prop, Watch } from 'vue-property-decorator';

import { convertToBoolean } from '../utils/convert-to-boolean';
import { convertToNumber } from '../utils/convert-to-number';

@Component
export default class TextInputComponent extends Vue {
    @Model('change', String)
    public value: string;
    public internalValue: string = '';

    @Prop(String)
    public placeholder: string;

    @Prop({
        type: [Boolean, String],
        default: false,
    })
    public disabled: boolean;
    public internalDisabled: boolean = false;

    @Prop({
        type: [Boolean, String],
        default: true,
    })
    public outline: boolean;
    public internalOutline: boolean = true;

    @Prop([Number, String])
    public minlength: number;
    public internalMinlength: number;

    @Prop([Number, String])
    public maxlength: number;
    public internalMaxlength: number;

    @Prop({
        type: [Boolean, String],
        default: false
    })
    public required: boolean;
    public internalRequired: boolean = false;

    @Prop(String)
    public label: string;

    onValueInputChange(event: any) {
        const value = event.target.value;
        if (value !== this.internalValue) {
            this.internalValue = value;
            this.$emit('change', this.internalValue);
        }
    }

    @Watch('value', { immediate: true })
    onValuePropChange(value) {
        this.internalValue = value;
    }

    @Watch('disabled', { immediate: true })
    onDisabledPropChange(value) {
        this.internalDisabled = convertToBoolean(value);
    }

    @Watch('outline', { immediate: true })
    onOutlinePropChange(value) {
        this.internalOutline = convertToBoolean(value);
    }

    @Watch('required', { immediate: true })
    onRequiredPropChange(value) {
        this.internalRequired = convertToBoolean(value);
    }

    @Watch('minlength', { immediate: true })
    onMinlengthPropChange(value) {
        this.internalMinlength = convertToNumber(value);
    }

    @Watch('maxlength', { immediate: true })
    onMaxlengthPropChange(value) {
        this.internalMaxlength = convertToNumber(value);
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.text-input {
    > input {
        border: 1px solid $spl-color-very-dark-gray;
        background: $spl-color-very-dark-gray;
        color: $spl-color-off-white;
        padding: 3px 8px;
        transition: 200ms;

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
