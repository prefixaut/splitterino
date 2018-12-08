<template>
  <button
    :autofocus="autofocus"
    :disabled="disabled"
    :type="type"
    :class="[ { outline: outline, 'spl-button': true }, 'set-' + color]"
    role="button"
    tabindex="1"
  >
    <slot/>
  </button>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component
export default class ButtonComponent extends Vue {
  @Prop({
    type: Boolean,
    default: false
  })
  public autofocus: boolean;

  @Prop(String)
  public color: string;

  @Prop({
    type: Boolean,
    default: false
  })
  public disabled: boolean;

  @Prop({
    type: String,
    validator: val =>
      val == null || ["button", "reset", "submit"].includes(val),
    default: () => "button"
  })
  public type: string;

  @Prop({
    type: Boolean,
    default: false
  })
  public outline: boolean;

  @Watch("color")
  onColorChanged(val: string) {
    if (val == null) {
      this.color = "primary";
    }
  }
}
</script>

<style lang="scss" scoped>
.spl-button {
    width: auto;
    display: inline-block;
    position: relative;
    padding: 8px 10px;
    border: 2px solid transparent;
    background: none;
    margin: 10px;
    text-decoration: none;
    transition: 200ms;
    cursor: pointer;

    @each $set in map-keys($spl-sets) {
        &.color-#{$set} {
            color: spl-set-get($set, 'text');
            background-color: spl-set-get($set, 'base');
            border-color: spl-set-get($set, 'base');

            &.outline {
                background-color: $spl-color-very-dark-gray;
            }

            &:hover,
            &:focus {
                text-shadow: 1px 2px 4px rgba($spl-color-off-black, 50%);
                box-shadow:  0 0 6px 3px rgba(spl-set-get($set, 'base'), 50%);
            }
        }
    }
}
</style>

