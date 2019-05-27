import { Injector } from 'lightweight-di';
import { ActionContext, Module } from 'vuex';

import { ELECTRON_INTERFACE_TOKEN } from '../../common/interfaces/electron-interface';
import { Segment } from '../../common/interfaces/segment';
import { TimerStatus } from '../../common/timer-status';
import { now } from '../../utils/time';
import { RootState } from '../states/root.state';
import { SplitsState } from '../states/splits.state';
import { MUTATION_SET_STATUS } from './timer.module';

export const MODULE_PATH = 'splitterino/splits';

export const ID_GETTER_PREVIOUS_SEGMENT = 'previousSegment';
export const ID_GETTER_CURRENT_SEGMENT = 'currentSegment';
export const ID_GETTER_NEXT_SEGMENT = 'nextSegment';
export const ID_GETTER_HAS_NEW_PERSONAL_BEST = 'hasNewPersonalBest';
export const ID_GETTER_HAS_NEW_OVERALL_BEST = 'hasNewOverallBest';

export const ID_MUTATION_CLEAR_SEGMENTS = 'clearSegments';
export const ID_MUTATION_REMOVE_SEGMENT = 'removeSegment';
export const ID_MUTATION_ADD_SEGMENT = 'addSegment';
export const ID_MUTATION_SET_ALL_SEGMENTS = 'setAllSegments';
export const ID_MUTATION_SET_SEGMENT = 'setSegment';
export const ID_MUTATION_SET_CURRENT = 'setCurrent';
export const ID_MUTATION_SOFT_RESET = 'softReset';
export const ID_MUTATION_HARD_RESET = 'hardReset';

export const ID_ACTION_START = 'start';
export const ID_ACTION_SPLIT = 'split';
export const ID_ACTION_SKIP = 'skip';
export const ID_ACTION_UNDO = 'undo';
export const ID_ACTION_PAUSE = 'pause';
export const ID_ACTION_UNPAUSE = 'unpause';
export const ID_ACTION_RESET = 'reset';
export const ID_ACTION_SOFT_RESET = 'softReset';
export const ID_ACTION_HARD_RESET = 'hardReset';
export const ID_ACTION_SET_SEGMENTS = 'setSegments';

export const GETTER_PREVIOUS_SEGMENT = `${MODULE_PATH}/${ID_GETTER_PREVIOUS_SEGMENT}`;
export const GETTER_CURRENT_SEGMENT = `${MODULE_PATH}/${ID_GETTER_CURRENT_SEGMENT}`;
export const GETTER_NEXT_SEGMENT = `${MODULE_PATH}/${ID_GETTER_NEXT_SEGMENT}`;
export const GETTER_HAS_NEW_PERSONAL_BEST = `${MODULE_PATH}/${ID_GETTER_HAS_NEW_PERSONAL_BEST}`;
export const GETTER_HAS_NEW_OVERALL_BEST = `${MODULE_PATH}/${ID_GETTER_HAS_NEW_OVERALL_BEST}`;

export const MUTATION_CLEAR_SEGMENTS = `${MODULE_PATH}/${ID_MUTATION_CLEAR_SEGMENTS}`;
export const MUTATION_REMOVE_SEGMENT = `${MODULE_PATH}/${ID_MUTATION_REMOVE_SEGMENT}`;
export const MUTATION_ADD_SEGMENT = `${MODULE_PATH}/${ID_MUTATION_ADD_SEGMENT}`;
export const MUTATION_SET_ALL_SEGMENTS = `${MODULE_PATH}/${ID_MUTATION_SET_ALL_SEGMENTS}`;
export const MUTATION_SET_SEGMENT = `${MODULE_PATH}/${ID_MUTATION_SET_SEGMENT}`;
export const MUTATION_SET_CURRENT = `${MODULE_PATH}/${ID_MUTATION_SET_CURRENT}`;
export const MUTATION_SOFT_RESET = `${MODULE_PATH}/${ID_MUTATION_SOFT_RESET}`;
export const MUTATION_HARD_RESET = `${MODULE_PATH}/${ID_MUTATION_HARD_RESET}`;

