import { TimerStatus } from '../../common/timer-status';
import { TimerState } from '../../models/states/timer.state';
import { Module } from '../../models/store';
import { now } from '../../utils/time';

export const MODULE_PATH = 'splitterino/timer';

export const ID_HANDLER_SET_START_DELAY = 'setStartDelay';
export const ID_HANDLER_SET_STATUS = 'setStatus';

export const HANDLER_SET_START_DELAY = `${MODULE_PATH}/${ID_HANDLER_SET_START_DELAY}`;
export const HANDLER_SET_STATUS = `${MODULE_PATH}/${ID_HANDLER_SET_STATUS}`;

export interface StatusChangePayload {
    time: number;
    status: TimerStatus;
}

export function getTimerStoreModule(): Module<TimerState> {
    return {
        initialize() {
            return {
                status: TimerStatus.STOPPED,
                startDelay: 0,
                startTime: 0,
                pauseTime: 0,
                igtPauseTime: 0,
                pauseTotal: 0,
                igtPauseTotal: 0,
                finishTime: 0,
            };
        },
        handlers: {
            [ID_HANDLER_SET_START_DELAY](state: TimerState, to: number) {
                // Don't allow invalid content to be set
                if (typeof to !== 'number' || isNaN(to) || !isFinite(to) || to < 0) {
                    return {};
                }

                return { startDelay: to };
            },
            [ID_HANDLER_SET_STATUS](
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
                    return {};
                }

                const from = state.status;
                const result: Partial<TimerState> = {};

                switch (changeTo) {
                    case TimerStatus.RUNNING:
                        switch (from) {
                            case TimerStatus.STOPPED:
                                result.startTime = time;
                                break;
                            case TimerStatus.PAUSED:
                                result.pauseTotal = state.pauseTotal + time - state.pauseTime;
                                result.pauseTime = 0;
                            // eslint-disable-next-line no-fallthrough
                            case TimerStatus.RUNNING_IGT_PAUSE:
                                result.igtPauseTotal = state.igtPauseTotal + time - state.igtPauseTime;
                                result.igtPauseTime = 0;
                                break;
                            case TimerStatus.FINISHED:
                                result.finishTime = 0;
                                break;
                            default:
                                return {};
                        }
                        break;

                    case TimerStatus.PAUSED:
                        switch (from) {
                            case TimerStatus.RUNNING:
                                result.igtPauseTime = time;
                            // eslint-disable-next-line no-fallthrough
                            case TimerStatus.RUNNING_IGT_PAUSE:
                                result.pauseTime = time;
                                break;
                            default:
                                return {};
                        }
                        break;

                    case TimerStatus.RUNNING_IGT_PAUSE:
                        switch (from) {
                            case TimerStatus.RUNNING:
                            case TimerStatus.FINISHED:
                                result.igtPauseTime = time;
                                break;
                            case TimerStatus.PAUSED:
                                result.pauseTotal = state.pauseTotal + time - state.pauseTime;
                                result.pauseTime = 0;
                                break;
                            default:
                                return {};
                        }
                        break;

                    case TimerStatus.FINISHED:
                        switch (from) {
                            case TimerStatus.PAUSED:
                                result.pauseTotal = state.pauseTotal + time - state.pauseTime;
                                result.pauseTime = 0;
                            // eslint-disable-next-line no-fallthrough
                            case TimerStatus.RUNNING_IGT_PAUSE:
                                result.igtPauseTotal = state.igtPauseTotal + time - state.igtPauseTime;
                                result.igtPauseTime = 0;
                                break;
                            case TimerStatus.RUNNING:
                                break;
                            default:
                                return {};
                        }
                        result.finishTime = time;
                        break;

                    case TimerStatus.STOPPED:
                        switch (from) {
                            case TimerStatus.RUNNING:
                            case TimerStatus.RUNNING_IGT_PAUSE:
                            case TimerStatus.PAUSED:
                            case TimerStatus.FINISHED:
                                result.startTime = 0;
                                result.pauseTime = 0;
                                result.pauseTotal = 0;
                                result.igtPauseTime = 0;
                                result.igtPauseTotal = 0;
                                result.finishTime = 0;
                                break;
                            default:
                                return {};
                        }
                        break;

                    default:
                        return {};
                }
                result.status = changeTo;

                return result;
            },
        },
    };
}
