<template>
    <div v-if="typeof segments !== 'undefined' && segments !== null && segments.length > 0" class="splits-root" :class="['state-' + state]">
        <div class="splits">
            <div v-for="(segment, index) in segments" :key="index" :class="[
                    'split',

                    {'visible':
                        state !== 'STATE_RUNNING' && index === 0
                        ||
                        (currentSegment + visibleSegments) >= segments.length &&
                        index >= segments.length - visibleSegments - 1 && index < currentSegment
                        ||
                        index > currentSegment &&
                        index <= currentSegment + visibleSegments
                    },
                    {'current': index === currentSegment && state === 'STATE_RUNNING'},

                    {['previous-' + (currentSegment - index)]: index < currentSegment},
                    {['next-' + (currentSegment - index)]: (currentSegment - index) > 0 && index > currentSegment},

                    {'skipped': segment.skipped},
                    {'first': index === 0},
                    {'final': index === segments.length - 1},
                    {'is-personal-best': segment.hasNewPersonalBest},
                    {'is-overall-best': segment.hasNewOverallBest}
                ]">
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
            <button v-on:click="split()">{{ state !== 'STATE_STOPPED' ? 'Split' : 'Start' }}</button>
            <button v-on:click="reset()">Reset</button>
            <button v-on:click="pause()">{{ state === 'STATE_PAUSED' ? 'Unpause' : 'Pause' }}</button>
            <button v-on:click="skipSplit()">Skip Split</button>
            <button v-on:click="revertSplit()">Revert Button</button>
        </div>
    </div>
</template>

<script>
import * as now from 'performance-now';
import { mapState } from 'vuex';
import { Events, Emitter } from '../events';

// Possible states of the Splits
export const STATE_STOPPED = 'STOPPED';
export const STATE_RUNNING = 'RUNNING';
export const STATE_PAUSED = 'PAUSED';
export const STATE_FINISHED = 'FINISHED';

/*
  SEGMENT
  ---------------------------

  - name: Name of the Split which is being displayed
  - startTime: Internal starting time of the segment
  - time: Time in milliseconds for this segment

  - personalBest: Personal Best time in milliseconds
  - hasNewPersonalBest: If the segment has a new personal-best. The Object must have a previosPersonalBest property
  - previousPersonalBest: Time of the previous personal-best

  - overallBest: Overall Best time in milliseconds
  - hasNewOverallBest: If the segment has a new overall-best. The Object must have a previousOverallBest property
  - previousOverallBest: Time of the previous overall-best

  - done: If the segment has been passed (Used to know if it should be resetted)
  - skipped: If the segment has been skipped
*/

