import now from 'performance-now';
import { ActionContext, ActionTree, Module, GetterTree } from 'vuex';
import { dialog, BrowserWindow } from 'electron';

import { Segment } from '../../common/segment';
import { TimerStatus } from '../../common/timer-status';
import { SplitsState } from '../states/splits';
import { RootState } from '../states/root';

const state: SplitsState = {
    current: -1,
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

const getters: GetterTree<SplitsState, RootState> = {
    previousSegment(state: SplitsState) {
        const index = state.current;
        return index > 0 ? state.segments[index - 1] : null;
    },
    currentSegment(state: SplitsState) {
        const index = state.current;
        return index > -1 ? state.segments[index] : null;
    },
    nextSegment(state: SplitsState) {
        const index = state.current;
        return index > -1 && index + 1 <= state.segments.length
            ? state.segments[index + 1]
            : null;
    },
    /**
     * If there's a new personal best
     */
    hasNewPersonalBest(state: SplitsState) {
        for (const segment of state.segments) {
            if (segment.hasNewPersonalBest) {
                return true;
            }
        }
        return false;
    },
    /**
     * If there's a new overall best
     */
    hasNewOverallBest(state: SplitsState) {
        for (const segment of state.segments) {
            if (segment.hasNewOverallBest) {
                return true;
            }
        }
        return false;
    }
};

const mutations = {
    clearSegments(state: SplitsState) {
        /*
        if (state.status !== TimerStatus.STOPPED) {
            return;
        }
        */

        state.segments = [];
    },
    removeSegment(state: SplitsState, index: number) {
        /*
        if (state.status !== TimerStatus.STOPPED) {
            return;
        }
        */

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
        /*
        if (state.status !== TimerStatus.STOPPED) {
            return;
        }
        */

        if (segment == null || typeof segment !== 'object') {
            return;
        }

        if (!segment.hasOwnProperty('name')) {
            return;
        }

        state.segments.push(segment);
    },
    setAllSegments(state: SplitsState, segments: Segment[]) {
        /*
        if (state.status !== TimerStatus.STOPPED) {
            return;
        }
        */

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
    }
};

const actions: ActionTree<SplitsState, RootState> = {
    start(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState.splitterino.timer.status;

        if (status !== TimerStatus.STOPPED) {
            return;
        }

        context.commit(
            'splitterino/timer/setStatus',
            { time, status: TimerStatus.RUNNING },
            { root: true }
        );

        const firstSegment = context.state.segments[0];

        context.commit('setSegment', {
            index: 0,
            segment: {
                ...firstSegment,
                startTime: time
            } as Segment
        });
        context.commit('setCurrent', 0);
    },
    split(context: ActionContext<SplitsState, RootState>) {
        const currentTime = now();

        const status = context.rootState.splitterino.timer.status;
        switch (status) {
            case TimerStatus.FINISHED:
                // Cleanup via reset
                context.dispatch('softReset');
                return;
            case TimerStatus.RUNNING:
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
            currentTime -
            currentSegment.startTime -
            (currentSegment.pauseTime || 0);

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
                TimerStatus.FINISHED,
                { root: true }
            );
            return;
        }

        const next: Segment = {
            ...context.state.segments[currentIndex + 1],
            startTime: currentTime,
            time: 0,
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
        const status = context.rootState.splitterino.timer.status;
        const index = context.state.current;

        if (
            status !== TimerStatus.RUNNING ||
            index >= context.state.segments.length
        ) {
            return;
        }

        const segment: Segment = {
            ...context.state.segments[index],
            time: 0,
            startTime: 0,
            skipped: true,
            passed: false
        };

        const next: Segment = {
            ...context.state.segments[index + 1],
            startTime: time
        };

        context.commit('setSegment', { index, segment });
        context.commit('setSegment', { index: index + 1, segment: next });
        context.commit('setCurrent', index + 1);
    },
    undo(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState.splitterino.timer.status;
        const index = context.state.current;

        if (status !== TimerStatus.RUNNING || index < 1) {
            return;
        }

        const segment: Segment = {
            ...context.state.segments[index],
            startTime: 0,
            time: 0,
            passed: false,
            skipped: false
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
        const status = context.rootState.splitterino.timer.status;
        if (status !== TimerStatus.RUNNING) {
            return;
        }

        context.commit(
            'splitterino/timer/setStatus',
            { time, status: TimerStatus.PAUSED },
            { root: true }
        );
    },
    unpause(context: ActionContext<SplitsState, RootState>) {
        const time = now();
        const status = context.rootState.splitterino.timer.status;

        if (status !== TimerStatus.PAUSED) {
            return;
        }

        const pauseAddition =
            time - context.rootState.splitterino.timer.pauseTime;
        const index = context.state.current;
        const segment: Segment = { ...context.state.segments[index] };
        segment.pauseTime += pauseAddition;

        context.commit('setSegment', { index, segment });
        context.commit(
            'splitterino/timer/setStatus',
            {
                time,
                status: TimerStatus.RUNNING
            },
            { root: true }
        );
    },
    reset(context: ActionContext<SplitsState, RootState>, payload) {
        const time = now();
        const status = context.rootState.splitterino.timer.status;
        console.log(payload);

        if (status === TimerStatus.STOPPED) {
            return;
        }

        if (
            (context.getters.hasNewOverallBest ||
                context.getters.hasNewPersonalBest) &&
            status !== TimerStatus.FINISHED
        ) {
            return new Promise<number>((resolve, reject) => {
                dialog.showMessageBox(
                    BrowserWindow.fromId(payload.windowId),
                    {
                        title: 'Save Splits?',
                        message: `You're about to reset the timer, but you got some new best times!\nDo you wish to save or discard the times?`,
                        buttons: ['Cancel', 'Discard', 'Save']
                    },
                    responseCode => {
                        resolve(responseCode);
                    }
                );
            }).then(res => {
                switch (res) {
                    case 0:
                        break;
                    case 1:
                        return context.dispatch('hardReset');
                    case 2:
                        return context.dispatch('softReset');
                }
            });
        }

        context.dispatch('hardReset');
    },
    softReset(context: ActionContext<SplitsState, RootState>) {
        context.commit('splitterino/timer/setStatus', TimerStatus.STOPPED, {
            root: true
        });
        context.commit('setCurrent', -1);
        // Create a copy of the segments and then map them
        const segments = context.state.segments.slice(0).map(segment => ({
            ...segment,
            hasNewOverallBest: false,
            hasNewPersonalBest: false,
            previousOverallBest: -1,
            previousPersonalBest: -1,
            startTime: -1,
            skipped: false,
            passed: false
        }));
        context.commit('setAllSegments', segments);
    },
    hardReset(context: ActionContext<SplitsState, RootState>) {
        context.commit('splitterino/timer/setStatus', TimerStatus.STOPPED, {
            root: true
        });
        context.commit('setCurrent', -1);
        // Create a copy of the segments and then map them
        const segments = context.state.segments.slice(0).map(segment => {
            if (segment.hasNewPersonalBest) {
                segment.personalBest = segment.previousPersonalBest;
            }
            segment.hasNewPersonalBest = false;
            if (segment.hasNewOverallBest) {
                segment.overallBest = segment.previousOverallBest;
            }
            segment.hasNewOverallBest = false;
            segment.previousOverallBest = 0;
            segment.previousPersonalBest = 0;
            segment.startTime = 0;
            segment.skipped = false;
            segment.passed = false;

            return segment;
        });
        context.commit('setAllSegments', segments);
        /*
        this.currentSegment = 0;
        this.state = TimerStatus.STOPPED;
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
        */
    }
};

const module: Module<SplitsState, any> = {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
};

export default module;
