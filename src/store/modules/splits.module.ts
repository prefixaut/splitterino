import { Injector } from 'lightweight-di';
import { ActionContext, Module } from 'vuex';

import { ELECTRON_INTERFACE_TOKEN } from '../../common/interfaces/electron';
import { Segment, SegmentTime, TimingMethod } from '../../common/interfaces/segment';
import { TimerStatus } from '../../common/timer-status';
import { asCleanNumber } from '../../utils/converters';
import { Logger } from '../../utils/logger';
import { now } from '../../utils/time';
import { RootState } from '../states/root.state';
import { SplitsState } from '../states/splits.state';
import { MUTATION_SET_STATUS } from './timer.module';
import { VALIDATOR_SERVICE_TOKEN } from '../../services/validator.service';

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
export const ID_MUTATION_SET_PREVIOUS_RTA_TIME = 'setPreviousRTATime';
export const ID_MUTATION_SET_PREVIOUS_IGT_TIME = 'setPreviousIGTTime';
export const ID_MUTATION_DISCARDING_RESET = 'discardingReset';
export const ID_MUTATION_SAVING_RESET = 'savingReset';

export const ID_ACTION_SET_TIMING = 'setTiming';
export const ID_ACTION_START = 'start';
export const ID_ACTION_SPLIT = 'split';
export const ID_ACTION_SKIP = 'skip';
export const ID_ACTION_UNDO = 'undo';
export const ID_ACTION_PAUSE = 'pause';
export const ID_ACTION_UNPAUSE = 'unpause';
export const ID_ACTION_RESET = 'reset';
export const ID_ACTION_DISCARDING_RESET = 'discardingReset';
export const ID_ACTION_SAVING_RESET = 'savingReset';
export const ID_ACTION_SET_ALL_SEGMENTS = 'setAllSegments';

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
export const MUTATION_SET_PREVIOUS_RTA_TIME = `${MODULE_PATH}/${ID_MUTATION_SET_PREVIOUS_RTA_TIME}`;
export const MUTATION_SET_PREVIOUS_IGT_TIME = `${MODULE_PATH}/${ID_MUTATION_SET_PREVIOUS_IGT_TIME}`;
export const MUTATION_DISCARDING_RESET = `${MODULE_PATH}/${ID_MUTATION_DISCARDING_RESET}`;
export const MUTATION_SAVING_RESET = `${MODULE_PATH}/${ID_MUTATION_SAVING_RESET}`;

export const ACTION_SET_TIMING = `${MODULE_PATH}/${ID_ACTION_SET_TIMING}`;
export const ACTION_START = `${MODULE_PATH}/${ID_ACTION_START}`;
export const ACTION_SPLIT = `${MODULE_PATH}/${ID_ACTION_SPLIT}`;
export const ACTION_SKIP = `${MODULE_PATH}/${ID_ACTION_SKIP}`;
export const ACTION_UNDO = `${MODULE_PATH}/${ID_ACTION_UNDO}`;
export const ACTION_PAUSE = `${MODULE_PATH}/${ID_ACTION_PAUSE}`;
export const ACTION_UNPAUSE = `${MODULE_PATH}/${ID_ACTION_UNPAUSE}`;
export const ACTION_RESET = `${MODULE_PATH}/${ID_ACTION_RESET}`;
export const ACTION_DISCARDING_RESET = `${MODULE_PATH}/${ID_ACTION_DISCARDING_RESET}`;
export const ACTION_SAVING_RESET = `${MODULE_PATH}/${ID_ACTION_SAVING_RESET}`;
export const ACTION_SET_ALL_SEGMENTS = `${MODULE_PATH}/${ID_ACTION_SET_ALL_SEGMENTS}`;

export interface PausePayload {
    igtOnly: boolean;
}

export interface ResetPayload {
    windowId: number;
}
export interface SavingResetPayload {
    isNewPersonalBest: boolean;
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
    const validator = injector.get(VALIDATOR_SERVICE_TOKEN);

