<template>
    <div class="splits-root" :class="['state-' + status, { scrolling: scrollIndex > -1 }, { 'pin-last-segment': pinLastSegment }]">
        <template v-if="segments != null && segments.length > 0">
            <div class="splits" @mousewheel="scrollSplits" @mouseleave="scrollIndex = -1">
                <div
                    v-for="(segment, index) in segments"
                    :key="index"
                    :class="[
                        'split',

                        { visible: visibleIndicies.includes(index) },
                        { current: index === currentSegment && status === 'running' },
                        { scroll: index === scrollIndex },

                        { first: index === 0 },
                        { ['previous-' + (currentSegment - index)]: index < currentSegment },
                        { ['next-' + (index - currentSegment)]: index - currentSegment > 0 },
                        { final: index === segments.length - 1 },
                        { pinned: index === segments.length - 1 && pinLastSegment },

                        { skipped: segment.skipped },
                        { passed: segment.passed },
                        { 'is-overall-best': segment.hasNewOverallBest },
                    ]"
                >
                    <div class="name">{{ segment.name }}</div>
                    <div class="time" v-show="showTime(index)">
                        {{ getSegmentTime(index) | aevum }}
                    </div>
                    <div class="comparisons" v-show="showTime(index)">
                        <div class="personal-best">
                            {{ getSegmentPersonalBestComparison(index) | aevum }}
                        </div>
                        <div class="overall-best">
                            {{ getSegmentOverallBestComparison(index) | aevum }}
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div v-else class="empty">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { clamp } from 'lodash';

import { Segment, TimingMethod, getFinalTime } from '../common/interfaces/segment';
import { TimerStatus } from '../common/timer-status';
import { now } from '../utils/time';
import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron';
import { RootState } from '../store/states/root.state';
import { Logger } from '../utils/logger';

const timer = namespace('splitterino/timer');
const splits = namespace('splitterino/splits');

@Component({ name: 'spl-splits' })
export default class SplitsComponent extends Vue {
    /**
     * Amount of upcoming segments which should be visible
     */
    @Prop({
        type: Number,
        default: 2,
    })
    public visibleUpcomingSegments: number;

    /**
     * Amount of previous segments which should be visible
     */
    @Prop({
        type: Number,
        default: 1,
    })
    public visiblePreviousSegments: number;

    @Prop({
        type: Boolean,
        default: false,
    })
    public pinLastSegment: boolean;

    @timer.State('status')
    public status: TimerStatus;

    @splits.State('segments')
    public segments: Segment[];

    @splits.State('current')
    public currentSegment: number;

    @splits.State('timing')
    public timing: TimingMethod;

    /**
     * Scroll index. Used to scroll over the splits with
     * the mouse-wheel. When bigger than -1, it indicates
     * the currently viewed index.
     * If it's -1 or lower, the current segment index is
     * the currently viewed one.
     */
    public scrollIndex = -1;
    /**
     * The time of the current segment which is getting updated
     * every millisecond when the timer is running.
     */
    public currentSegmentTime = 0;
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

