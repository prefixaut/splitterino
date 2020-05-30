<template>
    <div class="possible-time-save">
        <div class="label">{{ label }}</div>
        <div class="time">{{ possibleTimeSave | aevum(format) }}</div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

import AevumFormatMixin from '../mixins/aevum-format.mixin.vue';
import { TimerStatus } from '../../common/timer-status';
import { Segment, TimingMethod } from '../../models/splits';
import { State } from '../../utils/store';
import { now, getFinalTime } from '../../utils/time';

@Component({
    name: 'spl-possible-time-save',
    mixins: [AevumFormatMixin]
})
export default class PossibleTimeSaveComponent extends Vue {
    @Prop({ type: String, default: 'Possible Time Save' })
    public label: string;

    @State('splitterino.timer.status')
    public status: TimerStatus;

    @State('splitterino.splits.segments')
    public segments: Segment[];

    @State('splitterino.splits.current')
    public currentSegment: number;

    @State('splitterino.splits.timing')
    public timing: TimingMethod;

    public currentSegmentTime: number = 0;
    /**
     * Id of the interval to cancel it when the component is getting
     * destroyed.
     */
    private intervalId = -1;

    private statusWatcher = () => {
        // noop
    };

    public created() {
        this.statusWatcher = this.$observe('splitterino.timer.status', () => this.statusChange());

        this.calculateCurrentSegmentTime();
        this.statusChange();
    }

    public beforeDestroy() {
        this.statusWatcher();
    }

    public get possibleTimeSave() {
        const segment = this.segments[this.currentSegment];
        if (segment != null && segment.overallBest != null && segment.overallBest[this.timing] != null) {
            return Math.max(getFinalTime(segment.overallBest[this.timing]) - this.currentSegmentTime, 0);
        }

        return null;
    }

    public statusChange() {
        if (
            this.status === TimerStatus.RUNNING ||
            (this.timing !== TimingMethod.IGT && this.status === TimerStatus.RUNNING_IGT_PAUSE)
        ) {
            // It's already running, no need to start another interval
            if (this.intervalId < 0) {
                this.intervalId = window.setInterval(() => {
                    this.calculateCurrentSegmentTime();
                }, 1);
            }

            return;
        }

        if (this.intervalId > -1) {
            window.clearInterval(this.intervalId);
            this.intervalId = -1;
        }

        if (this.status === TimerStatus.STOPPED) {
            this.currentSegmentTime = 0;
        }
    }

    private calculateCurrentSegmentTime() {
        const segment = this.segments[this.currentSegment];
        if (segment != null) {
            const pauseTime = segment.currentTime != null && segment.currentTime[this.timing] != null ?
                segment.currentTime[this.timing].pauseTime : 0;
            const currentTime = (now() - segment.startTime - pauseTime);
            const best = segment.personalBest != null ? getFinalTime(segment.personalBest[this.timing]) : null;

            this.currentSegmentTime = Math.max(currentTime, best > 0 ? best : null);
        } else {
            this.currentSegmentTime = 0;
        }
    }
}
</script>

<style lang="scss" scoped>
.possible-time-save {
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