    return {
        namespaced: true,
        state: {
            current: -1,
            segments: [],
            timing: TimingMethod.RTA,
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
            [ID_MUTATION_SET_PREVIOUS_RTA_TIME](state: SplitsState, newTime: number) {
                state.previousRTATotal = asCleanNumber(newTime);
            },
            [ID_MUTATION_SET_PREVIOUS_IGT_TIME](state: SplitsState, newTime: number) {
                state.previousIGTTotal = asCleanNumber(newTime);
            },
            [ID_MUTATION_ADD_SEGMENT](state: SplitsState, segment: Segment) {
                if (!validator.isSegment(segment)) {
                    return;
                }

                state.segments.push(segment);
            },
            [ID_MUTATION_SET_ALL_SEGMENTS](state: SplitsState, segments: Segment[]) {
                if (!Array.isArray(segments) || segments.findIndex(segment => !validator.isSegment(segment)) > -1) {
                    return;
                }

                state.segments = segments;
            },
            [ID_MUTATION_SET_SEGMENT](
                state: SplitsState,
                payload: { index: number; segment: Segment }
            ) {
                if (payload == null || typeof payload !== 'object' || !validator.isSegment(payload.segment)) {
                    return;
                }

                const { index, segment } = payload;

                // Check if the index is valid/exists
                if (
                    typeof index !== 'number' ||
                    isNaN(index) ||
                    !isFinite(index) ||
                    index < 0 ||
                    index >= state.segments.length
                ) {
                    return;
                }

                state.segments.splice(index, 1, segment);
            },
            [ID_MUTATION_REMOVE_SEGMENT](state: SplitsState, index: number) {
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
                state.segments = [];
            },
            [ID_MUTATION_DISCARDING_RESET](state: SplitsState) {
                state.segments = state.segments.map(segment => {
                    const newSegment = resetSegment(segment);

                    if (segment.hasNewOverallBest) {
                        newSegment.overallBest = segment.previousOverallBest;
                    }

                    return newSegment;
                });
            },
            [ID_MUTATION_SAVING_RESET](state: SplitsState) {
                let newRTATotal = 0;
                let newIGTTotal = 0;

                state.segments.forEach(segment => {
                    if (segment.passed) {
                        newRTATotal += segment.currentTime.rta.rawTime;
                        newIGTTotal += segment.currentTime.igt.rawTime;
                    }
                });

                const isNewRTAPB = state.previousRTATotal === 0 ||
                    (newRTATotal > 0 && newRTATotal < state.previousRTATotal);
                const isNewIGTPB = state.previousIGTTotal === 0 ||
                    (newIGTTotal > 0 && newIGTTotal < state.previousIGTTotal);
                const isNewPersonalBest = state.timing === TimingMethod.RTA ? isNewRTAPB : isNewIGTPB;

                if (isNewPersonalBest) {
                    state.segments = state.segments.map(segment => {
                        if (segment.passed) {
                            segment.personalBest = { ...segment.currentTime };
                        } else {
                            segment.personalBest = null;
                        }

                        return segment;
                    });

                    state.previousRTATotal = newRTATotal;
                    state.previousIGTTotal = newIGTTotal;
                }

                // Reset the segments now
                state.segments = state.segments.map(segment => resetSegment(segment));
            },
        },
        actions: {
            async [ID_ACTION_SET_TIMING](
                context: ActionContext<SplitsState, RootState>,
                timing: TimingMethod
            ): Promise<boolean> {
                switch (timing) {
                    case TimingMethod.IGT:
                    case TimingMethod.RTA:
                        context.commit(ID_MUTATION_SET_TIMING, timing);

                        return true;
                    default:
                        return false;
                }
            },
            async [ID_ACTION_START](context: ActionContext<SplitsState, RootState>): Promise<boolean> {
                const time = now();
                const status = context.rootState.splitterino.timer.status;

                if (status !== TimerStatus.STOPPED || context.state.segments.length < 1) {
                    return false;
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
                        totalRTATime += segment.personalBest.rta.rawTime;
                        totalIGTTime += segment.personalBest.igt.rawTime;
                    }
                });

                context.commit(ID_MUTATION_SET_PREVIOUS_RTA_TIME, totalRTATime);
                context.commit(ID_MUTATION_SET_PREVIOUS_IGT_TIME, totalIGTTime);

                const firstSegment = context.state.segments[0];

                context.commit(ID_MUTATION_SET_SEGMENT, {
                    index: 0,
                    segment: {
                        ...firstSegment,
                        startTime: time
                    }
                });
                context.commit(ID_MUTATION_SET_CURRENT, 0);

                return true;
            },
            async [ID_ACTION_SPLIT](context: ActionContext<SplitsState, RootState>): Promise<boolean> {
                const currentTime = now();

                const { status, igtPauseTotal, pauseTotal } = context.rootState.splitterino.timer;
                switch (status) {
                    case TimerStatus.FINISHED:
                        // Cleanup via reset
                        context.dispatch(ID_ACTION_RESET);

                        return true;
                    case TimerStatus.RUNNING:
                        break;
                    default:
                        // Ignore the split-event when it's not running
                        return false;
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
                    currentSegment.overallBest[timing].rawTime === 0 ||
                    currentSegment.overallBest[timing].rawTime > newTime[timing].rawTime
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

                    return true;
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

                return true;
            },
            async [ID_ACTION_SKIP](context: ActionContext<SplitsState, RootState>): Promise<boolean> {
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
            async [ID_ACTION_UNDO](context: ActionContext<SplitsState, RootState>): Promise<boolean> {
                const status = context.rootState.splitterino.timer.status;
                const index = context.state.current;

                if (status !== TimerStatus.RUNNING || index < 1) {
                    return false;
                }

                const segment: Segment = {
                    ...context.state.segments[index],
                    startTime: -1,
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
                };

                if (segment.currentTime != null) {
                    if (!previous.passed || previous.currentTime == null) {
                        previous.currentTime = context.state.segments[index].currentTime;
                    } else {
                        [TimingMethod.RTA, TimingMethod.IGT].forEach(timing => {
                            if (previous.currentTime[timing] == null) {
                                previous.currentTime[timing] = segment.currentTime[timing];
                            } else {
                                previous.currentTime[timing].pauseTime += segment.currentTime[timing].pauseTime;
                            }
                        });
                    }
                }

                // Mark the previous segment as neither passed or skipped
                previous.passed = false;
                previous.skipped = false;

                // Remove the currentTime from the segment now
                segment.currentTime = null;

                context.commit(ID_MUTATION_SET_SEGMENT, { index, segment });
                context.commit(ID_MUTATION_SET_SEGMENT, { index: index - 1, segment: previous });
                context.commit(ID_MUTATION_SET_CURRENT, index - 1);

                return true;
            },
            async [ID_ACTION_PAUSE](
                context: ActionContext<SplitsState, RootState>,
                payload: PausePayload
            ): Promise<boolean> {
                const time = now();
                const igtOnly = payload && payload.igtOnly;
                const status = context.rootState.splitterino.timer.status;

                if (igtOnly ? (
                    status === TimerStatus.RUNNING_IGT_PAUSE ||
                    status !== TimerStatus.RUNNING
                ) : status !== TimerStatus.RUNNING) {
                    return false;
                }

                let toStatus = TimerStatus.PAUSED;
                if (igtOnly) {
                    toStatus = TimerStatus.RUNNING_IGT_PAUSE;
                }

                context.commit(
                    MUTATION_SET_STATUS,
                    { time, status: toStatus },
                    { root: true }
                );

                return true;
            },
            async [ID_ACTION_UNPAUSE](
                context: ActionContext<SplitsState, RootState>,
                payload: PausePayload
            ): Promise<boolean> {
                const time = now();
                const status = context.rootState.splitterino.timer.status;
                const igtOnly = payload && payload.igtOnly;

                if (igtOnly ? status !== TimerStatus.RUNNING_IGT_PAUSE : status !== TimerStatus.PAUSED) {
                    return false;
                }

                const index = context.state.current;
                // Create a copy of the segment so it can be safely edited
                const segment: Segment = { ...context.state.segments[index] };

                if (segment.currentTime == null) {
                    segment.currentTime = {
                        rta: { rawTime: 0, pauseTime: 0 },
                        igt: { rawTime: 0, pauseTime: 0 },
                    };
                }

                if (!igtOnly) {
                    const pauseAddition = time - context.rootState.splitterino.timer.pauseTime;
                    if (segment.currentTime.rta == null) {
                        segment.currentTime.rta = { rawTime: 0, pauseTime: 0 };
                    }
                    segment.currentTime.rta.pauseTime += pauseAddition;
                }

                const igtPauseAddition = time - context.rootState.splitterino.timer.igtPauseTime;
                if (segment.currentTime.igt == null) {
                    segment.currentTime.igt = { rawTime: 0, pauseTime: 0 };
                }
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

                return true;
            },
            async [ID_ACTION_RESET](
                context: ActionContext<SplitsState, RootState>,
                payload: ResetPayload
            ): Promise<boolean> {
                const status = context.rootState.splitterino.timer.status;

                // When the Timer is already stopped, nothing to do
                if (status === TimerStatus.STOPPED) {
                    return true;
                }

                const previousRTAPB = Math.max(0, context.state.previousRTATotal);
                const previousIGTPB = Math.max(0, context.state.previousIGTTotal);
                let totalRTATime = 0;
                let totalIGTTime = 0;

                context.state.segments.forEach(segment => {
                    if (segment.passed) {
                        totalRTATime += segment.currentTime.rta.rawTime;
                        totalIGTTime += segment.currentTime.igt.rawTime;
                    }
                });

                const isNewRTAPB = previousRTAPB === 0 || (totalRTATime > 0 && totalRTATime < previousRTAPB);
                const isNewIGTPB = previousIGTPB === 0 || (totalIGTTime > 0 && totalIGTTime < previousIGTPB);
                const isNewPersonalBest = context.state.timing === TimingMethod.RTA ? isNewRTAPB : isNewIGTPB;
                const isNewOverallBest = context.state.segments.findIndex(segment => segment.passed) !== -1;

                // if the time is a new PB or the splits should get saved as
                // the status is finished.
                if (status === TimerStatus.FINISHED) {
                    context.dispatch(ID_ACTION_SAVING_RESET);

                    return true;
                }

                // We can safely discard when the run hasn't finished yet and no new OB is set yet
                if (!isNewOverallBest) {
                    return context.dispatch(ID_ACTION_DISCARDING_RESET);
                }

                let win = null;
                const id: number = (payload || { windowId: null }).windowId;

                if (typeof id !== 'number' && !isNaN(id) && isFinite(id)) {
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
                ).then(res => {
                    switch (res) {
                        case 0:
                            return false;
                        case 1:
                            return context.dispatch(ID_ACTION_DISCARDING_RESET);
                        case 2:
                            return context.dispatch(ID_ACTION_SAVING_RESET, { isNewPersonalBest });
                    }
                });
            },
            async [ID_ACTION_DISCARDING_RESET](context: ActionContext<SplitsState, RootState>): Promise<boolean> {
                context.commit(MUTATION_SET_STATUS, TimerStatus.STOPPED, {
                    root: true
                });
                context.commit(ID_MUTATION_SET_CURRENT, -1);
                context.commit(ID_MUTATION_DISCARDING_RESET);

                return true;
            },
            async [ID_ACTION_SAVING_RESET](
                context: ActionContext<SplitsState, RootState>
            ): Promise<boolean> {
                context.commit(MUTATION_SET_STATUS, TimerStatus.STOPPED, {
                    root: true
                });
                context.commit(ID_MUTATION_SET_CURRENT, -1);
                context.commit(ID_MUTATION_SAVING_RESET);

                return true;
            },
            async [ID_ACTION_SET_ALL_SEGMENTS](
                context: ActionContext<SplitsState, RootState>,
                payload: Segment[]
            ): Promise<boolean> {
                if (!Array.isArray(payload)) {
                    Logger.warn({
                        msg: 'Payload has to be an array!',
                        payload: payload
                    });

                    return false;
                }

                const status = context.rootState.splitterino.timer.status;
                if (status !== TimerStatus.STOPPED) {
                    return false;
                }

                context.commit(ID_MUTATION_SET_ALL_SEGMENTS, payload);

                return true;
            }
        }
    };
}
