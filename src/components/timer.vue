<template>
    <div class="timer" :class="['status-' + status]">
        <span class="content">{{ currentTime | aevum(cleanFormat) }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { TimerStatus } from '../common/timer-status';
import { GETTER_VALUE_BY_PATH } from '../store/modules/settings.module';
import { now } from '../utils/time';

const timer = namespace('splitterino/timer');

@Component({ name: 'spl-timer' })
export default class TimerComponent extends Vue {
    /**
     * If this timer should display the time in IGT Mode.
     */
    @Prop({ type: Boolean, default: false })
    public igt;

    @Prop({ type: String, default: null })
    public format: string;

    @timer.State('status')
    public status: TimerStatus;

    @timer.State('startDelay')
    public startDelay: number;

    @timer.State('startTime')
    public startTime: number;

    @timer.State('pauseTotal')
    public pauseTotal: number;

    @timer.State('igtPauseTotal')
    public igtPauseTotal: number;

    @timer.State('finishTime')
    public finishTime: number;

    /**
     * The time which is getting updated every millisecond
     * when the timer is running.
     */
    public currentTime = 0;
    /**
     * Id of the interval to cancel it when the component is getting
     * destroyed.
     */
    private intervalId = -1;

    private statusWatcher = () => {
        // noop
    };

    public created() {
        this.statusWatcher = this.$store.watch(
            state => state.splitterino.timer.status,
            () => this.statusChange()
        );

        this.calculateCurrentTime();
        this.statusChange();
    }

    public beforeDestroy() {
        this.statusWatcher();
    }

    public get cleanFormat() {
        if (this.format != null) {
            return this.format;
        } else {
            return this.$store.getters[GETTER_VALUE_BY_PATH]('splitterino.core.timer.format');
        }
    }

    public statusChange() {
        if (
            this.status === TimerStatus.RUNNING ||
            (!this.igt && this.status === TimerStatus.RUNNING_IGT_PAUSE)
        ) {
            // It's already running, no need to start another interval
            if (this.intervalId < 0) {
                this.intervalId = window.setInterval(() => {
                    this.calculateCurrentTime();
                }, 1);
            }

            return;
        }

        if (this.intervalId > -1) {
            window.clearInterval(this.intervalId);
            this.intervalId = -1;
        }

        if (this.status === TimerStatus.FINISHED) {
            this.currentTime = this.finishTime - (
                this.startTime +
                this.startDelay +
                (this.igt ? this.igtPauseTotal : this.pauseTotal)
            );
        }

        if (this.status === TimerStatus.STOPPED) {
            this.currentTime = this.startDelay * -1;
        }
    }

    private calculateCurrentTime() {
        this.currentTime = (now() - this.startTime - this.startDelay)
            - (this.igt ? this.igtPauseTotal : this.pauseTotal);
    }
}
</script>

<style lang="scss" scoped>
.timer {
    .content {
        font-size: 1.75rem;
    }
}
</style>
