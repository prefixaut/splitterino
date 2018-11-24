import { TimerStatus } from '../../common/timer-status';
import { now } from '../../utils/now';
import { TimerState } from '../states/timer';

const state: TimerState = {
    status: TimerStatus.STOPPED,
    startDelay: 0,
    startTime: 0,
    pauseTime: 0,
    pauseTotal: 0,
    finishTime: 0,
};

const mutations = {
    setStartDelay (state: TimerState, to: number) {
        if (state.status !== TimerStatus.STOPPED) {
            return;
        }
        state.startDelay = to;
    },
    setStartTime (state: TimerState, to: number) {
        state.startTime = to;
    },
    setStatus (state: TimerState, to: TimerStatus | { time: number, status: TimerStatus }) {
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
                }
                break;
            case TimerStatus.PAUSED:
                state.pauseTime = time;
                break;
            case TimerStatus.FINISHED:
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
};

export default {
    namespaced: true,
    state,
    mutations,
};
