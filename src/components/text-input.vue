<template>
    <div class="text-input">
        <label v-if="label != null && label.trim() !== ''">{{ label }}</label>
        <input
            type="text"
            tabindex="0"
            :value="internalValue"
            :placeholder="placeholder"
            :minlength="minlength"
            :maxlength="maxlength"
            :required="required"
            :disabled="disabled"
            :class="{ outline: outline }"
            @input="onValueInputChange($event)"
            @blur="$listeners.blur"
        />
    </div>
</template>

<script lang="ts">
import { Vue, Component, Model, Prop, Watch } from 'vue-property-decorator';

import { convertToBoolean,convertToNumber } from '../utils/converters';

@Component
export default class TextInputComponent extends Vue {
    @Model('change', String)
    public value: string;
    public internalValue: string = '';

    @Prop(String)
    public placeholder: string;

    @Prop({ type: Boolean, default: false })
    public disabled: boolean;

    @Prop({ type: Boolean, default: true })
    public outline: boolean;

    @Prop({ type: Number, default: null })
    public minlength: number;

    @Prop({ type: Number, default: null })
    public maxlength: number;

    @Prop({ type: Boolean, default: false })
    public required: boolean;

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
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.text-input {
    > input {
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
}
</style>
