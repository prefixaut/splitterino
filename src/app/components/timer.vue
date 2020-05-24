<template>
    <div class="timer" :class="['status-' + status]">
        <span class="content">{{ currentTime | aevum(cleanFormat) }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

import { TimerStatus } from '../../common/timer-status';
import { getValueByPath } from '../../store/modules/settings.module';
import { State } from '../../utils/store';
import { now } from '../../utils/time';

@Component({ name: 'spl-timer' })
export default class TimerComponent extends Vue {
    /**
     * If this timer should display the time in IGT Mode.
     */
    @Prop({ type: Boolean, default: false })
    public igt;

    @Prop({ type: String, default: null })
    public format: string;

    @State('splitterino.timer.status')
    public status: TimerStatus;

    @State('splitterino.timer.startDelay')
    public startDelay: number;

    @State('splitterino.timer.startTime')
    public startTime: number;

    @State('splitterino.timer.pauseTotal')
    public pauseTotal: number;

    @State('splitterino.timer.igtPauseTotal')
    public igtPauseTotal: number;

    @State('splitterino.timer.finishTime')
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
        this.statusWatcher = this.$watch(
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
            return getValueByPath(this.$state.splitterino.settings)('splitterino.core.timer.format');
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
