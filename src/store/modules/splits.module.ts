import { Injector } from 'lightweight-di';
import { ActionContext, Module } from 'vuex';

import { ELECTRON_INTERFACE_TOKEN } from '../../common/interfaces/electron';
import { Segment, getFinalTime, TimingMethod, SegmentTime } from '../../common/interfaces/segment';
import { TimerStatus } from '../../common/timer-status';
import { now } from '../../utils/time';
import { RootState } from '../states/root.state';
import { SplitsState } from '../states/splits.state';
import { MUTATION_SET_STATUS } from './timer.module';

export const MODULE_PATH = 'splitterino/splits';

export const ID_GETTER_PREVIOUS_SEGMENT = 'previousSegment';
export const ID_GETTER_CURRENT_SEGMENT = 'currentSegment';
export const ID_GETTER_NEXT_SEGMENT = 'nextSegment';
export const ID_GETTER_HAS_NEW_OVERALL_BEST = 'hasNewOverallBest';

export const ID_MUTATION_SET_CURRENT = 'setCurrent';
export const ID_MUTATION_SET_TIMING = 'setTiming';
export const ID_MUTATION_CLEAR_SEGMENTS = 'clearSegments';
export const ID_MUTATION_REMOVE_SEGMENT = 'removeSegment';
export const ID_MUTATION_ADD_SEGMENT = 'addSegment';
export const ID_MUTATION_SET_ALL_SEGMENTS = 'setAllSegments';
export const ID_MUTATION_SET_SEGMENT = 'setSegment';
export const ID_MUTATION_SET_PREVIOUS_SEGMENTS_TOTAL_TIME = 'previousSegmentsTotalTime';
export const ID_MUTATION_SET_CURRENT_OPEN_FILE = 'setCurrentOpenFile';
export const ID_MUTATION_DISCARDING_RESET = 'discardingReset';
export const ID_MUTATION_SAVING_RESET = 'savingReset';

export const ID_ACTION_START = 'start';
export const ID_ACTION_SPLIT = 'split';
export const ID_ACTION_SKIP = 'skip';
export const ID_ACTION_UNDO = 'undo';
export const ID_ACTION_PAUSE = 'pause';
export const ID_ACTION_UNPAUSE = 'unpause';
export const ID_ACTION_RESET = 'reset';
export const ID_ACTION_DISCARDING_RESET = 'discardingReset';
export const ID_ACTION_SAVING_RESET = 'savingReset';
export const ID_ACTION_SET_SEGMENTS = 'setSegments';
export const ID_ACTION_SET_CURRENT_OPEN_FILE = 'setCurrentOpenFile';

export const GETTER_PREVIOUS_SEGMENT = `${MODULE_PATH}/${ID_GETTER_PREVIOUS_SEGMENT}`;
export const GETTER_CURRENT_SEGMENT = `${MODULE_PATH}/${ID_GETTER_CURRENT_SEGMENT}`;
export const GETTER_NEXT_SEGMENT = `${MODULE_PATH}/${ID_GETTER_NEXT_SEGMENT}`;
export const GETTER_HAS_NEW_OVERALL_BEST = `${MODULE_PATH}/${ID_GETTER_HAS_NEW_OVERALL_BEST}`;

export const MUTATION_SET_CURRENT = `${MODULE_PATH}/${ID_MUTATION_SET_CURRENT}`;
export const MUTATION_SET_TIMING = `${MODULE_PATH}/${ID_MUTATION_SET_TIMING}`;
export const MUTATION_CLEAR_SEGMENTS = `${MODULE_PATH}/${ID_MUTATION_CLEAR_SEGMENTS}`;
export const MUTATION_REMOVE_SEGMENT = `${MODULE_PATH}/${ID_MUTATION_REMOVE_SEGMENT}`;
export const MUTATION_ADD_SEGMENT = `${MODULE_PATH}/${ID_MUTATION_ADD_SEGMENT}`;
export const MUTATION_SET_ALL_SEGMENTS = `${MODULE_PATH}/${ID_MUTATION_SET_ALL_SEGMENTS}`;
export const MUTATION_SET_SEGMENT = `${MODULE_PATH}/${ID_MUTATION_SET_SEGMENT}`;
export const MUTATION_SET_PREVIOUS_SEGMENTS_TOTAL_TIME =
    `${MODULE_PATH}/${ID_MUTATION_SET_PREVIOUS_SEGMENTS_TOTAL_TIME}`;
