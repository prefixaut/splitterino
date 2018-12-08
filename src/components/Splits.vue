<template>
    <div v-if="segments != null && segments.length > 0" class="splits-root" :class="['state-' + status]">
        <div class="splits" v-spl-ctx-menu="['splitter', 'def']">
            <div
                v-for="(segment, index) in segments"
                :key="index"
                :class="[
                    'split',

                    {'visible':
                        status !== 'running' && index === 0
                        ||
                        (currentSegment + visibleSegments) >= segments.length &&
                        index >= segments.length - visibleSegments - 1 && index < currentSegment
                        ||
                        index > currentSegment &&
                        index <= currentSegment + visibleSegments
                    },
                    {'current': index === currentSegment && status === 'running'},

                    {['previous-' + (currentSegment - index)]: index < currentSegment},
                    {['next-' + (currentSegment - index)]: (currentSegment - index) > 0 && index > currentSegment},

                    {'skipped': segment.skipped},
                    {'first': index === 0},
                    {'final': index === segments.length - 1},
                    {'is-personal-best': segment.hasNewPersonalBest},
                    {'is-overall-best': segment.hasNewOverallBest}
                ]"
            >
                <span class="name">{{ segment.name }}</span>
                <span class="seperator"></span>
                <span class="time">{{ segment.time | aevum }}</span>
                <span class="best-time">{{ segment.personalBest | aevum }}</span>
                <span class="best-segment">{{ segment.overallBest | aevum }}</span>
            </div>
        </div>
        <div class="container">
            <p class="time total-time">
                <span class="text">Total Time:</span>
                <span>{{ totalTime | aevum }}</span>
            </p>
            <button v-if="status !== 'stopped'" @click="split()">Split</button>
            <button v-else @click="start()">Start</button>
            <button @click="reset()">Reset</button>
            <button @click="togglePause()">{{ status === 'paused' ? 'Unpause' : 'Pause' }}</button>
            <button @click="skipSplit()">Skip Split</button>
            <button @click="undoSplit()">Undo Button</button>
            <button @click="child">Spawn Child</button>
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
     * Amount of previous Splits should be visible
     */
    @Prop({
        type: Number,
        default: 3,
    })
    public visibleSegments: number;

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
     * Total amount of STATE_PAUSED time
     */
    public totalPauseTime = 0;

    child() {
        let child = new remote.BrowserWindow({
            parent: remote.getCurrentWindow(),
        });
        child.loadURL('http://localhost:8080');
        if (!remote.process.env.IS_TEST) child.webContents.openDevTools();
        child.show();
    }

    start() {
        this.$store.dispatch('splitterino/splits/start');
    }

    split() {
        this.$store.dispatch('splitterino/splits/split');
    }

    togglePause() {
        this.status === 'paused' ? this.unpause() : this.pause();
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

<style lang="scss">
@import '../styles/config.scss';

.splits-root {
    &.state-stopped {
        .splits {
            .split {
                .best-time,
                .best-segment {
                    display: none;
                }
            }
        }
    }

    .splits {
        display: flex;
        flex-direction: column;

        .split {
            flex: 1 1 100%;
            float: left;
            padding: 10px 25px;
            display: none;

            &.current {
                display: block;
                background: $color-primary;
            }

            &.visible {
                display: block;
            }

            &.final {
                background: $color-secondary;
            }

            &.is-overall-best {
                .name,
                .time {
                    background-image: -webkit-gradient(
                        linear,
                        left top,
                        right top,
                        color-stop(0, #f22),
                        color-stop(0.15, #f2f),
                        color-stop(0.3, #22f),
                        color-stop(0.45, #2ff),
                        color-stop(0.6, #2f2),
                        color-stop(0.75, #2f2),
                        color-stop(0.9, #ff2),
                        color-stop(1, #f22)
                    );
                    background-image: gradient(
                        linear,
                        left top,
                        right top,
                        color-stop(0, #f22),
                        color-stop(0.15, #f2f),
                        color-stop(0.3, #22f),
                        color-stop(0.45, #2ff),
                        color-stop(0.6, #2f2),
                        color-stop(0.75, #2f2),
                        color-stop(0.9, #ff2),
                        color-stop(1, #f22)
                    );
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                }
            }

            .best-time,
            .best-segment {
                display: none;
            }
        }
    }
}
</style>
