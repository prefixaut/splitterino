import { SplitsStatus } from '@/common/splits-status';
import { TimerState } from '@/store/states/timer';

const state: TimerState = {
    status: SplitsStatus.STOPPED,
    startDelay: 0,
    startTime: 0,
    pauseStart: -1,
    pauseTotal: 0,
    finishTime: 0,
}

const mutations = {
    setStatus(state: TimerState, to: SplitsStatus) {
        if (to == null) {
            return;
        }

        state.status = to;
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
