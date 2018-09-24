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
            <button v-on:click="split()">{{ state !== 'stopped' ? 'Split' : 'Start' }}</button>
            <button v-on:click="reset()">Reset</button>
            <button v-on:click="pause()">{{ state === 'paused' ? 'Unpause' : 'Pause' }}</button>
            <button v-on:click="skipSplit()">Skip Split</button>
            <button v-on:click="revertSplit()">Revert Button</button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import now from 'performance-now';
import { mapState } from 'vuex';

import { Segment } from '../common/segment';

enum State {
    /**
     * When the Splits are in a _clean_ state.
     * No timer is running and it's currently idle.
     */
    STOPPED = 'stopped',
    /**
     * When the timer is running
     */
    RUNNING = 'running',
    /**
     * When the user/script paused the timer
     */
    PAUSED = 'paused',
    /**
     * When the last segment has been finished.
     * This state remains in this until the user splits again which _confirms_
     * the state.
     * On confirmation the content is getting saved, cleaned up and set to
     * {@link STOPPED} again to be able to start a new run.
     */
    FINISHED = 'finished'
}

const segmentsModule = namespace('splitterino/segments');

@Component({})
export default class Splits extends Vue {
    public state = State.STOPPED;

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
    /**
     * Amount of previous Splits should be visible
     */
    public visibleSegments = 3;

    /**
     * Start delay for certain runs in ms
     */
    public startDelay = 0;
    /**
     * If there's a new personal best
     */
    public hasPersonalBest = false;
    /**
     * If there's a new overall best
     */
    public hasOverallBest = false;

    @segmentsModule.State('elements') public segments: Segment[];

    start() {
        let promise = Promise.resolve();
        if (this.state === State.FINISHED) {
            promise = this.reset();
        }
        if (this.state !== State.STOPPED) {
            return promise.then(() => Promise.reject(new Error()));
        }
        const segment = this.segments[this.currentSegment];
        this.currentSegment = this.totalPauseTime = segment.pauseTime = 0;
        this.totalStartTime = segment.startTime = now() + this.startDelay;
        this.state = State.RUNNING;
        this.startTimer();
        return promise.then(() => {});
    }

    split() {
        switch (this.state) {
            case State.FINISHED:
                this.reset();
                return true;
            case State.RUNNING:
                break;
            default:
                return false;
        }

        const segment = this.segments[this.currentSegment];
        const time = now() - segment.startTime - segment.pauseTime;

        segment.passed = true;
        segment.time = time;

        if (
            typeof segment.personalBest === 'undefined' ||
            segment.personalBest > time
        ) {
            // Backup of the previous time to be able to revert it
            segment.previousPersonalBest = segment.personalBest;
            segment.personalBest = time;
            segment.hasNewPersonalBest = true;
            this.hasPersonalBest = true;
        } else {
            segment.hasNewPersonalBest = false;
        }

        if (
            typeof segment.overallBest === 'undefined' ||
            segment.overallBest > time
        ) {
            // Backup of the previous time to be able to revert it
            segment.previousOverallBest = segment.overallBest;
            segment.overallBest = time;
            segment.hasNewOverallBest = true;
            this.hasOverallBest = true;
        } else {
            segment.hasNewOverallBest = false;
        }

        // Check if it is the last split
        if (this.currentSegment + 1 >= this.segments.length) {
            this.finish();
            return true;
        }

        this.currentSegment++;
        const n = this.segments[this.currentSegment];
        n.pauseTime = 0;
        n.startTime = now();
        return true;
    }

    pause() {
        if (this.state !== State.RUNNING) {
            return false;
        }
        this.state = State.PAUSED;
        this.pauseStartTime = now();
        return true;
    }

    unpause() {
        if (this.state !== State.PAUSED) {
            return false;
        }
        const pause = now() - this.pauseStartTime;
        const segment = this.segments[this.currentSegment];
        segment.pauseTime += pause;
        this.totalPauseTime += pause;
        this.pauseStartTime = 0;
        this.state = State.RUNNING;
        this.startTimer();
        return true;
    }

    revertSplit() {
        if (this.state !== State.RUNNING || this.currentSegment < 1) {
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
            this.state !== State.RUNNING ||
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
        if (this.state !== State.RUNNING) {
            return false;
        }

        this.state = State.FINISHED;
        for (let segment of this.segments) {
            segment.previousPersonalBest = segment.personalBest;
            segment.previousOverallBest = segment.overallBest;
        }

        return true;
    }

    reset() {
        if (this.state === State.STOPPED) {
            return Promise.reject(new Error());
        }
        if (
            (!this.hasOverallBest && !this.hasPersonalBest) ||
            this.state === State.FINISHED
        ) {
            this.doApplyingReset();
            return Promise.resolve();
        }

        this.pause();
        return Promise.resolve();
    }

    doApplyingReset() {
        this.currentSegment = 0;
        this.state = State.STOPPED;
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
        this.state = State.STOPPED;
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
            if (that.state !== State.RUNNING) {
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
