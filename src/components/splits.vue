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

                    {'visible': visibleIndicies.includes(index)},
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
            <spl-button outline @click="openSettings()">Settings</spl-button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { remote } from 'electron';
import { clamp } from 'lodash';

import { Segment } from '../common/segment';
import { TimerStatus } from '../common/timer-status';
import { now } from '../utils/now';
import { newWindow } from '../utils/new-window';

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
     * Scroll index. Used to scroll over the splits with
     * the mouse-wheel. When bigger than -1, it indicates
     * the currently viewed index.
     * If it's -1 or lower, the current segment index is
     * the currently viewed one.
     */
    public scrollIndex = -1;

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

    openSettings() {
        newWindow(
            {
                width: 800,
                height: 600,
                parent: remote.getCurrentWindow(),
                frame: false,
                modal: true
            },
            '/settings'
        );
    }

    scrollSplits(event: MouseWheelEvent) {
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
