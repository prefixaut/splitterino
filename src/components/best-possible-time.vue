<template>
    <div class="best-possible-time">
        <div class="label">{{ label }}</div>
        <div class="time">{{ bestPossibleTime | aevum }}</div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import { Segment, TimingMethod, getFinalTime } from '../common/interfaces/segment';
import { TimerStatus } from '../common/timer-status';
import { RootState } from '../store/states/root.state';
import { now } from '../utils/time';

const timer = namespace('splitterino/timer');
const splits = namespace('splitterino/splits');

@Component({ name: 'spl-best-possible-time' })
export default class BestPossibleTimeComponent extends Vue {
    @Prop({ type: String, default: 'Best possible Time' })
    public label: string;

    @timer.State('status')
    public status: TimerStatus;

    @splits.State('segments')
    public segments: Segment[];

    @splits.State('current')
    public currentSegment: number;

    @splits.State('timing')
    public timing: TimingMethod;

    public currentSegmentTime: number = 0;
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

        this.calculateCurrentTime();
        this.statusChange();
    }

    public get bestPossibleTime() {
        const segmentsWithOB = this.segments
            .filter(segment => (
                segment.overallBest != null &&
                segment.overallBest[this.timing] != null &&
                getFinalTime(segment.overallBest[this.timing])
            ));

        // Can only calculate the time when all OBs are set
        if (segmentsWithOB.length === this.segments.length) {
            if (this.currentSegment > -1) {
                const currentPace = this.segments
                    .slice(0, this.currentSegment)
                    .reduce((previousValue, segment) => {
                        return previousValue + (segment.passed ? getFinalTime(segment.currentTime[this.timing]) : 0);
                    }, 0);
                const bestPossibleUpcomingTime = segmentsWithOB
                    .slice(this.currentSegment)
                    .reduce((previousValue, segment) => {
                        return previousValue + getFinalTime(segment.overallBest[this.timing]);
                    }, 0);

                return currentPace + this.currentSegmentTime + bestPossibleUpcomingTime;
            } else {
                return segmentsWithOB.reduce((previousValue, segment) => {
                    return previousValue + getFinalTime(segment.overallBest[this.timing]);
                }, 0);
            }
        }

        return null;
    }

    public beforeDestroy() {
        this.statusWatcher();
    }

    public statusChange(forceUpdate: boolean = false) {
        if (
            this.status === TimerStatus.RUNNING ||
            (this.timing !== TimingMethod.IGT && this.status === TimerStatus.RUNNING_IGT_PAUSE)
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
    }

    private calculateCurrentTime() {
        const segment = this.segments[this.currentSegment];
        if (segment != null) {
            const pauseTime = segment.currentTime != null && segment.currentTime[this.timing] != null ?
                segment.currentTime[this.timing].pauseTime : 0;
            const currentTime = (now() - segment.startTime - pauseTime);
            const pb = segment.overallBest != null ? getFinalTime(segment.overallBest[this.timing]) : null;

            this.currentSegmentTime = Math.max(currentTime, pb);
        } else {
            this.currentSegmentTime = 0;
        }
    }
}
</script>

<style lang="scss" scoped>
.best-possible-time {
    display: flex;
    flex-wrap: nowrap;

    .label {
        flex: 1 1 auto;
    }

    .time {
        flex: 0 0 auto;
        text-align: right;
    }
}
</style>
