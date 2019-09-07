<template>
    <spl-text-input
        class="aevum-format-input"
        :class="{'is-valid': valid, 'is-invalid': !valid }"
        :value="internalValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :outline="outline"
        :required="required"
        :label="label"
        @change="triggerChange($event)"
        @blur="triggerBlur()"
        @focus="triggerFocus()"
    />
</template>

<script lang="ts">
import { Vue, Component, Model, Prop, Watch } from 'vue-property-decorator';
import { Aevum } from 'aevum';

@Component({ name: 'spl-aevum-format-input' })
export default class AevumFormatInputComponent extends Vue {
    @Model('change', String)
    public value: string;
    public internalValue: string = '';

    @Prop(String)
    public placeholder: string;

    @Prop({ type: Boolean, default: false })
    public disabled: boolean;

    @Prop({ type: Boolean, default: true })
    public outline: boolean;

    @Prop({ type: Boolean, default: false })
    public required: boolean;

    @Prop(String)
    public label: string;

    public valid = true;

    triggerBlur() {
        this.$emit('blur');
    }

    triggerFocus() {
        this.$emit('focus');
    }

    triggerChange(newValue) {
        try {
            // tslint:disable-next-line no-unused-expression
            new Aevum(newValue);
            this.internalValue = newValue;
            this.$emit('change', newValue);
            this.valid = true;
        } catch (e) {
            this.valid = false;
        }
    }

    @Watch('value', { immediate: true })
    onValuePropChange(value) {
        this.internalValue = value;
    }
}
</script>

<style lang="scss">
@import '../styles/core.scss';

.aevum-format-input {
    &.is-valid input:focus {
        border-color: $spl-color-success !important;
        outline-color: $spl-color-success !important;
    }

    &.is-invalid input {
        border-color: $spl-color-danger !important;
        outline-color: $spl-color-danger !important;
    }
}
</style>
