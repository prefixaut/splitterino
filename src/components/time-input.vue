<template>
  <div class="time-input" :class="{ active: active }">
    <label v-if="label != null && label.trim() !== ''">{{ label }}</label>

    <div class="content-wrapper">
      <spl-number-input
        class="part hour"
        :value="hour"
        :min="0"
        :max="99999"
        @change="onChange($event, 'hour')"
        @focus="activate"
        @blur="deactivate"
      />

      <span class="colon">:</span>

      <spl-number-input
        class="part"
        :value="minute"
        :min="0"
        :max="59"
        @change="onChange($event, 'minute')"
        @focus="activate"
        @blur="deactivate"
      />

      <span class="colon">:</span>

      <spl-number-input
        class="part"
        :value="second"
        :min="0"
        :max="59"
        @change="onChange($event, 'second')"
        @focus="activate"
        @blur="deactivate"
      />

      <span class="dot">.</span>

      <spl-number-input
        class="part"
        :value="milli"
        :min="0"
        :max="999"
        @change="onChange($event, 'milli')"
        @focus="activate"
        @blur="deactivate"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Model } from 'vue-property-decorator';

@Component
export default class TimeInputComponent extends Vue {
    @Model('change', { type: Number })
    public value: number;

    @Prop({ type: String })
    public label: string;

    public active = false;
    public hour = 0;
    public minute = 0;
    public second = 0;
    public milli = 0;

    created() {
        this.applyValue(this.value | 0);
    }

    activate() {
        this.active = true;
        this.$emit('focus');
    }

    deactivate() {
        this.active = false;
        this.$emit('blur');
    }

    onChange(value, part) {
        if (this[part] !== value) {
            this[part] = value;
            let n = this.milli;
            n += this.second * 1000;
            n += this.minute * 60000;
            n += this.hour * 3600000;

            this.$emit('change', n);
        }
    }

    applyValue(value) {
        // Parse an timing object from the number
        this.hour = (value / 3600000) | 0;
        this.minute = ((value / 60000) | 0) % 60;
        this.second = ((value / 1000) | 0) % 60;
        this.milli = value % 1000;
    }

    @Watch('value')
    onValuePropChange(value, old) {
        value = value | 0;
        if (value === (old | 0)) {
            return;
        }
        this.applyValue(value);
    }
}
</script>

<style lang="scss">
@import "../styles/config";

.time-input {
  background: $spl-color-off-black;

  label {
    display: block;
    font-size: 12px;
  }

  > .content-wrapper {
    width: 100%;
    display: flex;

    .part {
      padding: 0;
      width: auto;
      max-width: 40px;
      position: relative;

      &.number-input {
        .input-wrapper {
          padding: 0;
        }

        input {
          text-align: center;
        }
      }
    }

    .colon {
      padding: 0 3px;
      flex: 0 0 auto;
      align-self: center;
    }
  }
}
</style>
