<template>
    <div class="time-input" :class="{ active: active }">
        <label v-if="label != null && label.trim() !== ''">{{ label }}</label>

        <div class="content-wrapper">
            <spl-number-input
                class="part hour"
                :value="time.hours"
                :min="0"
                :max="99999"
                @change="onChange($event, 'hours')"
                @focus="activate"
                @blur="deactivate"
            />

            <span class="colon">:</span>

            <spl-number-input
                class="part"
                :value="time.minutes"
                :min="0"
                :max="59"
                @change="onChange($event, 'minutes')"
                @focus="activate"
                @blur="deactivate"
            />

            <span class="colon">:</span>

            <spl-number-input
                class="part"
                :value="time.seconds"
                :min="0"
                :max="59"
                @change="onChange($event, 'seconds')"
                @focus="activate"
                @blur="deactivate"
            />

            <span class="dot">.</span>

            <spl-number-input
                class="part"
                :value="time.milliseconds"
                :min="0"
                :max="999"
                @change="onChange($event, 'milliseconds')"
                @focus="activate"
                @blur="deactivate"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Model } from 'vue-property-decorator';
import { Time, toTime } from 'aevum';

import { timeToTimestamp } from '../utils/time';

@Component({ name: 'spl-time-input' })
export default class TimeInputComponent extends Vue {
    @Model('change', { type: [Number, Object] })
    public value: number | Time;

    @Prop({ type: String })
    public label: string;

    public active = false;
    public time: Time = {
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
    };

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
        if (this.time[part] !== value) {
            this.$set(this.time, part, value);
            this.$emit('change', timeToTimestamp(this.time));
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
        } else {
            time = toTime(0);
        }

        // Parse an timing object from the number
        this.time = time;
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
