import { Injector } from 'lightweight-di';

import { SplitsFile } from '../../models/files';
import { VALIDATOR_SERVICE_TOKEN } from '../../models/services';
import { Segment, TimingMethod } from '../../models/splits';
import { SplitsState } from '../../models/states/splits.state';
import { Module } from '../../models/store';
import { asCleanNumber } from '../../utils/converters';
import { getFinalTime } from '../../utils/time';

export const MODULE_PATH = 'splitterino/splits';

export const ID_HANDLER_SET_CURRENT = 'setCurrent';
export const ID_HANDLER_SET_TIMING = 'setTiming';
export const ID_HANDLER_CLEAR_SEGMENTS = 'clearSegments';
export const ID_HANDLER_REMOVE_SEGMENT = 'removeSegment';
export const ID_HANDLER_ADD_SEGMENT = 'addSegment';
export const ID_HANDLER_SET_ALL_SEGMENTS = 'setAllSegments';
export const ID_HANDLER_SET_SEGMENT = 'setSegment';
export const ID_HANDLER_SET_PREVIOUS_RTA_TIME = 'setPreviousRTATime';
export const ID_HANDLER_SET_PREVIOUS_IGT_TIME = 'setPreviousIGTTime';
export const ID_HANDLER_DISCARDING_RESET = 'discardingReset';
export const ID_HANDLER_SAVING_RESET = 'savingReset';
export const ID_HANDLER_APPLY_SPLITS_FILE = 'applySplitsFile';

export const HANDLER_SET_CURRENT = `${MODULE_PATH}/${ID_HANDLER_SET_CURRENT}`;
export const HANDLER_SET_TIMING = `${MODULE_PATH}/${ID_HANDLER_SET_TIMING}`;
export const HANDLER_CLEAR_SEGMENTS = `${MODULE_PATH}/${ID_HANDLER_CLEAR_SEGMENTS}`;
export const HANDLER_REMOVE_SEGMENT = `${MODULE_PATH}/${ID_HANDLER_REMOVE_SEGMENT}`;
export const HANDLER_ADD_SEGMENT = `${MODULE_PATH}/${ID_HANDLER_ADD_SEGMENT}`;
export const HANDLER_SET_ALL_SEGMENTS = `${MODULE_PATH}/${ID_HANDLER_SET_ALL_SEGMENTS}`;
export const HANDLER_SET_SEGMENT = `${MODULE_PATH}/${ID_HANDLER_SET_SEGMENT}`;
export const HANDLER_SET_PREVIOUS_RTA_TIME = `${MODULE_PATH}/${ID_HANDLER_SET_PREVIOUS_RTA_TIME}`;
export const HANDLER_SET_PREVIOUS_IGT_TIME = `${MODULE_PATH}/${ID_HANDLER_SET_PREVIOUS_IGT_TIME}`;
export const HANDLER_DISCARDING_RESET = `${MODULE_PATH}/${ID_HANDLER_DISCARDING_RESET}`;
export const HANDLER_SAVING_RESET = `${MODULE_PATH}/${ID_HANDLER_SAVING_RESET}`;
export const HANDLER_APPLY_SPLITS_FILE = `${MODULE_PATH}/${ID_HANDLER_APPLY_SPLITS_FILE}`;

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

