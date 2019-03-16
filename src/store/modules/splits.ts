import { BrowserWindow, dialog } from 'electron';
import { ActionContext, ActionTree, GetterTree, Module } from 'vuex';

import { Segment } from '../../common/segment';
import { TimerStatus } from '../../common/timer-status';
import { now } from '../../utils/now';
import { RootState } from '../states/root';
import { SplitsState } from '../states/splits';
import { v4 as uuid } from 'uuid';

const moduleState: SplitsState = {
    current: -1,
    segments: [
        {
            id: uuid(),
            // Name of the Segment
            name: '1st Split',
            // Personal Best time in ms
            personalBest: 1000,
            // Best Segment/Overall time in ms
            overallBest: 750
        },
        {
            id: uuid(),
            name: '2nd Split'
        },
        {
            id: uuid(),
            name: '3rd Split'
        },
        {
            id: uuid(),
            name: '4th Split'
        },
        {
            id: uuid(),
            name: '5th Split'
        },
        {
            id: uuid(),
            name: '6th Split'
        },
        {
            id: uuid(),
            name: '7h Split'
        },
        {
            id: uuid(),
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

        state.segments[index] = { ...state.segments[index], ...segment };
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
    softReset(state: SplitsState) {
        state.segments = state.segments.map(segment => ({
            ...segment,
            hasNewOverallBest: false,
            hasNewPersonalBest: false,
            previousOverallBest: -1,
            previousPersonalBest: -1,
            startTime: -1,
            skipped: false,
            passed: false
        }));
    },
    hardReset(state: SplitsState) {
        state.segments = state.segments.map(segment => {
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
            }
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
            segment.previousPersonalBest = -1;
            segment.hasNewPersonalBest = false;
        }

        // Revert OB
        if (segment.hasNewOverallBest) {
            segment.overallBest = segment.previousOverallBest;
            segment.previousOverallBest = -1;
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
    async reset(
        context: ActionContext<SplitsState, RootState>,
        payload: { [key: string]: any }
    ) {
        const time = now();
        const status = context.rootState.splitterino.timer.status;

        if (status === TimerStatus.STOPPED) {
            return Promise.resolve();
        }

        if (
            (context.getters.hasNewOverallBest ||
                context.getters.hasNewPersonalBest) &&
            status !== TimerStatus.FINISHED
        ) {
            let win = null;
            const id: number = (payload || {}).windowId;
            if (typeof id === 'number' && !isNaN(id) && isFinite(id)) {
                win = BrowserWindow.fromId(id);
            }

            return new Promise<number>(resolve => {
                dialog.showMessageBox(
                    win,
                    {
                        title: 'Save Splits?',
                        message: `
You're about to reset the timer, but you got some new best times!\n
Do you wish to save or discard the times?
`,
                        buttons: ['Cancel', 'Discard', 'Save']
                    }, responseCode => {
                        resolve(responseCode);
                    }
                );
            }).then(async res => {
                switch (res) {
                    case 0:
                        return Promise.resolve();
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
        context.commit('softReset');
    },
    hardReset(context: ActionContext<SplitsState, RootState>) {
        context.commit('splitterino/timer/setStatus', TimerStatus.STOPPED, {
            root: true
        });
        context.commit('setCurrent', -1);
        context.commit('hardReset');
    },
    setSegments(
        context: ActionContext<SplitsState, RootState>,
        payload: Segment[]
    ) {
        if (!Array.isArray(payload)) {
            throw new Error('Payload has to be an array!');
        }

        const status = context.rootState.splitterino.timer.status;
        if (status !== TimerStatus.STOPPED) {
            return false;
        }

        context.commit('setAllSegments', payload);

        return true;
    },
};

export const splitsStoreModule: Module<SplitsState, any> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions
};
