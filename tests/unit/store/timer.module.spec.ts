/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';

import { TimerStatus } from '../../../src/common/timer-status';
import { TimerState } from '../../../src/models/states/timer.state';
import { Module } from '../../../src/store';
import {
    getTimerStoreModule,
    ID_HANDLER_SET_START_DELAY,
    ID_HANDLER_SET_STATUS,
} from '../../../src/store/modules/timer.module';
import { now } from '../../../src/utils/time';
import { randomInt } from '../../utils';

const maxTimeDeviation = 1;

describe('Timer Store-Module', () => {
    const timerModule: Module<TimerState> = getTimerStoreModule();

    it('should be a valid module', () => {
        expect(timerModule).to.be.a('object');
        expect(timerModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(timerModule).to.have.property('initialize').which.is.a('function');

        const state = timerModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Handlers', () => {
        describe(ID_HANDLER_SET_START_DELAY, () => {
            it('should set the delay of the timer when its stopped', () => {
                const newDelay = 1_000;
                const state: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: 0,
                    startTime: 0,
                    pauseTime: 0,
                    igtPauseTime: 0,
                    pauseTotal: 0,
                    igtPauseTotal: 0,
                    finishTime: 0,
                };

                const diff = timerModule.handlers[ID_HANDLER_SET_START_DELAY](state, newDelay);
                expect(diff).to.deep.equal({ startDelay: newDelay });
            });

            it('should not apply the mutation with an invalid delay', () => {
                const originalDelay = 1_000;
                const state: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: originalDelay,
                    startTime: 0,
                    pauseTime: 0,
                    igtPauseTime: 0,
                    pauseTotal: 0,
                    igtPauseTotal: 0,
                    finishTime: 0,
                };

                [
                    undefined,
                    null,
                    'strings',
                    true,
                    false,
                    -1,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    []
                ].forEach(newDelay => {
                    const diff = timerModule.handlers[ID_HANDLER_SET_START_DELAY](state, newDelay);
                    expect(diff).to.deep.equal({}, `Applied wrongfully following delay: "${newDelay}"!`);
                });
            });
        });

        describe(ID_HANDLER_SET_STATUS, () => {
            it('should not switch to an invalid status', () => {
                const state: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                [
                    undefined,
                    null,
                    'strings',
                    123,
                    -123,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    [],
                ].forEach(invalidStatus => {
                    let diff: Partial<TimerState>;
                    diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, invalidStatus);

                    expect(diff).to.deep.equal({});

                    diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, { time: now(), status: invalidStatus });

                    expect(diff).to.deep.equal({});
                });
            });

            it('should should use the provided time when switching the status', () => {
                const time = now() - 20_000;
                const state: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, {
                    time,
                    status: TimerStatus.RUNNING,
                });

                expect(diff).to.deep.equal({
                    status: TimerStatus.RUNNING,
                    startTime: time,
                });
            });

            it('should start the timer correctly [STOPPED => RUNNING]', () => {
                const state: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING);

                expect(diff.status).to.equal(TimerStatus.RUNNING);
                expect(diff.startTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should unpause the timer correctly [PAUSED => RUNNING]', () => {
                const time = now();
                const pauseTime = 20_000;

                const state: TimerState = {
                    status: TimerStatus.PAUSED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: time - pauseTime,
                    igtPauseTime: time - pauseTime,
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING);

                expect(diff.status).to.equal(TimerStatus.RUNNING);
                expect(diff.pauseTime).to.equal(0);
                expect(diff.igtPauseTime).to.equal(0);
                expect(diff.pauseTotal).to.be.within(
                    state.pauseTotal + pauseTime,
                    state.pauseTotal + pauseTime + maxTimeDeviation
                );
                expect(diff.igtPauseTotal).to.be.within(
                    state.igtPauseTotal + pauseTime,
                    state.igtPauseTotal + pauseTime + maxTimeDeviation
                );
            });

            it('should unpause (IGT only) the timer correctly [RUNNING_IGT_PAUSED => RUNNING]', () => {
                const time = now();
                const pauseTime = 20_000;

                const state: TimerState = {
                    status: TimerStatus.RUNNING_IGT_PAUSE,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: time - pauseTime,
                    igtPauseTime: time - pauseTime,
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING);

                expect(diff.status).to.equal(TimerStatus.RUNNING);
                expect(diff.igtPauseTime).to.equal(0);
                expect(diff.igtPauseTotal).to.be.within(
                    state.igtPauseTotal + pauseTime,
                    state.igtPauseTotal + pauseTime + maxTimeDeviation
                );
            });

            it('should unpause (IGT only) the timer correctly [FINISHED => RUNNING]', () => {
                const time = now();
                const pauseTime = 20_000;

                const state: TimerState = {
                    status: TimerStatus.FINISHED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: time - pauseTime,
                    igtPauseTime: time - pauseTime,
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING);

                expect(diff.status).to.equal(TimerStatus.RUNNING);
                expect(diff.finishTime).to.equal(0);
            });

            it('should do nothing when switching from an invalid status to running [* => RUNNING]', () => {
                const initialState: TimerState = {
                    status: null,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                [
                    undefined,
                    null,
                    'strings',
                    123,
                    -123,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    [],
                    TimerStatus.RUNNING,
                ].forEach((invalidStatus: any) => {
                    const state = {
                        ...initialState,
                        status: invalidStatus,
                    };

                    const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING);

                    expect(diff).to.deep.equal({});
                });
            });

            it('should pause the RTA timer now as well [RUNNING_IGT_PAUSED => PAUSED]', () => {
                const state: TimerState = {
                    status: TimerStatus.RUNNING_IGT_PAUSE,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.PAUSED);

                expect(diff.status).to.deep.equal(TimerStatus.PAUSED);
                expect(diff.pauseTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should pause both timers [RUNNING => PAUSED]', () => {
                const state: TimerState = {
                    status: TimerStatus.RUNNING,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.PAUSED);

                expect(diff.status).to.deep.equal(TimerStatus.PAUSED);
                expect(diff.pauseTime).to.be.within(time, time + maxTimeDeviation);
                expect(diff.igtPauseTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should do nothing when switching from an invalid status to paused [* => PAUSED]', () => {
                const initialState: TimerState = {
                    status: null,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                [
                    undefined,
                    null,
                    'strings',
                    123,
                    -123,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    [],
                    TimerStatus.STOPPED,
                    TimerStatus.PAUSED,
                    TimerStatus.FINISHED,
                ].forEach((invalidStatus: any) => {
                    const state = {
                        ...initialState,
                        status: invalidStatus,
                    };

                    const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.PAUSED);

                    expect(diff).to.deep.equal({});
                });
            });

            it('should pause the IGT timer correctly [RUNNING => RUNNING_IGT_PAUSED]', () => {
                const state: TimerState = {
                    status: TimerStatus.RUNNING,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                expect(diff.status).to.deep.equal(TimerStatus.RUNNING_IGT_PAUSE);
                expect(diff.igtPauseTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should set it back to running but keep the IGT timer paused [FINISHED => RUNNING_IGT_PAUSED]', () => {
                const state: TimerState = {
                    status: TimerStatus.FINISHED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                expect(diff.status).to.deep.equal(TimerStatus.RUNNING_IGT_PAUSE);
                expect(diff.igtPauseTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should unpause the RTA timer but keep the IGT timer paused [PAUSED => RUNNING_IGT_PAUSED]', () => {
                const state: TimerState = {
                    status: TimerStatus.PAUSED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                expect(diff.status).to.deep.equal(TimerStatus.RUNNING_IGT_PAUSE);
                expect(diff.pauseTime).to.equal(0);
                expect(diff.pauseTotal).to.be.within(
                    state.pauseTotal + (time - state.pauseTime),
                    state.pauseTotal + (time - state.pauseTime) + maxTimeDeviation
                );
            });

            it('should do nothing when switching from an invalid status to running igt paused' +
                '[* => RUNNING_IGT_PAUSED]', () => {
                    const initialState: TimerState = {
                        status: null,
                        startDelay: randomInt(99_999),
                        startTime: randomInt(99_999),
                        pauseTime: randomInt(99_999),
                        igtPauseTime: randomInt(99_999),
                        pauseTotal: randomInt(99_999),
                        igtPauseTotal: randomInt(99_999),
                        finishTime: randomInt(99_999),
                    };

                    [
                        undefined,
                        null,
                        'strings',
                        123,
                        -123,
                        NaN,
                        -NaN,
                        Infinity,
                        -Infinity,
                        {},
                        [],
                        TimerStatus.STOPPED,
                        TimerStatus.RUNNING_IGT_PAUSE,
                    ].forEach((invalidStatus: any) => {
                        const state = {
                            ...initialState,
                            status: invalidStatus,
                        };

                        const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                        expect(diff).to.deep.equal({});
                    });
                });

            it('should finish the timer when it was paused previously [PAUSED => FINISHED]', () => {
                const state: TimerState = {
                    status: TimerStatus.PAUSED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.FINISHED);

                expect(diff.status).to.deep.equal(TimerStatus.FINISHED);
                expect(diff.pauseTime).to.equal(0);
                expect(diff.igtPauseTime).to.equal(0);
                expect(diff.pauseTotal).to.be.within(
                    state.pauseTotal + (time - state.pauseTime),
                    state.pauseTotal + (time - state.pauseTime) + maxTimeDeviation
                );
                expect(diff.igtPauseTotal).to.be.within(
                    state.igtPauseTotal + (time - state.igtPauseTime),
                    state.igtPauseTotal + (time - state.igtPauseTime) + maxTimeDeviation
                );
                expect(diff.finishTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should finish the paused IGT timer correctly [RUNNING_IGT_PAUSED => FINISHED]', () => {
                const state: TimerState = {
                    status: TimerStatus.RUNNING_IGT_PAUSE,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.FINISHED);

                expect(diff.status).to.deep.equal(TimerStatus.FINISHED);
                expect(diff.igtPauseTime).to.equal(0);
                expect(diff.igtPauseTotal).to.be.within(
                    state.igtPauseTotal + (time - state.igtPauseTime),
                    state.igtPauseTotal + (time - state.igtPauseTime) + maxTimeDeviation
                );
                expect(diff.finishTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should finish the running timer correctly [RUNNING => FINISHED]', () => {
                const state: TimerState = {
                    status: TimerStatus.RUNNING,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const time = now();
                const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.FINISHED);

                expect(diff.status).to.deep.equal(TimerStatus.FINISHED);
                expect(diff.finishTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should do nothing when switching from an invalid status to finished [* => FINISHED]', () => {
                const initialState: TimerState = {
                    status: null,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                [
                    undefined,
                    null,
                    'strings',
                    123,
                    -123,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    [],
                    TimerStatus.STOPPED,
                    TimerStatus.FINISHED,
                ].forEach((invalidStatus: any) => {
                    const state = {
                        ...initialState,
                        status: invalidStatus,
                    };

                    const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.FINISHED);

                    expect(diff).to.deep.equal({});
                });
            });

            it('should clean up the timer correctly [RUNNING/RUNNING_IGT_PAUSED/PAUSED/FINISHED => FINISHED]', () => {
                const initialState: TimerState = {
                    status: null,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                [
                    TimerStatus.RUNNING,
                    TimerStatus.RUNNING_IGT_PAUSE,
                    TimerStatus.PAUSED,
                    TimerStatus.FINISHED
                ].forEach(status => {
                    const state = {
                        ...initialState,
                        status: status,
                    };

                    const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.STOPPED);

                    expect(diff).to.deep.equal({
                        status: TimerStatus.STOPPED,
                        startTime: 0,
                        pauseTime: 0,
                        igtPauseTime: 0,
                        pauseTotal: 0,
                        igtPauseTotal: 0,
                        finishTime: 0,
                    });
                });
            });

            it('should do nothing when switching from an invalid status to stopped [* => STOPPED]', () => {
                const initialState: TimerState = {
                    status: null,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                [
                    undefined,
                    null,
                    'strings',
                    123,
                    -123,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    [],
                    TimerStatus.STOPPED,
                ].forEach((invalidStatus: any) => {
                    const state = {
                        ...initialState,
                        status: invalidStatus,
                    };

                    const diff = timerModule.handlers[ID_HANDLER_SET_STATUS](state, TimerStatus.STOPPED);

                    expect(diff).to.deep.equal({});
                });
            });
        });
    });
});
