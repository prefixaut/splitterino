<template>
    <div class="time-input" :class="{ active: active }">
        <label v-if="label != null && label.trim() !== ''">{{ label }}</label>

        <div class="content-wrapper">
            <number-input
                class="part hour"
                :value="hour"
                :min="0"
                :max="99999"
                @change="onChange($event, 'hour')"
                @focus="activate"
                @blur="deactivate">
            </number-input>

            <span class="colon">:</span>

            <number-input
                class="part"
                :value="minute"
                :min="0"
                :max="59"
                @change="onChange($event, 'minute')"
                @focus="activate"
                @blur="deactivate">
            </number-input>

            <span class="colon">:</span>

            <number-input
                class="part"
                :value="second"
                :min="0"
                :max="59"
                @change="onChange($event, 'second')"
                @focus="activate"
                @blur="deactivate">
            </number-input>

            <span class="dot">.</span>

            <number-input
                class="part"
                :value="milli"
                :min="0"
                :max="999"
                @change="onChange($event, 'milli')"
                @focus="activate"
                @blur="deactivate">
            </number-input>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        value: Number,
        label: String,
    },
    created() {
        this.applyValue(this.value | 0);
    },
    data() {
        return {
            active: false,
            hour: 0,
            minute: 0,
            second: 0,
            milli: 0
        };
    },
    methods: {
        activate() {
            this.activate = true;
            this.$emit('focus');
        },
        deactivate() {
            this.activate = false;
            this.$emit('blur');
        },
        onChange(value, part) {
            this[part] = value;
            let n = this.milli;
            n += this.second * 1000;
            n += this.minute * 60000;
            n += this.hour * 3600000;

            this.$emit('change', n);
        },
        applyValue(value) {
            // Parse an timing object from the number
            this.hour = (value / 3600000) | 0;
            this.minute = ((value / 60000) | 0) % 60;
            this.second = ((value / 1000) | 0) % 60;
            this.milli = value % 1000;
        }
    },
    watch: {
        value: function(value, old) {
            value = value | 0;
            if ((value === old) | 0) {
                return;
            }
            this.applyValue(value);
        }
    }
};
</script>

<style lang="scss">
@import '../styles/config';

.time-input {
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
                    padding: 0;
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
