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
                context.commit(
                    'splitterino/timer/setStatus',
                    SplitsStatus.RUNNING,
                    { root: true }
                );
            });
    },
    split(context: ActionContext<SplitsState, RootState>) {
        const currentTime = now();

        const status = context.rootState['splitterino/timer'].status;
        switch (status) {
            case SplitsStatus.FINISHED:
                // Cleanup via reset
                context.dispatch('reset');
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
        const currentSegment: Segment = {
            ...context.state.segments[currentIndex]
        };
        const time =
            currentTime - currentSegment.startTime - currentSegment.pauseTime;

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
            context.commit(
                'splitterino/timer/setStatus',
                SplitsStatus.FINISHED,
                { root: true }
            );
            return;
        }

        const next: Segment = {
            ...context.state.segments[currentIndex + 1],
            startTime: currentTime,
            passed: false,
            skipped: false
        };

        context.commit('setSegment', {
            index: currentIndex + 1,
            segment: next
        });
        context.commit('setCurrent', currentIndex + 1);
    },
    skip(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState['splitterino/timer'].status;
        const index = context.state.current;

        if (
            status !== SplitsStatus.RUNNING ||
            index >= context.state.segments.length
        ) {
            return;
        }

        const segment: Segment = {
            ...context.state.segments[index],
            time: 0,
            skipped: true,
            passed: false,
        };

        const next: Segment = {
            ...context.state.segments[index + 1],
            startTime: time,
        };

        context.commit('setSegment', { index, segment });
        context.commit('setSegment', { index: index + 1, segment: next });
        context.commit('setCurrent', index + 1);
    },
    undo(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState['splitterino/timer'].status;
        const index = context.state.current;

        if (status !== SplitsStatus.RUNNING || index < 1) {
            return;
        }

        const segment: Segment = {
            ...context.state.segments[index],
            time: 0,
            passed: false,
            skipped: false,
        };

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

        const previous: Segment = { ...context.state.segments[index - 1] };
        // Add the pause time of the the current segment to the previous
        previous.pauseTime += segment.pauseTime;
        // Clear the pause time afterwards
        segment.pauseTime = 0;

        context.commit('setSegment', { index, segment });
        context.commit('setSegment', { index: index - 1, segment: previous });
        context.commit('setCurrent', index - 1);
    },
    pause(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState['splitterino/timer'].status;
        if (status !== SplitsStatus.RUNNING) {
            return;
        }

        context.commit(
            'splitterino/timer/setStatus',
            { time, status: SplitsStatus.PAUSED },
            { root: true }
        );
    },
    unpause(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState['splitterino/timer'].status;

        if (status !== SplitsStatus.PAUSED) {
            return;
        }

        const pauseAddition = time - context.rootState['splitterino/timer'].pauseTime;
        const index = context.state.current;
        const segment: Segment = { ...context.state.segments[index] };
        segment.pauseTime += pauseAddition;

        context.commit('setSegment', { index, segment });
        context.commit('splitterino/timer/setStatus', { time, status: SplitsStatus.RUNNING });
    },
    reset(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState['splitterino/timer'].status;

        if (status === SplitsStatus.STOPPED) {
            return;
        }

        if (
            (!this.hasOverallBest && !this.hasPersonalBest) ||
            this.state === SplitsStatus.FINISHED
        ) {
            return context.dispatch('softReset');
        }

        this.pause();
        return Promise.resolve();
    },
    softReset(context: ActionContext<SplitsState, RootState>) {
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
    },
    hardReset(context: ActionContext<SplitsState, RootState>) {
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
    },
};

const module: Module<SplitsState, any> = {
    namespaced: true,
    state,
    mutations,
    actions
};

export default module;