        this.calculateCurrentSegmentTime();
        this.statusChange();
    }

    public beforeDestroy() {
        this.statusWatcher();
    }

    public statusChange() {
        if (this.status === TimerStatus.RUNNING) {
            this.intervalId = window.setInterval(() => {
                this.calculateCurrentSegmentTime();
            }, 1);

            return;
        }

        if (this.intervalId > -1) {
            window.clearInterval(this.intervalId);
        }

        if (this.status === TimerStatus.STOPPED) {
            this.currentSegmentTime = 0;
        }
    }

    private calculateCurrentSegmentTime() {
        try {
            const segment = this.segments[this.currentSegment];
            if (segment != null) {
                let pauseTime = 0;
                if (segment.currentTime != null && segment.currentTime[this.timing] != null) {
                    pauseTime = segment.currentTime[this.timing].pauseTime;
                }
                this.currentSegmentTime = now() - segment.startTime - pauseTime;
            }
        } catch (error) {
            // Clear the interval to not trigger billions of errors
            window.clearInterval(this.intervalId);
            Logger.error({
                msg: 'Error in timer update-interval of splits-component!',
                error,
            });
        }
    }

    public get showTime() {
        return (index: number) => {
            return (
                (this.status === 'running' || this.status === 'paused' || this.status === 'running_igt_pause') &&
                index <= this.currentSegment
            ) || this.status === 'finished';
        };
    }

    public get visibleIndicies(): number[] {
        const current = this.scrollIndex < 0
            ? this.currentSegment < 0 ? 0 : this.currentSegment
            : this.scrollIndex;

        const max = this.segments.length;
        const displayCount = Math.min(
            this.visiblePreviousSegments + 1 + this.visibleUpcomingSegments,
            this.segments.length
        );

        let start = clamp(
            current - clamp(
                current,
                0,
                displayCount - clamp(
                    max - current,
                    this.visiblePreviousSegments,
                    this.visibleUpcomingSegments + 1
                )
            ),
            0,
            max + this.visibleUpcomingSegments
        );
        const tmp = max - start;
        if (tmp < displayCount) {
            start -= displayCount - tmp;
        }

        const arr = [];
        for (
            let i = start;
            i < (start + displayCount) - (this.pinLastSegment ? 1 : 0) &&
            i < (this.segments.length - (this.pinLastSegment ? 1 : 0));
            i++
        ) {
            arr.push(i);
        }
        if (this.pinLastSegment) {
            arr.push(this.segments.length - 1);
        }

        return arr;
    }

    public getSegmentTime(index: number) {
        const segment = this.segments[index];
        if (this.status === TimerStatus.FINISHED || index < this.currentSegment) {
            return getFinalTime(segment.currentTime[this.timing]);
        }

        if ((
            this.status !== TimerStatus.RUNNING &&
            this.status !== TimerStatus.PAUSED &&
            this.status !== TimerStatus.RUNNING_IGT_PAUSE
        ) || index > this.currentSegment) {
            return null;
        }

        return this.currentSegmentTime;
    }

    public getSegmentPersonalBestComparison(index: number) {
        const segment = this.segments[index];
        if (
            this.status !== TimerStatus.STOPPED &&
            segment.personalBest != null &&
            index <= this.currentSegment
        ) {
            const personalBestTime = getFinalTime(segment.personalBest[this.timing]);
            if (index < this.currentSegment) {
                return getFinalTime(segment.currentTime[this.timing]) - personalBestTime;
            }

            return this.currentSegmentTime - personalBestTime;
        }

        return null;
    }

    public getSegmentOverallBestComparison(index: number) {
        const segment = this.segments[index];

        if (
            this.status !== TimerStatus.STOPPED &&
            segment.overallBest != null &&
            index <= this.currentSegment
        ) {
            const overallBestTime = getFinalTime(segment.overallBest[this.timing]);
            if (index < this.currentSegment) {
                return getFinalTime(segment.currentTime[this.timing]) - overallBestTime;
            }

            return this.currentSegmentTime - overallBestTime;
        }

        return null;
    }

    scrollSplits(event: WheelEvent) {
        if (event.deltaY > 0) {
            this.scrollIndex++;
        } else {
            this.scrollIndex--;
        }

        this.scrollIndex = Math.max(0, Math.min(
            this.scrollIndex,
            this.segments.length - 1
        ));
    }
}
</script>

<style lang="scss" scoped>
@import '../styles/core.scss';

.splits-root {
    .controls {
        margin: 15px 0;

        .spl-button {
            margin-right: 10px;
        }
    }

    .splits {
        display: flex;
        flex-direction: column;

        .split {
            flex: 1 1 100%;
            display: none;
            padding: 0;
            flex-direction: row;
            flex-wrap: nowrap;
            transition: 200ms;
            padding: 0 20px;

            > * {
                flex: 0 0 auto;
                display: inline-block;
            }

            .name {
                padding: 10px 0;
                flex: 1 1 100%;
            }

            .time {
                margin-left: 10px;
                padding: 10px;

                &.hidden {
                    display: none;
                }
            }

            &.current {
                background: transparentize($spl-color-primary, 0.6);

                + .visible {
                    background: transparentize($spl-color-light-primary, 0.6);
                }
            }

            &.visible,
            &.scroll,
            &.pinned {
                display: flex;
            }

            .comparisons {
                display: flex;
                font-size: 0.75rem;
                flex-wrap: wrap;
                flex: 1 1 auto;

                > * {
                    font-size: inherit;
                    display: block;
                    flex: 1 1 100%;
                    text-align: right;
                    margin: 2px 0;
                }
            }

            .personal-best::before {
                content: 'PB: ';
                display: inline-block;
            }

            .overall-best::before {
                content: 'OB: ';
                display: inline-block;
            }
        }
    }

    &.scrolling {
        .split.scroll {
            background: #444;
        }
    }

    &:not(.scrolling) {
        .split.current {
            display: flex;
        }
    }

    &.state-stopped {
        &:not(.scrolling) {
            .split.first {
                display: flex;
            }
        }
    }

    &.state-finished {
        &:not(.scrolling) {
            .split.final {
                display: flex;
            }
        }
    }
}
</style>
