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
import { Time, toTime } from 'aevum';

@Component
export default class TimeInputComponent extends Vue {
    @Model('change', { type: [Number, Object] })
    public value: number | Time;

    @Prop({ type: String })
    public label: string;

    public active = false;
    public hour = 0;
    public minute = 0;
    public second = 0;
    public milli = 0;

    created() {
        this.applyValue(this.value || 0);
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

            const time: Time = {
                positive: true,
                hours: this.hour,
                minutes: this.minute,
                seconds: this.second,
                milliseconds: this.milli,
            };
            this.$emit('change', time);
        }
    }

    applyValue(value) {
        if (value == null) {
            value = 0;
        }
        let time: Time;
        if (typeof value === 'object') {
            time = value;
        } else if (typeof value === 'number') {
            time = toTime(value);
        }

        // Parse an timing object from the number
        this.hour = time.hours;
        this.minute = time.minutes;
        this.second = time.seconds;
        this.milli = time.milliseconds;
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
@import '../styles/config';

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
            width: auto;
            flex: 1 1 25%;
            position: relative;
        }

        >>> .part > input {
            padding: 8px 8px;
        }

        .colon {
            padding: 0 3px;
            flex: 0 0 auto;
            align-self: center;
        }

        .dot {
            padding: 0 3px;
            flex: 0 0 auto;
            align-self: center;
        }
    }
}
</style>