export const ACTION_START = `${MODULE_PATH}/${ID_ACTION_START}`;
export const ACTION_SPLIT = `${MODULE_PATH}/${ID_ACTION_SPLIT}`;
export const ACTION_SKIP = `${MODULE_PATH}/${ID_ACTION_SKIP}`;
export const ACTION_UNDO = `${MODULE_PATH}/${ID_ACTION_UNDO}`;
export const ACTION_PAUSE = `${MODULE_PATH}/${ID_ACTION_PAUSE}`;
export const ACTION_UNPAUSE = `${MODULE_PATH}/${ID_ACTION_UNPAUSE}`;
export const ACTION_RESET = `${MODULE_PATH}/${ID_ACTION_RESET}`;
export const ACTION_SOFT_RESET = `${MODULE_PATH}/${ID_ACTION_SOFT_RESET}`;
export const ACTION_HARD_RESET = `${MODULE_PATH}/${ID_ACTION_HARD_RESET}`;
export const ACTION_SET_SEGMENTS = `${MODULE_PATH}/${ID_ACTION_SET_SEGMENTS}`;

export function getSplitsStoreModule(injector: Injector): Module<SplitsState, RootState> {
    const electron = injector.get(ELECTRON_INTERFACE_TOKEN);

    return {
        namespaced: true,
        state: {
            current: -1,
            segments: [],
            currentOpenFile: null
        },
        getters: {
            [ID_GETTER_PREVIOUS_SEGMENT](state: SplitsState) {
                const index = state.current;

                return index > 0 ? state.segments[index - 1] : null;
            },
            [ID_GETTER_CURRENT_SEGMENT](state: SplitsState) {
                const index = state.current;

                return index > -1 ? state.segments[index] : null;
            },
            [ID_GETTER_NEXT_SEGMENT](state: SplitsState) {
                const index = state.current;

                return index > -1 && index + 1 <= state.segments.length
                    ? state.segments[index + 1]
                    : null;
            },
            /**
             * If there's a new personal best
             */
            [ID_GETTER_HAS_NEW_PERSONAL_BEST](state: SplitsState) {
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
            [ID_GETTER_HAS_NEW_OVERALL_BEST](state: SplitsState) {
                for (const segment of state.segments) {
                    if (segment.hasNewOverallBest) {
                        return true;
                    }
                }

                return false;
            }
        },
        mutations: {
            [ID_MUTATION_CLEAR_SEGMENTS](state: SplitsState) {
                /*
                if (state.status !== TimerStatus.STOPPED) {
                    return;
                }
                */

                state.segments = [];
            },
            [ID_MUTATION_REMOVE_SEGMENT](state: SplitsState, index: number) {
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
            [ID_MUTATION_ADD_SEGMENT](state: SplitsState, segment: Segment) {
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
            [ID_MUTATION_SET_ALL_SEGMENTS](state: SplitsState, segments: Segment[]) {
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
            [ID_MUTATION_SET_SEGMENT](
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
            [ID_MUTATION_SET_CURRENT](state: SplitsState, index: number) {
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
            [ID_MUTATION_SOFT_RESET](state: SplitsState) {
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
            [ID_MUTATION_HARD_RESET](state: SplitsState) {
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
            },
            setCurrentOpenFile(state: SplitsState, filePath: string) {
                state.currentOpenFile = filePath;
            }
        },
        actions: {
            [ID_ACTION_START](context: ActionContext<SplitsState, RootState>) {
                const time = now();
                const status = context.rootState.splitterino.timer.status;

                if (status !== TimerStatus.STOPPED) {
                    return;
                }

                context.commit(
                    MUTATION_SET_STATUS,
                    { time, status: TimerStatus.RUNNING },
                    { root: true }
                );

                const firstSegment = context.state.segments[0];

                context.commit(ID_MUTATION_SET_SEGMENT, {
                    index: 0,
                    segment: {
                        ...firstSegment,
                        startTime: time
                    }
                });
                context.commit(ID_MUTATION_SET_CURRENT, 0);
            },
            [ID_ACTION_SPLIT](context: ActionContext<SplitsState, RootState>) {
                const currentTime = now();

                const status = context.rootState.splitterino.timer.status;
                switch (status) {
                    case TimerStatus.FINISHED:
                        // Cleanup via reset
                        context.dispatch(ID_ACTION_SOFT_RESET);

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

                context.commit(ID_MUTATION_SET_SEGMENT, {
                    index: currentIndex,
                    segment: currentSegment
                });

                // Check if it is the last split
                if (currentIndex + 1 >= context.state.segments.length) {
                    context.commit(
                        MUTATION_SET_STATUS,
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

                context.commit(ID_MUTATION_SET_SEGMENT, {
                    index: currentIndex + 1,
                    segment: next
                });
                context.commit(ID_MUTATION_SET_CURRENT, currentIndex + 1);
            },
            [ID_ACTION_SKIP](context: ActionContext<SplitsState, RootState>) {
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

                context.commit(ID_MUTATION_SET_SEGMENT, { index, segment });
                context.commit(ID_MUTATION_SET_SEGMENT, { index: index + 1, segment: next });
                context.commit(ID_MUTATION_SET_CURRENT, index + 1);
            },
            [ID_ACTION_UNDO](context: ActionContext<SplitsState, RootState>) {
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

                context.commit(ID_MUTATION_SET_SEGMENT, { index, segment });
                context.commit(ID_MUTATION_SET_SEGMENT, { index: index - 1, segment: previous });
                context.commit(ID_MUTATION_SET_CURRENT, index - 1);
            },
            [ID_ACTION_PAUSE](context: ActionContext<SplitsState, RootState>) {
                const time = now();
                const status = context.rootState.splitterino.timer.status;
                if (status !== TimerStatus.RUNNING) {
                    return;
                }

                context.commit(
                    MUTATION_SET_STATUS,
                    { time, status: TimerStatus.PAUSED },
                    { root: true }
                );
            },
            [ID_ACTION_UNPAUSE](context: ActionContext<SplitsState, RootState>) {
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

                context.commit(ID_MUTATION_SET_SEGMENT, { index, segment });
                context.commit(
                    MUTATION_SET_STATUS,
                    {
                        time,
                        status: TimerStatus.RUNNING
                    },
                    { root: true }
                );
            },
            async [ID_ACTION_RESET](
                context: ActionContext<SplitsState, RootState>,
                payload: { [key: string]: any }
            ) {
                const status = context.rootState.splitterino.timer.status;

                // When the Timer is already stopped, nothing to do
                if (status === TimerStatus.STOPPED) {
                    return Promise.resolve();
                }

                // If there're no new best-times or it's already finished, we can
                // safely reset it (hard-reset).
                if (
                    !(context.getters.hasNewOverallBest ||
                        context.getters.hasNewPersonalBest) ||
                    status === TimerStatus.FINISHED
                ) {
                    context.dispatch(ID_ACTION_HARD_RESET);

                    return Promise.resolve();
                }

                let win = null;
                const id: number = (payload || {}).windowId;

                if (typeof id === 'number' && !isNaN(id) && isFinite(id)) {
                    win = electron.getWindowById(id);
                }

                return electron.showMessageDialog(
                    win,
                    {
                        title: 'Save Splits?',
                        message: `
    You're about to reset the timer, but you got some new best times!\n
    Do you wish to save or discard the times?
    `,
                        buttons: ['Cancel', 'Discard', 'Save']
                    }
                ).then(async res => {
                    switch (res) {
                        case 0:
                            return Promise.resolve();
                        case 1:
                            return context.dispatch(ID_ACTION_HARD_RESET);
                        case 2:
                            return context.dispatch(ID_ACTION_SOFT_RESET);
                    }
                });
            },
            [ID_ACTION_SOFT_RESET](context: ActionContext<SplitsState, RootState>) {
                context.commit(MUTATION_SET_STATUS, TimerStatus.STOPPED, {
                    root: true
                });
                context.commit(ID_MUTATION_SET_CURRENT, -1);
                context.commit(ID_MUTATION_SOFT_RESET);
            },
            [ID_ACTION_HARD_RESET](context: ActionContext<SplitsState, RootState>) {
                context.commit(MUTATION_SET_STATUS, TimerStatus.STOPPED, {
                    root: true
                });
                context.commit(ID_MUTATION_SET_CURRENT, -1);
                context.commit(ID_MUTATION_HARD_RESET);
            },
            [ID_ACTION_SET_SEGMENTS](
                context: ActionContext<SplitsState, RootState>,
                payload: Segment[]
            ) {
                if (!Array.isArray(payload)) {
                    throw new Error('Payload has to be an array! ' + JSON.stringify(payload));
                }

                const status = context.rootState.splitterino.timer.status;
                if (status !== TimerStatus.STOPPED) {
                    return false;
                }

                context.commit(ID_MUTATION_SET_ALL_SEGMENTS, payload);

                return true;
            },
            setCurrentOpenFile(
                context: ActionContext<SplitsState, RootState>,
                filePath: string
            ) {
                context.commit('setCurrentOpenFile', filePath);
            }
        }
    };
}
