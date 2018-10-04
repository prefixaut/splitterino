import now from 'performance-now';

import { SplitsStatus } from '@/common/splits-status';
import { TimerState } from '@/store/states/timer';

const state: TimerState = {
    status: SplitsStatus.STOPPED,
    startDelay: 0,
    startTime: 0,
    pauseTime: 0,
    pauseTotal: 0,
    finishTime: 0,
}

const mutations = {
    setStartDelay(state: TimerState, to: number) {
        if (state.status !== SplitsStatus.STOPPED) {
            return;
        }
        state.startDelay = to;
    },
    setStartTime(state: TimerState, to: number) {
        state.startTime = to;
    },
    setStatus(state: TimerState, to: SplitsStatus | { time: number, status: SplitsStatus }) {
        let changeTo: SplitsStatus;
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

        if (changeTo === SplitsStatus.FINISHED) {
            state.finishTime = time;
        } else if (changeTo === SplitsStatus.PAUSED) {
            state.pauseTime = time;
        } else if (from === SplitsStatus.PAUSED) {
            if (changeTo === SplitsStatus.RUNNING) {
                state.pauseTotal += time - state.pauseTime;
            }
            state.pauseTime = 0;
        } else if (changeTo === SplitsStatus.STOPPED) {
            state.startTime = 0;
            state.pauseTime = 0;
            state.pauseTotal = 0;
            state.finishTime = 0;
        }
    },
};

const actions = {

};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
};
