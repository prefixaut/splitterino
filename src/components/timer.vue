<template>
    <div class="timer">
        <span class="content">{{ currentTime | aevum }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { TimerStatus } from '../common/timer-status';
import { RootState } from '../store/states/root.state';
import { now } from '../utils/time';

const timer = namespace('splitterino/timer');

@Component({ name: 'spl-timer' })
export default class TimerComponent extends Vue {
    @timer.State('status')
    public status: TimerStatus;

    @timer.State('startDelay')
    public startDelay: number;

    @timer.State('startTime')
    public startTime: number;

    @timer.State('pauseTotal')
    public pauseTotal: number;

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
            (state: RootState) => state.splitterino.timer.status,
            () => this.statusChange()
        );
    }

    public beforeDestroy() {
        this.statusWatcher();
    }

    public statusChange() {
        if (this.status === TimerStatus.RUNNING) {
            this.intervalId = window.setInterval(() => {
                this.currentTime =
                    now() - this.startTime - this.startDelay - this.pauseTotal;
            }, 1);

            return;
        }

        if (this.intervalId > -1) {
            window.clearInterval(this.intervalId);
        }

        if (this.status === TimerStatus.FINISHED) {
            this.currentTime = this.finishTime - (this.startTime + this.startDelay);
        }

        if (this.status === TimerStatus.STOPPED) {
            this.currentTime = 0;
        }
    }
}
</script>
