<template>
    <div class="checkbox" :class="{checked: internalValue}">
        <input
            type="checkbox"
            :id="'spl-checkbox-' + _uid"
            :value="internalValue"
            @change="inputChange($event)"
        />
        <label
            tabindex="0"
            :for="'spl-checkbox-' + _uid"
            @keypress="labelKeyPress($event)"
        >{{ label }}</label>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Model, Prop } from 'vue-property-decorator';

@Component({ name: 'spl-checkbox' })
export default class CheckboxComponent extends Vue {
    @Model('change')
    public value: boolean;

    @Prop(String)
    public label: string;

    public internalValue: boolean = false;

    public inputChange(event) {
        this.internalValue = event.target.checked;
        this.$emit('change', this.internalValue);
    }

    public labelKeyPress(event: KeyboardEvent) {
        switch (event.key) {
            case ' ':
            case 'Enter':
                this.internalValue = !this.internalValue;
                event.preventDefault();
                event.stopPropagation();
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.checkbox {
    position: relative;
    min-width: 35px;
    padding: 0 8px;

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

