<template>
  <button
    role="button"
    tabindex="0"
    :autofocus="autofocus"
    :disabled="disabled"
    :type="type"
    :class="[ { outline: outline }, 'spl-button', 'theme-' + internalTheme]"
    v-on="$listeners"
  >
    <slot/>
  </button>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

@Component
export default class ButtonComponent extends Vue {
  @Prop({
    type: Boolean,
    default: false
  })
  public autofocus: boolean;

  @Prop(String)
  public theme: string;

  @Prop({
    type: Boolean,
    default: false
  })
  public disabled: boolean;

  @Prop({
    type: String,
    validator: val =>
      val == null || ['button', 'reset', 'submit'].includes(val),
    default: () => 'button'
  })
  public type: string;

  @Prop({
    type: Boolean,
    default: false
  })
  public outline: boolean;

  public internalTheme: string;

  @Watch('theme', { immediate: true })
  onColorChanged(val: string) {
    if (val == null) {
      val = 'primary';
    }
    this.internalTheme = val;
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/core';

.spl-button {
    width: auto;
    display: inline-block;
    position: relative;
    padding: 8px 10px;
    border: 2px solid transparent;
    background: none;
    text-decoration: none;
    transition: 400ms;
    cursor: pointer;

    @if (is-type($spl-themes, 'map')) {
        @each $theme in map-keys($spl-themes) {
            &.theme-#{$theme} {
                color: spl-get-theme($theme, 'text');
                background-color: spl-get-theme($theme, 'base');
                border-color: spl-get-theme($theme, 'base');
                text-shadow: 1px 2px 4px rgba($spl-color-off-black, 50%);

                &.outline {
                    background-color: $spl-color-very-dark-gray;
                }

                &:hover,
                &:focus {
                    outline: none;
                    box-shadow:  0 0 10px 1px rgba(spl-get-theme($theme, 'base'), 50%);
                }
            }
        }
    }
}
</style>

