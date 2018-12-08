<template>
  <div class="number-input" :class="{active: active}">
    <label v-if="label != null && label.trim() !== ''">{{ label }}</label>

    <div class="content-wrapper" @mousewheel="wheelUpdate">
      <div class="input-wrapper">
        <input
          type="number"
          ref="input"
          tabindex="0"
          v-show="active"
          v-model="content"
          @focus="activate()"
          @blur="deactivate()"
          @keydown.down.prevent.stop="down"
          @keydown.up.prevent.stop="up"
        >
        <span class="visible-content" @click="activate(true)" v-show="!active">{{ content }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({
  created() {
    this.content = this.value | 0;
    this.updateContent();
  }
})
export default class NumberInputComponent extends Vue {
  @Prop({ type: Number, default: 0 })
  public value: string | number;

  @Prop({ type: Number })
  public min: number;

  @Prop({ type: Number })
  public max: number;

  @Prop({ type: String })
  public label: string;

  // Internal value to prevent Mutation
  public content = 0;

  // Flags for css-classes
  public enableUp = true;
  public enableDown = true;
  public active = false;

  @Watch("value")
  onValueChanged(val, old) {
    if (val === old) {
      return;
    }
    this.content = val;
    this.updateContent();
  }

  @Watch("min")
  onMinChanged(val, old) {
    if (typeof this.max === "number" && val > this.max) {
      throw new RangeError(
        "The minimal amount cannot be higher than the maximal!"
      );
    }
    if (val === old) {
      return;
    }
    this.updateContent();
  }

  @Watch("max")
  onMaxChanged(val, old) {
    if (typeof this.min === "number" && val < this.min) {
      throw new RangeError(
        "The maximal amount cannot be lower than the minimal!"
      );
    }
    if (val === old) {
      return;
    }
    this.updateContent();
  }

  activate(doFocus) {
    if (this.active) {
      return;
    }
    this.active = true;
    if (doFocus) {
      this.$nextTick(function() {
        (this.$refs.input as any).focus();
      });
    }
    this.$emit("focus", null);
  }

  deactivate() {
    this.active = false;
    this.$emit("blur", null);
    this.updateContent();
  }

  up() {
    if (!this.enableUp) {
      return;
    }
    (this.$refs.input as any).focus();
    this.content++;
    this.updateContent();
  }

  down() {
    if (!this.enableDown) {
      return;
    }
    (this.$refs.input as any).focus();
    this.content--;
    this.updateContent();
  }

  wheelUpdate(event) {
    if (!this.active) {
      return;
    }

    if (event.deltaY > 0) {
      this.up();
    } else if (event.deltaY < 0) {
      this.down();
    }

    event.preventDefault();
  }

  updateContent() {
    if (this.max != null && this.content >= this.max) {
      this.content = this.max;
      this.enableUp = false;
    } else {
      this.enableUp = true;
    }

    if (this.min != null && this.content <= this.min) {
      this.content = this.min;
      this.enableDown = false;
    } else {
      this.enableDown = true;
    }
    this.content = this.content | 0;

    this.$emit("change", this.content);
  }
}
</script>

<style lang="scss">
@import "../styles/config";

.number-input {
  width: 100%;
  padding: 5px 10px;
  box-sizing: content-box;

  label {
    display: block;
    flex: none;
    font-size: 10px;
  }

  .content-wrapper {
    width: 100%;
    height: auto;
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
  }

  .input-wrapper {
    width: auto;
    flex: 1 1 auto;
    height: 100%;
    padding: 0 5px;

    input {
      width: 100%;
      font: normal normal 300 1rem/1 "Roboto", sans-serif;
      text-align: left;
      background: none;
      border: 0;
      height: 100%;
      color: #efefef;
      padding: 5px;

      &:hover,
      &:focus {
        background: $color-dark-gray;
      }

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      &:focus {
        // outline: none;
      }
    }
  }

  .spinner-wrapper {
    display: block;
    width: 20px;
    flex: 0 0 auto;
    height: 100%;
    position: relative;

    .spinner {
      width: 100%;
      height: 50%;
      position: absolute;
      cursor: pointer;
      right: 0;

      &.disabled {
        color: $color-light-gray;
      }

      .icon {
        position: absolute;
        width: 100%;
        height: 100%;
        margin-top: -1px;
        margin-left: 1px;
        font-size: 18px;
      }

      &.up {
        top: 0;
      }

      &.down {
        bottom: 0;
      }
    }
  }
}
</style>
