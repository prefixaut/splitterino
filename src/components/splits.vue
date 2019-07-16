<template>
    <div class="splits-root" :class="['state-' + status, { scrolling: scrollIndex > -1 }]">
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

                        { ['previous-' + (currentSegment - index)]: index < currentSegment },
                        { ['next-' + (index - currentSegment)]: index - currentSegment > 0 },

                        { skipped: segment.skipped },
                        { first: index === 0 },
                        { final: index === segments.length - 1 },
                        { 'is-personal-best': segment.hasNewPersonalBest },
                        { 'is-overall-best': segment.hasNewOverallBest },
                    ]"
                >
                    <div class="name">{{ segment.name }}</div>
                    <div
                        class="time"
                        v-show="(status === 'running' && index <= currentSegment) ||
                            status === 'finished' || status === 'paused' || status === 'running_igt_pause'"
                    >
                        {{ getSegmentTime(index) | aevum }}
                    </div>
                    <div class="personal-best">PB: {{ segment.personalBest | time(timing) | aevum }}</div>
                    <div class="overall-best">OB: {{ segment.overallBest | time(timing) | aevum }}</div>
                </div>
            </div>
        </template>

        <div v-else class="empty">
            <p>No splits are currently set! Please load some or create new ones!</p>
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

    public get visibleIndicies(): number[] {
        const current = this.scrollIndex < 0
            ? this.currentSegment < 0 ? 0 : this.currentSegment
            : this.scrollIndex;

        const max = this.segments.length;
        const displayCount = Math.min(
            this.visiblePreviousSegments + this.visibleUpcomingSegments + 1,
            this.segments.length
        );

        const start = clamp(
            current - clamp(
                current,
                0,
                displayCount - clamp(
                    max - current,
                    1,
                    this.visibleUpcomingSegments + 1
                )
            ),
            0,
            max + this.visibleUpcomingSegments
        );

        const arr = [];
        for (
            let i = start;
            i < start + displayCount && i < this.segments.length;
            i++
        ) {
            arr.push(i);
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
            &.scroll {
                display: flex;
            }

            .personal-best,
            .overall-best {
                display: contents;
                font-size: 0.85rem;
            }

            .overall-best::before {
                display: block;
                content: '';
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
