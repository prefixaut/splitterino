import { SplitsState } from '@/store/states/splits';
import now from 'performance-now';
import { ActionContext, ActionTree, Module } from 'vuex';

import { Segment } from '@/common/segment';
import { SplitsStatus } from '@/common/splits-status';
import { RootState } from '@/store/states/root';

const state: SplitsState = {
    status: SplitsStatus.STOPPED,
    current: -1,
    hasPersonalBest: false,
    hasOverallBest: false,
    segments: [
        {
            // Name of the Segment
            name: '1st Split',
            // Personal Best time in ms
            personalBest: 1000,
            // Best Segment/Overall time in ms
            overallBest: 750
        },
        {
            name: '2nd Split'
        },
        {
            name: '3rd Split'
        },
        {
            name: '4th Split'
        },
        {
            name: '5th Split'
        },
        {
            name: '6th Split'
        },
        {
            name: '7h Split'
        },
        {
            name: 'final Split'
        }
    ]
};

const mutations = {
    clearSegments(state: SplitsState) {
        if (state.status !== SplitsStatus.STOPPED) {
            return;
        }

        state.segments = [];
    },
    removeSegment(state: SplitsState, index: number) {
        if (state.status !== SplitsStatus.STOPPED) {
            return;
        }

        if (
            typeof index !== 'number' ||
            isNaN(index) ||
            !isFinite(index) ||
            index < 0 ||
            state.segments.length < index
        ) {
            return;
        }

        state.segments.splice(index, 1);
    },
    addSegment(state: SplitsState, segment: Segment) {
        if (state.status !== SplitsStatus.STOPPED) {
            return;
        }

        if (segment == null || typeof segment !== 'object') {
            return;
        }

        if (!segment.hasOwnProperty('name')) {
            return;
        }

        state.segments.push(segment);
    },
    updateAllSegments(state: SplitsState, segments: Segment[]) {
        if (state.status !== SplitsStatus.STOPPED) {
            return;
        }

        if (!Array.isArray(segments)) {
            return;
        }

        state.segments = segments;
    },
    setSegment(
        state: SplitsState,
        payload: { index: number; segment: Segment }
    ) {
        if (payload == null || typeof payload !== 'object') {
            return;
        }

        const { index, segment } = payload;

        // Check if the index is valid/exists
        if (
            typeof index !== 'number' ||
            isNaN(index) ||
            !isFinite(index) ||
            index < 0 ||
            state.segments.length < index
        ) {
            return;
        }

        // Check if the new segment is somewhat valid
        if (
            segment == null ||
            typeof segment !== 'object' ||
            !segment.hasOwnProperty('name')
        ) {
            return;
        }

        state.segments[index] = Object.assign(state.segments[index], segment);
    },
    setCurrent(state: SplitsState, index: number) {
        if (
            typeof index !== 'number' ||
            isNaN(index) ||
            !isFinite(index) ||
            index < -1 ||
            index > state.segments.length
        ) {
            return;
        }

        state.current = index;
    },
    setHasPersonalBest(state: SplitsState, to: boolean) {
        state.hasPersonalBest = to;
    },
    setHasOverallBest(state: SplitsState, to: boolean) {
        state.hasOverallBest = to;
    }
};

const actions: ActionTree<SplitsState, RootState> = {
    start(context: ActionContext<SplitsState, RootState>) {
        let promise = Promise.resolve();

        const status = context.rootState['splitterino/timer'].status;

        if (status === SplitsStatus.FINISHED) {
            promise = context.dispatch('reset');
        }

        if (status !== SplitsStatus.STOPPED) {
            return promise.then(() => Promise.reject(new Error()));
        }

        return promise
            .then(() =>
                context.dispatch('splitterino/timer/start', null, {
                    root: true
                })
            )
            .then(() => {
                const startTime =
                    context.rootState['splitterino/timer'].startTime;
                const firstSegment = context.state.segments[0];

                context.commit('setSegment', {
                    index: 0,
                    segment: {
                        ...firstSegment,
                        startTime: startTime
                    } as Segment
                });
                context.commit('setCurrent', 0);
                context.commit('splitterino/timer/setStatus', SplitsStatus.RUNNING, { root: true });
            });
    },
    split(context: ActionContext<SplitsState, RootState>, payload) {
        const currentTime = now();

        const status = context.rootState['splitterino/timer'].status;
        switch (status) {
            case SplitsStatus.FINISHED:
                // Cleanup via reset, but save the new times
                context.dispatch('reset', { applyNewTimes: true });
                return;
            case SplitsStatus.RUNNING:
                break;
            default:
                // Ignore the split-event when it's not running
                return;
        }

        const currentIndex = context.state.current;

        // Get the segment and spread it to create a copy to be able
        // to modify it.
        const currentSegment: Segment = { ...context.state.segments[currentIndex] };
        const time = currentTime - currentSegment.startTime - currentSegment.pauseTime;

        currentSegment.passed = true;
        currentSegment.time = time;

        if (
            currentSegment.personalBest == null ||
            currentSegment.personalBest < 0 ||
            currentSegment.personalBest > time
        ) {
            // Backup of the previous time to be able to revert it
            currentSegment.previousPersonalBest = currentSegment.personalBest;
            currentSegment.personalBest = time;
            currentSegment.hasNewPersonalBest = true;
            this.hasPersonalBest = true;
        } else {
            currentSegment.hasNewPersonalBest = false;
        }

        if (
            currentSegment.overallBest == null ||
            currentSegment.overallBest < 0 ||
            currentSegment.overallBest > time
        ) {
            // Backup of the previous time to be able to revert it
            currentSegment.previousOverallBest = currentSegment.overallBest;
            currentSegment.overallBest = time;
            currentSegment.hasNewOverallBest = true;
            this.hasOverallBest = true;
        } else {
            currentSegment.hasNewOverallBest = false;
        }

        context.commit('setSegment', {
            index: currentIndex,
            segment: currentSegment
        });

        // Check if it is the last split
        if (currentIndex + 1 >= context.state.segments.length) {
            context.commit('splitterino/timer/setStatus', SplitsStatus.FINISHED, { root: true });
            return;
        }

        const next: Segment = {
            ...context.state.segments[currentIndex + 1],
            startTime: currentTime,
            pauseTime: 0,
            passed: false,
            skipped: false,
        };

        context.commit('setSegment', {
            index: currentIndex + 1,
            segment: next,
        });
        context.commit('setCurrent', currentIndex + 1);
    },
    skip(context: ActionContext<SplitsState, RootState>, payload) {},
    undo(context: ActionContext<SplitsState, RootState>, payload) {},
    pause(context: ActionContext<SplitsState, RootState>, payload) {
        if (context.state.status !== SplitsStatus.RUNNING) {
            return;
        }

        this.state = SplitsStatus.PAUSED;
        this.pauseStartTime = now();
    },
    unpause(context: ActionContext<SplitsState, RootState>, payload) {
        if (this.state !== SplitsStatus.PAUSED) {
            return false;
        }
        const pause = now() - this.pauseStartTime;
        const segment = this.segments[this.currentSegment];
        segment.pauseTime += pause;
        this.totalPauseTime += pause;
        this.pauseStartTime = 0;
        this.state = SplitsStatus.RUNNING;
        this.startTimer();
        return true;
    },
    reset(context: ActionContext<SplitsState, RootState>, payload) {
        const { applyNewTimes } = payload;
    }
};

const module: Module<SplitsState, any> = {
    namespaced: true,
    state,
    mutations,
    actions
};

export default module;
