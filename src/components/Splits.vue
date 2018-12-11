<template>
    <div
        v-if="segments != null && segments.length > 0"
        class="splits-root"
        :class="['state-' + status, { scrolling: scrollIndex > -1 }]"
    >
        <div
            class="splits"
            v-spl-ctx-menu="['splitter', 'def']"
            @mousewheel="scrollSplits"
            @mouseleave="scrollIndex = -1"
        >
            <div
                v-for="(segment, index) in segments"
                :key="index"
                :class="[
                    'split',

                    {'visible': isVisible(index)},
                    {'current': index === currentSegment && status === 'running'},
                    {'scroll': index === scrollIndex},

                    {['previous-' + (currentSegment - index)]: index < currentSegment},
                    {['next-' + (index - currentSegment)]: (index - currentSegment) > 0},

                    {'skipped': segment.skipped},
                    {'first': index === 0},
                    {'final': index === segments.length - 1},
                    {'is-personal-best': segment.hasNewPersonalBest},
                    {'is-overall-best': segment.hasNewOverallBest}
                ]"
            >
                <div class="name">{{ segment.name }}</div>
                <div class="time">{{ segment.time | aevum }}</div>
                <div class="best-time">{{ segment.personalBest | aevum }}</div>
                <div class="best-segment">{{ segment.overallBest | aevum }}</div>
            </div>
        </div>

        <div class="controls">
            <spl-button outline v-if="status !== 'stopped'" @click="split()">Split</spl-button>
            <spl-button outline v-else @click="start()">Start</spl-button>
            <spl-button outline @click="reset()">Reset</spl-button>
            <spl-button outline v-if="status === 'paused'" @click="unpause()">Unpause</spl-button>
            <spl-button outline v-else @click="pause()">Pause</spl-button>
            <spl-button outline @click="skipSplit()">Skip</spl-button>
            <spl-button outline @click="undoSplit()">Undo</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { remote } from 'electron';

import { Segment } from '../common/segment';
import { TimerStatus } from '../common/timer-status';
import { now } from '../utils/now';

const timer = namespace('splitterino/timer');
const splits = namespace('splitterino/splits');

@Component
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

    /**
     * Time when the Timer started
     * Only used for internal calculations
     */
    public totalStartTime = 0;
    /**
     * Total amount of time in the timer
     */
    public totalTime = 0;
    /**
     * When the pause was initiated
     */
    public pauseStartTime = 0;
    /**
     * Total amount of time that the timer was paused
     */
    public totalPauseTime = 0;
    /**
     * Scroll index. Used to scroll over the splits with
     * the mouse-wheel. When bigger than -1, it indicates
     * the currently viewed index.
     * If it's -1 or lower, the current segment index is
     * the currently viewed one.
     */
    public scrollIndex = -1;

    scrollSplits(event: MouseWheelEvent) {
        if (event.deltaY > 0) {
            this.scrollIndex++;
        } else {
            this.scrollIndex--;
        }

        this.scrollIndex = Math.max(0,
            Math.min(this.scrollIndex, this.segments.length - 1));
    }

    isVisible(index: number): boolean {
        const current = this.scrollIndex < 0
            ? this.currentSegment < 0 ? 0 : this.currentSegment
            : this.scrollIndex;

        const max = this.segments.length;
        let next = this.visibleUpcomingSegments;
        let prev = this.visiblePreviousSegments;
        if (current - prev < 0) {
            next += ((current - this.visibleUpcomingSegments) + 1) * -1;
        }
        if (current + 1 + this.visibleUpcomingSegments > max) {
            prev += (
                max - this.visibleUpcomingSegments
                - current - this.visiblePreviousSegments
            ) * -1;
        }

        return (
            (index < current && index + prev >= current) ||
            (index > current && index <= current + next)
        );
    }

    start() {
        this.$store.dispatch('splitterino/splits/start');
    }

    split() {
        this.$store.dispatch('splitterino/splits/split');
    }

    pause() {
        this.$store.dispatch('splitterino/splits/pause');
    }

    unpause() {
        this.$store.dispatch('splitterino/splits/unpause');
    }

    skipSplit() {
        this.$store.dispatch('splitterino/splits/skip');
    }

    undoSplit() {
        this.$store.dispatch('splitterino/splits/undo');
    }

    reset() {
        this.$store.dispatch('splitterino/splits/reset', {
            windowId: remote.getCurrentWindow().id,
        });
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
            }

            &.current {
                background: transparentize($spl-color-primary, 0.6);

                + .visible {
                    background: transparentize($spl-color-light-primary, 0.6);
                }
            }

            &.current,
            &.visible,
            &.scroll {
                display: flex;
            }

            .best-time,
            .best-segment {
                display: none;
            }
        }
    }

    &.scrolling {
        .split.scroll {
            background: #444;
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
