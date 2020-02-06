import { Module } from 'vuex';

import { TimerStatus } from '../../common/timer-status';
import { RootState } from '../../models/states/root.state';
import { TimerState } from '../../models/states/timer.state';
import { now } from '../../utils/time';

export const MODULE_PATH = 'splitterino/timer';

export const ID_MUTATION_SET_START_DELAY = 'setStartDelay';
export const ID_MUTATION_SET_STATUS = 'setStatus';

export const MUTATION_SET_START_DELAY = `${MODULE_PATH}/${ID_MUTATION_SET_START_DELAY}`;
export const MUTATION_SET_STATUS = `${MODULE_PATH}/${ID_MUTATION_SET_STATUS}`;

export interface StatusChangePayload {
    time: number;
    status: TimerStatus;
}

export function getTimerStoreModule(): Module<TimerState, RootState> {
    return {
        namespaced: true,
        state: {
            status: TimerStatus.STOPPED,
            startDelay: 0,
            startTime: 0,
            pauseTime: 0,
            igtPauseTime: 0,
            pauseTotal: 0,
            igtPauseTotal: 0,
            finishTime: 0,
        },
        getters: {},
        mutations: {
            [ID_MUTATION_SET_START_DELAY](state: TimerState, to: number) {
                // Don't allow invalid content to be set
                if (typeof to !== 'number' || isNaN(to) || !isFinite(to) || to < 0) {
                    return;
                }

                state.startDelay = to;
            },
            [ID_MUTATION_SET_STATUS](
                state: TimerState,
                payload: TimerStatus | StatusChangePayload
            ) {
                let changeTo: TimerStatus;
                let time = now();

                if (typeof payload === 'string') {
                    changeTo = payload;
                } else if (payload != null && typeof payload === 'object') {
                    time = payload.time;
                    changeTo = payload.status;
                } else {
                    return;
                }

                const from = state.status;
                switch (changeTo) {
                    case TimerStatus.RUNNING:
                        switch (from) {
                            case TimerStatus.STOPPED:
                                state.startTime = time;
                                break;
                            case TimerStatus.PAUSED:
                                state.pauseTotal += time - state.pauseTime;
                                state.pauseTime = 0;
                            // tslint:disable-next-line:no-switch-case-fall-through
                            case TimerStatus.RUNNING_IGT_PAUSE:
                                state.igtPauseTotal += time - state.igtPauseTime;
                                state.igtPauseTime = 0;
                                break;
                            case TimerStatus.FINISHED:
                                state.finishTime = 0;
                                break;
                            default:
                                return;
                        }
                        break;

                    case TimerStatus.PAUSED:
                        switch (from) {
                            case TimerStatus.RUNNING:
                                state.igtPauseTime = time;
                            // tslint:disable-next-line:no-switch-case-fall-through
                            case TimerStatus.RUNNING_IGT_PAUSE:
                                state.pauseTime = time;
                                break;
                            default:
                                return;
                        }
                        break;

                    case TimerStatus.RUNNING_IGT_PAUSE:
                        switch (from) {
                            case TimerStatus.RUNNING:
                            case TimerStatus.FINISHED:
                                state.igtPauseTime = time;
                                break;
                            case TimerStatus.PAUSED:
                                state.pauseTotal += time - state.pauseTime;
                                state.pauseTime = 0;
                                break;
                            default:
                                return;
                        }
                        break;

                    case TimerStatus.FINISHED:
                        switch (from) {
                            case TimerStatus.PAUSED:
                                state.pauseTotal += time - state.pauseTime;
                                state.pauseTime = 0;
                            // tslint:disable-next-line:no-switch-case-fall-through
                            case TimerStatus.RUNNING_IGT_PAUSE:
                                state.igtPauseTotal += time - state.igtPauseTime;
                                state.igtPauseTime = 0;
                                break;
                            case TimerStatus.RUNNING:
                                break;
                            default:
                                return;
                        }
                        state.finishTime = time;
                        break;

                    case TimerStatus.STOPPED:
                        switch (from) {
                            case TimerStatus.RUNNING:
                            case TimerStatus.RUNNING_IGT_PAUSE:
                            case TimerStatus.PAUSED:
                            case TimerStatus.FINISHED:
                                state.startTime = 0;
                                state.pauseTime = 0;
                                state.pauseTotal = 0;
                                state.igtPauseTime = 0;
                                state.igtPauseTotal = 0;
                                state.finishTime = 0;
                                break;
                            default:
                                return;
                        }
                        break;

                    default:
                        return;
                }
                state.status = changeTo;
            },
        },
        actions: {},
    };
}
