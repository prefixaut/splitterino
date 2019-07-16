import { Module } from 'vuex';

import { TimerStatus } from '../../common/timer-status';
import { now } from '../../utils/time';
import { RootState } from '../states/root.state';
import { TimerState } from '../states/timer.state';

const MODULE_PATH = 'splitterino/timer';

const ID_MUTATION_SET_START_DELAY = 'setStartDelay';
const ID_MUTATION_SET_START_TIME = 'setStartTime';
const ID_MUTATION_SET_STATUS = 'setStatus';

export const MUTATION_SET_START_DELAY = `${MODULE_PATH}/${ID_MUTATION_SET_START_DELAY}`;
export const MUTATION_SET_START_TIME = `${MODULE_PATH}/${ID_MUTATION_SET_START_TIME}`;
export const MUTATION_SET_STATUS = `${MODULE_PATH}/${ID_MUTATION_SET_STATUS}`;

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
                if (state.status !== TimerStatus.STOPPED) {
                    return;
                }
                state.startDelay = to;
            },
            [ID_MUTATION_SET_START_TIME](state: TimerState, to: number) {
                state.startTime = to;
            },
            [ID_MUTATION_SET_STATUS](
                state: TimerState,
                to: TimerStatus | { time: number; status: TimerStatus }
            ) {
                let changeTo: TimerStatus;
                let time = now();

                if (typeof to === 'string') {
                    changeTo = to;
                } else {
                    time = to.time;
                    changeTo = to.status;
                }

                if (changeTo == null) {
                    return;
                }

                const from = state.status;
                switch (changeTo) {
                    case TimerStatus.RUNNING:
                        if (from === TimerStatus.STOPPED) {
                            state.startTime = time;
                        } else if (from === TimerStatus.PAUSED) {
                            state.pauseTotal += time - state.pauseTime;
                            state.pauseTime = 0;
                        } else if (from === TimerStatus.RUNNING_IGT_PAUSE) {
                            state.igtPauseTotal += time - state.igtPauseTime;
                            state.igtPauseTime = 0;
                        }
                        break;
                    case TimerStatus.PAUSED:
                        if (from !== TimerStatus.RUNNING_IGT_PAUSE) {
                            state.igtPauseTime = time;
                        }
                        state.pauseTime = time;
                        break;
                    case TimerStatus.FINISHED:
                        if (from === TimerStatus.PAUSED) {
                            state.pauseTotal += time - state.pauseTime;
                            state.pauseTime = 0;
                        }
                        if (from === TimerStatus.PAUSED || from === TimerStatus.RUNNING_IGT_PAUSE) {
                            state.igtPauseTotal += time - state.igtPauseTime;
                            state.igtPauseTime = 0;
                        }
                        state.finishTime = time;
                        break;
                    case TimerStatus.STOPPED:
                        state.startTime = 0;
                        state.pauseTime = 0;
                        state.pauseTotal = 0;
                        state.finishTime = 0;
                }
                state.status = changeTo;
            },
        },
        actions: {},
    };
}