export const MUTATION_SET_CURRENT_OPEN_FILE = `${MODULE_PATH}/${ID_MUTATION_SET_CURRENT_OPEN_FILE}`;
export const MUTATION_DISCARDING_RESET = `${MODULE_PATH}/${ID_MUTATION_DISCARDING_RESET}`;
export const MUTATION_SAVING_RESET = `${MODULE_PATH}/${ID_MUTATION_SAVING_RESET}`;

export const ACTION_START = `${MODULE_PATH}/${ID_ACTION_START}`;
export const ACTION_SPLIT = `${MODULE_PATH}/${ID_ACTION_SPLIT}`;
export const ACTION_SKIP = `${MODULE_PATH}/${ID_ACTION_SKIP}`;
export const ACTION_UNDO = `${MODULE_PATH}/${ID_ACTION_UNDO}`;
export const ACTION_PAUSE = `${MODULE_PATH}/${ID_ACTION_PAUSE}`;
export const ACTION_UNPAUSE = `${MODULE_PATH}/${ID_ACTION_UNPAUSE}`;
export const ACTION_RESET = `${MODULE_PATH}/${ID_ACTION_RESET}`;
export const ACTION_DISCARDING_RESET = `${MODULE_PATH}/${ID_ACTION_DISCARDING_RESET}`;
export const ACTION_SAVING_RESET = `${MODULE_PATH}/${ID_ACTION_SAVING_RESET}`;
export const ACTION_SET_SEGMENTS = `${MODULE_PATH}/${ID_ACTION_SET_SEGMENTS}`;
export const ACTION_SET_CURRENT_OPEN_FILE = `${MODULE_PATH}/${ID_ACTION_SET_CURRENT_OPEN_FILE}`;

export interface PauseOptions {
    igtOnly: boolean;
}

function resetSegment(segment: Segment): Segment {
    return {
        ...segment,
        hasNewOverallBest: false,
        previousOverallBest: null,
        currentTime: null,
        startTime: -1,
        skipped: false,
        passed: false,
    };
}

