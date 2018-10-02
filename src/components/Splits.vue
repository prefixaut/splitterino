<template>
    <div v-if="segments != null && segments.length > 0" class="splits-root" :class="['state-' + state]">
        <div class="splits">
            <div
                v-for="(segment, index) in segments"
                :key="index"
                :class="[
                    'split',

                    {'visible':
                        state !== 'running' && index === 0
                        ||
                        (currentSegment + visibleSegments) >= segments.length &&
                        index >= segments.length - visibleSegments - 1 && index < currentSegment
                        ||
                        index > currentSegment &&
                        index <= currentSegment + visibleSegments
                    },
                    {'current': index === currentSegment && state === 'running'},

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
            <button @click="split()">{{ state !== 'stopped' ? 'Split' : 'Start' }}</button>
            <button @click="reset()">Reset</button>
            <button @click="pause()">{{ state === 'paused' ? 'Unpause' : 'Pause' }}</button>
            <button @click="skipSplit()">Skip Split</button>
            <button @click="revertSplit()">Revert Button</button>
            <button @click="child">Spawn Child</button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import now from 'performance-now';
import { remote } from 'electron';

import { Segment } from '../common/segment';
import { SplitsStatus } from '../common/splits-status';

const splits = namespace('splitterino/splits');

@Component({})
export default class Splits extends Vue {
    /**
     * Amount of previous Splits should be visible
     */
    @Prop({
        type: Number,
        default: 3,
    })
    public visibleSegments;

    @splits.State('status')
    public status: SplitsStatus;

    @segmentsModule.State('segments')
    public segments: Segment[];

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

    /**
     * Index of the current Segment
     */
    public currentSegment = 0;




    child() {
        let child = new remote.BrowserWindow({
            parent: remote.getCurrentWindow()
        });
        child.loadURL('http://localhost:8080');
        if (!remote.process.env.IS_TEST) child.webContents.openDevTools();
        child.show();
    }

    start() {
        this.$store.dispatch('splitterino/segments/start');
    }

    split() {
        this.$store.dispatch('spllitterino/segments/split');
    }

    pause() {
        this.$store.dispatch('spltterino/segments/pause');
    }

    unpause() {

    }

    revertSplit() {
        if (this.state !== SplitsStatus.RUNNING || this.currentSegment < 1) {
            return false;
        }

        const segment = this.segments[this.currentSegment];
        segment.time = 0;

        // Revert PB
        if (segment.hasNewPersonalBest) {
            segment.personalBest = segment.previousPersonalBest;
            segment.previousPersonalBest = 0;
            segment.hasNewPersonalBest = false;
        }

        // Revert OB
        if (segment.hasNewOverallBest) {
            segment.overallBest = segment.previousOverallBest;
            segment.previousOverallBest = 0;
            segment.hasNewOverallBest = false;
        }

        this.currentSegment--;
        const n = this.segments[this.currentSegment];
        n.pauseTime += segment.pauseTime;

        return true;
    }

    skipSplit() {
        if (
            this.state !== SplitsStatus.RUNNING ||
            this.currentSegment + 1 >= this.segments.length
        ) {
            return false;
        }

        const segment = this.segments[this.currentSegment];
        segment.time = 0;
        segment.skipped = true;
        segment.passed = true;

        this.currentSegment++;
        const n = this.segments[this.currentSegment];
        n.startTime = segment.startTime;

        return true;
    }

    finish() {

    }

    reset() {
        if (this.state === SplitsStatus.STOPPED) {
            return Promise.reject(new Error());
        }
        if (
            (!this.hasOverallBest && !this.hasPersonalBest) ||
            this.state === SplitsStatus.FINISHED
        ) {
            this.doApplyingReset();
            return Promise.resolve();
        }

        this.pause();
        return Promise.resolve();
    }

    doApplyingReset() {
        this.currentSegment = 0;
        this.state = SplitsStatus.STOPPED;
        this.totalStartTime = 0;
        this.totalTime = 0;
        this.totalPauseTime = 0;

        for (let segment of this.segments) {
            segment.skipped = false;
            segment.passed = false;

            segment.startTime = 0;
            segment.time = 0;

            segment.hasNewPersonalBest = false;
            segment.previousPersonalBest = 0;
            segment.hasNewOverallBest = false;
            segment.previousOverallBest = 0;

            segment.pauseTime = 0;
        }
    }

    doDiscardingReset() {
        this.currentSegment = 0;
        this.state = SplitsStatus.STOPPED;
        this.totalStartTime = 0;
        this.totalPauseTime = 0;

        for (let segment of this.segments) {
            segment.skipped = false;
            segment.startTime = 0;
            segment.time = 0;
            segment.pauseTime = 0;

            if (!segment.passed) {
                continue;
            }

            segment.passed = false;

            if (segment.hasNewPersonalBest) {
                segment.personalBest = segment.previousPersonalBest;
                segment.previousPersonalBest = 0;
                segment.hasNewPersonalBest = false;
            }

            if (segment.hasNewOverallBest) {
                segment.overallBest = segment.previousOverallBest;
                segment.previousOverallBest = 0;
                segment.hasNewOverallBest = false;
            }
        }
    }

    startTimer() {
        const that = this;
        const func = function() {
            if (that.state !== SplitsStatus.RUNNING) {
                return;
            }

            that.totalTime = now() - that.totalStartTime - that.totalPauseTime;

            const segment = that.segments[that.currentSegment];
            const s = now() - segment.startTime - segment.pauseTime;
            segment.time = s;

            setTimeout(func, 1);
        };
        func();
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