export function getSplitsStoreModule(injector: Injector): Module<SplitsState> {
    const validator = injector.get(VALIDATOR_SERVICE_TOKEN);

    return {
        initialize() {
            return {
                current: -1,
                segments: [],
                timing: TimingMethod.RTA,
                previousRTATotal: -1,
                previousIGTTotal: -1,
            };
        },
        handlers: {
            [ID_HANDLER_SET_CURRENT](state: SplitsState, index: number) {
                if (
                    typeof index !== 'number' ||
                    isNaN(index) ||
                    !isFinite(index) ||
                    index < -1 ||
                    index > state.segments.length
                ) {
                    return {};
                }

                return { current: index };
            },
            [ID_HANDLER_SET_TIMING](state: SplitsState, timing: TimingMethod) {
                // Be sure that the timing is valid
                switch (timing) {
                    case TimingMethod.RTA:
                    case TimingMethod.IGT:
                        return { timing: timing };
                    default:
                        return {};
                }
            },
            [ID_HANDLER_SET_PREVIOUS_RTA_TIME](state: SplitsState, newTime: number) {
                newTime = asCleanNumber(newTime, null);
                if (newTime == null) {
                    return {};
                }

                return { previousRTATotal: Math.max(newTime, -1) };
            },
            [ID_HANDLER_SET_PREVIOUS_IGT_TIME](state: SplitsState, newTime: number) {
                newTime = asCleanNumber(newTime, null);
                if (newTime == null) {
                    return {};
                }

                return { previousIGTTotal: Math.max(newTime, -1) };
            },
            [ID_HANDLER_ADD_SEGMENT](state: SplitsState, segment: Segment) {
                if (!validator.isSegment(segment)) {
                    return {};
                }

                // Create a new array
                return { segments: [...state.segments, segment] };
            },
            [ID_HANDLER_SET_ALL_SEGMENTS](state: SplitsState, segments: Segment[]) {
                if (!Array.isArray(segments) || segments.findIndex(segment => !validator.isSegment(segment)) > -1) {
                    return {};
                }

                return { segments: segments };
            },
            [ID_HANDLER_SET_SEGMENT](
                state: SplitsState,
                payload: { index: number; segment: Segment }
            ) {
                if (payload == null || typeof payload !== 'object' || !validator.isSegment(payload.segment)) {
                    return {};
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
                    return {};
                }

                return { segments: [...state.segments.slice(0, index), segment, ...state.segments.slice(index + 1)] };
            },
            [ID_HANDLER_REMOVE_SEGMENT](state: SplitsState, index: number) {
                if (
                    typeof index !== 'number' ||
                    isNaN(index) ||
                    !isFinite(index) ||
                    index < 0 ||
                    index >= state.segments.length
                ) {
                    return {};
                }

                return { segments: [...state.segments.slice(0, index), ...state.segments.slice(index + 1)] };
            },
            [ID_HANDLER_CLEAR_SEGMENTS]() {
                return { segments: [] };
            },
            [ID_HANDLER_DISCARDING_RESET](state: SplitsState) {
                return {
                    segments: state.segments.map(segment => {
                        const newSegment = resetSegment(segment);

                        if (segment.hasNewOverallBest) {
                            newSegment.overallBest = segment.previousOverallBest;
                        }

                        return newSegment;
                    }),
                };
            },
            [ID_HANDLER_SAVING_RESET](state: SplitsState) {
                let newRTATotal = 0;
                let newIGTTotal = 0;

                state.segments.forEach(segment => {
                    if (segment.passed) {
                        newRTATotal += getFinalTime(segment.currentTime.rta);
                        newIGTTotal += getFinalTime(segment.currentTime.igt);
                    }
                });

                const isNewRTAPB = state.previousRTATotal === 0 ||
                    (newRTATotal > 0 && newRTATotal < state.previousRTATotal);
                const isNewIGTPB = state.previousIGTTotal === 0 ||
                    (newIGTTotal > 0 && newIGTTotal < state.previousIGTTotal);
                const isNewPersonalBest = state.timing === TimingMethod.RTA ? isNewRTAPB : isNewIGTPB;

                const result: Partial<SplitsState> = {};

                if (isNewPersonalBest) {
                    result.segments = state.segments.map(segment => {
                        if (segment.passed) {
                            segment.personalBest = { ...segment.currentTime };
                        } else {
                            segment.personalBest = null;
                        }

                        return segment;
                    });

                    result.previousRTATotal = newRTATotal;
                    result.previousIGTTotal = newIGTTotal;
                }

                // Reset the segments now
                result.segments = state.segments.map(segment => resetSegment(segment));

                return result;
            },
            [ID_HANDLER_APPLY_SPLITS_FILE](state: SplitsState, splitsFile: SplitsFile) {
                return {
                    segments: splitsFile.splits.segments,
                    timing: splitsFile.splits.timing,
                };
            }
        },
    };
}