export function getSplitsStoreModule(injector: Injector): Module<SplitsState, RootState> {
    const electron = injector.get(ELECTRON_INTERFACE_TOKEN);

    return {
        namespaced: true,
        state: {
            current: -1,
            segments: [],
            timing: TimingMethod.RTA,
            currentOpenFile: null,
            previousRTATotal: -1,
            previousIGTTotal: -1,
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
            [ID_MUTATION_SET_TIMING](state: SplitsState, timing: TimingMethod) {
                // Be sure that the timing is valid
                switch (timing) {
                    case TimingMethod.RTA:
                    case TimingMethod.IGT:
                        state.timing = timing;
                }
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
            [ID_MUTATION_CLEAR_SEGMENTS](state: SplitsState) {
                /*
                if (state.status !== TimerStatus.STOPPED) {
                    return;
                }
                */

                state.segments = [];
            },
            [ID_MUTATION_SET_PREVIOUS_SEGMENTS_TOTAL_TIME](state: SplitsState, newTime: number) {
                if (!isFinite(newTime) || isNaN(newTime)) {
                    newTime = 0;
                }
                state.previousRTATotal = newTime;
            },
            [ID_MUTATION_SET_CURRENT_OPEN_FILE](state: SplitsState, filePath: string) {
                state.currentOpenFile = filePath;
            },
            [ID_MUTATION_DISCARDING_RESET](state: SplitsState) {
                state.segments = state.segments.map(resetSegment);
            },
            [ID_MUTATION_SAVING_RESET](state: SplitsState, isNewPersonalBest: boolean = false) {
                let newRTATotal = 0;
                let newIGTTotal = 0;

                state.segments = state.segments.map(segment => {
                    const newSegment = resetSegment(segment);

                    if (segment.passed) {
                        newRTATotal += getFinalTime(segment.currentTime.rta);
                        newIGTTotal += getFinalTime(segment.currentTime.igt);
                    }
                    if (isNewPersonalBest) {
                        newSegment.personalBest = segment.currentTime;
                    }
                    if (segment.hasNewOverallBest) {
                        newSegment.overallBest = segment.previousOverallBest;
                    }

                    return newSegment;
                });

                if (isNewPersonalBest) {
                    state.previousRTATotal = newRTATotal;
                }
            },
        },
        actions: {
            [ID_ACTION_START](context: ActionContext<SplitsState, RootState>): Promise<boolean> {
                const time = now();
                const status = context.rootState.splitterino.timer.status;

                if (status !== TimerStatus.STOPPED || context.state.segments.length < 1) {
                    return Promise.resolve(false);
                }

                context.commit(
                    MUTATION_SET_STATUS,
                    { time, status: TimerStatus.RUNNING },
                    { root: true }
                );

                let totalRTATime = 0;
                let totalIGTTime = 0;

                context.state.segments.forEach(segment => {
                    if (segment.passed) {
                        totalRTATime += getFinalTime(segment.personalBest.rta);
                        totalIGTTime += getFinalTime(segment.personalBest.igt);
                    }
                });

                context.commit(ID_MUTATION_SET_PREVIOUS_SEGMENTS_TOTAL_TIME, totalRTATime);

                const firstSegment = context.state.segments[0];

                context.commit(ID_MUTATION_SET_SEGMENT, {
                    index: 0,
                    segment: {
                        ...firstSegment,
                        startTime: time
                    }
                });
                context.commit(ID_MUTATION_SET_CURRENT, 0);

                return Promise.resolve(true);
            },
            [ID_ACTION_SPLIT](context: ActionContext<SplitsState, RootState>) {
                const currentTime = now();

                const { status, igtPauseTotal, pauseTotal } = context.rootState.splitterino.timer;
                switch (status) {
                    case TimerStatus.FINISHED:
                        // Cleanup via reset
                        context.dispatch(ID_ACTION_RESET);

                        return;
                    case TimerStatus.RUNNING:
                        break;
                    default:
                        // Ignore the split-event when it's not running
                        return;
                }

                const { current: currentIndex, timing } = context.state;

                // Get the segment and spread it to create a copy to be able
                // to modify it.
                const currentSegment: Segment = {
                    ...context.state.segments[currentIndex]
                };
                const rawTime = currentTime - currentSegment.startTime;
                const newTime: SegmentTime = {
                    igt: {
                        rawTime,
                        pauseTime: igtPauseTotal,
                    },
                    rta: {
                        rawTime,
                        pauseTime: pauseTotal,
                    },
                };

                currentSegment.passed = true;
                currentSegment.skipped = false;
                currentSegment.currentTime = newTime;

                if (
                    currentSegment.overallBest == null ||
                    currentSegment.overallBest[timing] == null ||
                    getFinalTime(currentSegment.overallBest[timing]) > getFinalTime(newTime[timing])
                ) {
                    // Backup of the previous time to be able to revert it
                    currentSegment.previousOverallBest = currentSegment.overallBest;
                    currentSegment.overallBest = newTime;
                    currentSegment.hasNewOverallBest = true;
                } else {
                    currentSegment.hasNewOverallBest = false;
                    currentSegment.previousOverallBest = null;
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
                    currentTime: null,
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
                const status = context.rootState.splitterino.timer.status;
                const index = context.state.current;

                if (
                    status !== TimerStatus.RUNNING ||
                    index >= context.state.segments.length - 1
                ) {
                    return false;
                }

                const segment: Segment = {
                    ...context.state.segments[index],
                    currentTime: null,
                    skipped: true,
                    passed: false
                };

                context.commit(ID_MUTATION_SET_SEGMENT, { index, segment });
                context.commit(ID_MUTATION_SET_CURRENT, index + 1);

                return true;
            },
            [ID_ACTION_UNDO](context: ActionContext<SplitsState, RootState>) {
                const status = context.rootState.splitterino.timer.status;
                const index = context.state.current;

                if (status !== TimerStatus.RUNNING || index < 1) {
                    return false;
                }

                const segment: Segment = {
                    ...context.state.segments[index],
                    startTime: -1,
                    currentTime: null,
                    passed: false,
                    skipped: false
                };

                // Revert OB
                if (segment.hasNewOverallBest) {
                    segment.overallBest = segment.previousOverallBest;
                    segment.hasNewOverallBest = false;
                }
                segment.previousOverallBest = null;

                const previous: Segment = {
                    ...context.state.segments[index - 1],
                    currentTime: null,
                    passed: false,
                    skipped: false,
                };

                if (!previous.passed || previous.currentTime == null) {
                    previous.currentTime = segment.currentTime;
                } else {
                    Object.keys(TimingMethod).forEach(timing => {
                        if (previous.currentTime[timing] == null) {
                            previous.currentTime[timing] = segment.currentTime[timing];
                        } else {
                            previous.currentTime[timing].pauseTime += segment.currentTime[timing].pauseTime;
                        }
                        segment.currentTime[timing] = null;
                    });
                }

                context.commit(ID_MUTATION_SET_SEGMENT, { index, segment });
                context.commit(ID_MUTATION_SET_SEGMENT, { index: index - 1, segment: previous });
                context.commit(ID_MUTATION_SET_CURRENT, index - 1);

                return true;
            },
            [ID_ACTION_PAUSE](context: ActionContext<SplitsState, RootState>, payload: PauseOptions) {
                const time = now();
                const status = context.rootState.splitterino.timer.status;
                if (status !== TimerStatus.RUNNING) {
                    return false;
                }

                let toStatus = TimerStatus.PAUSED;
                if (payload.igtOnly) {
                    toStatus = TimerStatus.RUNNING_IGT_PAUSE;
                }

                context.commit(
                    MUTATION_SET_STATUS,
                    { time, status: toStatus },
                    { root: true }
                );

                return true;
            },
            [ID_ACTION_UNPAUSE](context: ActionContext<SplitsState, RootState>, payload: PauseOptions) {
                const time = now();
                const status = context.rootState.splitterino.timer.status;
                const igtOnly = payload.igtOnly;

                if (status !== TimerStatus.PAUSED && (igtOnly && status !== TimerStatus.RUNNING_IGT_PAUSE)) {
                    return;
                }

                const index = context.state.current;
                // Create a copy of the segment so it can be safely edited
                const segment: Segment = { ...context.state.segments[index] };

                if (!igtOnly) {
                    const pauseAddition = time - context.rootState.splitterino.timer.pauseTime;
                    segment.currentTime.rta.pauseTime += pauseAddition;
                }

                const igtPauseAddition = time - context.rootState.splitterino.timer.igtPauseTime;
                segment.currentTime.igt.pauseTime += igtPauseAddition;

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

                const previousRTAPB = Math.max(0, context.state.previousRTATotal);
                const previousIGTPB = Math.max(0, context.state.previousIGTTotal);
                let totalRTATime = 0;
                let totalIGTTime = 0;

                context.state.segments.forEach(segment => {
                    if (segment.passed) {
                        totalRTATime += getFinalTime(segment.currentTime.rta);
                        totalIGTTime += getFinalTime(segment.currentTime.igt);
                    }
                });

                const isNewRTAPB = previousRTAPB === 0 || totalRTATime < previousRTAPB;
                const isNewIGTPB = previousIGTPB === 0 || totalIGTTime < previousIGTPB;
                const isNewPersonalBest = context.state.timing === TimingMethod.RTA ? isNewRTAPB : isNewIGTPB;

                // if the time is a new PB or the splits should get saved as
                // the status is finished.
                if (!isNewPersonalBest || status === TimerStatus.FINISHED) {
                    context.dispatch(ID_ACTION_SAVING_RESET, isNewPersonalBest);

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
                            return context.dispatch(ID_ACTION_DISCARDING_RESET);
                        case 2:
                            return context.dispatch(ID_ACTION_SAVING_RESET, isNewPersonalBest);
                    }
                });
            },
            [ID_ACTION_DISCARDING_RESET](context: ActionContext<SplitsState, RootState>) {
                context.commit(MUTATION_SET_STATUS, TimerStatus.STOPPED, {
                    root: true
                });
                context.commit(ID_MUTATION_SET_CURRENT, -1);
                context.commit(ID_MUTATION_DISCARDING_RESET);
            },
            [ID_ACTION_SAVING_RESET](
                context: ActionContext<SplitsState, RootState>,
                isNewPersonalBest: boolean = false
            ) {
                context.commit(MUTATION_SET_STATUS, TimerStatus.STOPPED, {
                    root: true
                });
                context.commit(ID_MUTATION_SET_CURRENT, -1);
                context.commit(ID_MUTATION_SAVING_RESET, isNewPersonalBest);
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
            [ID_ACTION_SET_CURRENT_OPEN_FILE](
                context: ActionContext<SplitsState, RootState>,
                filePath: string
            ) {
                context.commit('setCurrentOpenFile', filePath);
            }
        }
    };
}