export default {
    created: function() {
        // Setup Global-Hotkeys
        Emitter.registerHandler(
            Events.splits.start,
            payload =>
                new Promise((resolve, reject) => {
                    this.start().then(() => {
                        resolve({
                            state: this.state,
                            segments: this.segments
                        });
                    });
                })
        );
        Emitter.registerHandler(
            Events.splits.split,
            payload =>
                new Promise((resolve, reject) => {
                    if (this.split()) {
                        resolve({
                            state: this.state,
                            segments: this.segments
                        });
                    } else {
                        reject();
                    }
                })
        );
        Emitter.registerHandler(
            Events.splits.pause,
            payload =>
                new Promise((resolve, reject) => {
                    if (this.pause()) {
                        resolve({
                            state: this.state,
                            segments: this.segments
                        });
                    } else {
                        reject();
                    }
                })
        );
        Emitter.registerHandler(
            Events.splits.unpause,
            payload =>
                new Promisse((resolve, reject) => {
                    if (this.unpause()) {
                        resolve({
                            state: this.state,
                            segments: this.segments
                        });
                    } else {
                        reject();
                    }
                })
        );
        Emitter.registerHandler(
            Events.splits.reset,
            payload =>
                new Promise((resolve, reject) => {
                    if (this.reset()) {
                        resolve({
                            state: this.state,
                            segments: this.segments
                        });
                    } else {
                        reject();
                    }
                })
        );
    },
    computed: {
        ...mapState('Segments', {
            segments: state => state.elements
        })
    },
    data() {
        return {
            /* Status the splits are currently in
             * STATE_STOPPED - Completely reseted and clean setup.
             * STATE_RUNNING - Time is currently STATE_RUNNING
             * STATE_FINISHED - Last segement just got finished, but still running in the background
             *      in case of wrong splitting
             * STATE_PAUSED - It's paused, time is frozen and will be ignored
            */
            state: STATE_STOPPED,

            // Time when the Timer started
            // Only used for internal calculations
            totalStartTime: 0,
            // Total amount of time in the timer
            totalTime: 0,

            // When the pause was initiated
            pauseStartTime: 0,
            // Total amount of STATE_PAUSED time
            totalPauseTime: 0,

            // Index of the current Segment
            currentSegment: 0,
            // Amount of previous Splits should be visible
            visibleSegments: 3,

            // Start delay for certain runs in ms
            startDelay: 0,

            // If the User had a new best-time
            hasBestTime: false,
            // If the User had a new best-segment
            hasBestSegment: false
        };
    },
    methods: {
        start() {
            let promise = Promise.resolve();
            if (this.state === STATE_FINISHED) {
                promise = this.reset();
            }
            if (this.state !== STATE_STOPPED) {
                return promise.then(() => Promise.reject(new Error()));
            }
            const segment = this.segments[this.currentSegment];
            this.currentSegment = this.totalPauseTime = segment.pauseTime = 0;
            this.totalStartTime = segment.startTime = now() + this.startDelay;
            this.state = STATE_RUNNING;
            this.startTimer();
            return promise.then(() => {});
        },
        split() {
            switch (this.state) {
                case STATE_FINISHED:
                    this.reset();
                    return true;
                case STATE_RUNNING:
                    break;
                default:
                    return false;
            }

            const segment = this.segments[this.currentSegment];
            const time = now() - segment.startTime - segment.pauseTime;

            segment.done = true;
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
        },
        pause() {
            if (this.state !== STATE_RUNNING) {
                return false;
            }
            this.state = STATE_PAUSED;
            this.pauseStartTime = now();
            return true;
        },
        unpause() {
            if (this.state !== STATE_PAUSED) {
                return false;
            }
            const pause = now() - this.pauseStartTime;
            const segment = this.segments[this.currentSegment];
            segment.pauseTime += pause;
            this.totalPauseTime += pause;
            this.pauseStartTime = 0;
            this.state = STATE_RUNNING;
            this.startTimer();
            return true;
        },
        revertSplit() {
            if (this.state !== STATE_RUNNING || this.currentSegment < 1) {
                return false;
            }

            const segment = this.segments[this.currentSegment];
            segment.time = 0;

            // Revert PB
            if (segment.hasNewPersonalBest) {
                segment.personalBest = segment.previousPersonalBest;
                segment.previousPersonalBest = undefined;
                segment.hasNewPersonalBest = false;
            }

            // Revert OB
            if (segment.hasNewOverallBest) {
                segment.overallBest = segment.previousOverallBest;
                segment.previousOverallBest = undefined;
                segment.hasNewOverallBest = false;
            }

            this.currentSegment--;
            const n = this.segments[this.currentSegment];
            n.pauseTime += segment.pauseTime;

            return true;
        },
        skipSplit() {
            if (
                this.state !== STATE_RUNNING ||
                this.currentSegment + 1 >= this.segments.length
            ) {
                return false;
            }

            const segment = this.segments[this.currentSegment];
            segment.time = 0;
            segment.skipped = true;
            segment.done = true;

            this.currentSegment++;
            const n = this.segments[this.currentSegment];
            n.startTime = segment.startTime;

            return true;
        },
        finish() {
            if (this.state !== STATE_RUNNING) {
                return false;
            }

            this.state = STATE_FINISHED;
            this.segments.forEach(segment => {
                segment.previousPersonalBest = segment.personalBest;
                segment.previousOverallBest = segment.overallBest;
            });

            return true;
        },
        reset() {
            if (this.state === STATE_STOPPED) {
                return Promise.reject();
            }
            if (
                (!this.hasOverallBest && !this.hasPersonalBest) ||
                this.state === STATE_FINISHED
            ) {
                this.doApplyingReset();
                return Promise.resolve();
            }

            this.pause();

            return Emitter.request(Events.modals.open, {
                // TODO: What do I actually send?
            }).then(response => {
                // TODO: What do I expect to receive?
            });
        },
        doApplyingReset() {
            this.currentSegment = 0;
            this.state = STATE_STOPPED;
            this.totalStartTime = undefined;
            this.totalTime = 0;
            this.totalPauseTime = 0;

            this.segments.forEach(segment => {
                segment.skipped = false;
                segment.done = false;

                segment.startTime = undefined;
                segment.time = undefined;

                segment.hasNewPersonalBest = false;
                segment.previosPersonalBest = undefined;
                segment.hasNewOverallBest = false;
                segment.previousOverallBest = undefined;

                segment.pauseTime = 0;
            });
        },
        doDiscardingReset() {
            this.currentSegment = 0;
            this.state = STATE_STOPPED;
            this.totalStartTime = undefined;
            this.totalPauseTime = 0;

            this.segments.forEach(segment => {
                segment.skipped = false;
                segment.startTime = undefined;
                segment.time = undefined;
                segment.pauseTime = 0;

                if (segment.done) {
                    segment.done = false;

                    if (segment.hasNewPersonalBest) {
                        segment.personalBest = segment.previousPersonalBest = undefined;
                        segment.hasNewPersonalBest = false;
                    }

                    if (segment.hasNewOverallBest) {
                        segment.overallBest = segment.previousOverallBest;
                        segment.previousOverallBest = undefined;
                        segment.hasNewOverallBest = false;
                    }
                }
            });
        },
        startTimer() {
            const func = function() {
                if (this.state !== STATE_RUNNING) {
                    return;
                }

                this.totalTime =
                    now() - this.totalStartTime - this.totalPauseTime;

                const segment = this.segments[this.currentSegment];
                const s = now() - segment.startTime - segment.pauseTime;
                segment.time = s;

                setTimeout(func, 1);
            }.bind(this);
            func();
        }
    }
};
</script>

<style lang="scss">
@import '../styles/config.scss';

.splits-root {
    &.state-STATE_STOPPED {
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
