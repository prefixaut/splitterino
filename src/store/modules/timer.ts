import now from 'performance-now';

import { TimerStatus } from '../../common/timer-status';
import { TimerState } from '..//states/timer';

const state: TimerState = {
    status: TimerStatus.STOPPED,
    startDelay: 0,
    startTime: 0,
    pauseTime: 0,
    pauseTotal: 0,
    finishTime: 0,
};

const mutations = {
    setStartDelay(state: TimerState, to: number) {
        if (state.status !== TimerStatus.STOPPED) {
            return;
        }
        state.startDelay = to;
    },
    setStartTime(state: TimerState, to: number) {
        state.startTime = to;
    },
    setStatus(state: TimerState, to: TimerStatus | { time: number, status: TimerStatus }) {
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
        state.status = changeTo;

        if (changeTo === TimerStatus.FINISHED) {
            state.finishTime = time;
        } else if (changeTo === TimerStatus.PAUSED) {
            state.pauseTime = time;
        } else if (from === TimerStatus.PAUSED) {
            if (changeTo === TimerStatus.RUNNING) {
                state.pauseTotal += time - state.pauseTime;
            }
            state.pauseTime = 0;
        } else if (changeTo === TimerStatus.STOPPED) {
            state.startTime = 0;
            state.pauseTime = 0;
            state.pauseTotal = 0;
            state.finishTime = 0;
        }
    },
};

export default {
    namespaced: true,
    state,
    mutations,
};
