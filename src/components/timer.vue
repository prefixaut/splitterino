<template>
    <div class="timer">
        <span class="content">{{ currentTime | aevum(format) }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { TimerStatus } from '../common/timer-status';
import { now } from '../utils/time';
import AevumFormatMixin from '../mixins/aevum-format.mixin.vue';

const timer = namespace('splitterino/timer');

@Component({
    name: 'spl-timer',
    mixins: [AevumFormatMixin]
})
export default class TimerComponent extends Vue {
    /**
     * If this timer should display the time in IGT Mode.
     */
    @Prop(Boolean)
    public igt = false;

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
    }

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

    public statusChange(forceUpdate: boolean = false) {
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
            this.currentTime = this.finishTime - (this.startTime + this.startDelay);
        }

        if (this.status === TimerStatus.STOPPED) {
            this.currentTime = 0;
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
