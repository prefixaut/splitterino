/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { TimerStatus } from '../../../src/common/timer-status';
import { RootState } from '../../../src/models/states/root.state';
import { TimerState } from '../../../src/models/states/timer.state';
import {
    getTimerStoreModule,
    ID_MUTATION_SET_START_DELAY,
    ID_MUTATION_SET_STATUS,
    MUTATION_SET_START_DELAY,
    MUTATION_SET_STATUS,
} from '../../../src/store/modules/timer.module';
import { now } from '../../../src/utils/time';
import { randomInt } from '../../utils';

Vue.use(Vuex);

const maxTimeDeviation = 1;

describe('Timer Store-Module', () => {
    const timerModule: Module<TimerState, RootState> = getTimerStoreModule();

    it('should be a valid module', () => {
        expect(timerModule).to.be.a('object');
        expect(timerModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        expect(timerModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
    });

    describe('mutations', () => {

        describe(MUTATION_SET_START_DELAY, () => {
            it('should apply the mutation correctly', () => {
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

                timerModule.mutations[ID_MUTATION_SET_START_DELAY](state, newDelay);
                expect(state.startDelay).to.equal(newDelay);
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
                    timerModule.mutations[ID_MUTATION_SET_START_DELAY](state, newDelay);
                    expect(state.startDelay).to.equal(
                        originalDelay,
                        `Applied wrongfully following delay: "${newDelay}"!`
                    );
                });
            });
        });

        describe(MUTATION_SET_STATUS, () => {
            it('should not switch to an invalid status', () => {
                const initialState: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };
                const state: TimerState = { ...initialState };

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
                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, invalidStatus);

                    expect(state.status).to.equal(initialState.status);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(initialState.startTime);
                    expect(state.pauseTime).to.equal(initialState.pauseTime);
                    expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                    expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                    expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                    expect(state.finishTime).to.equal(initialState.finishTime);

                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, { time: now(), status: invalidStatus });

                    expect(state.status).to.equal(initialState.status);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(initialState.startTime);
                    expect(state.pauseTime).to.equal(initialState.pauseTime);
                    expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                    expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                    expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                    expect(state.finishTime).to.equal(initialState.finishTime);
                });
            });

            it('should should use the provided time when switching the status', () => {
                const time = now() - 20_000;
                const initialState: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };
                const state: TimerState = { ...initialState };

                timerModule.mutations[ID_MUTATION_SET_STATUS](state, { time, status: TimerStatus.RUNNING });

                expect(state.status).to.equal(TimerStatus.RUNNING);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(time);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should start the timer correctly [STOPPED => RUNNING]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.STOPPED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };
                const state: TimerState = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING);

                expect(state.status).to.equal(TimerStatus.RUNNING);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.be.within(time, time + maxTimeDeviation);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should unpause the timer correctly [PAUSED => RUNNING]', () => {
                const time = now();
                const pauseTime = 20_000;

                const initialState: TimerState = {
                    status: TimerStatus.PAUSED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: time - pauseTime,
                    igtPauseTime: time - pauseTime,
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state: TimerState = { ...initialState };

                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING);

                expect(state.status).to.equal(TimerStatus.RUNNING);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(0);
                expect(state.igtPauseTime).to.equal(0);
                expect(state.pauseTotal).to.be.within(
                    initialState.pauseTotal + pauseTime, initialState.pauseTotal + pauseTime + maxTimeDeviation);
                expect(state.igtPauseTotal).to.be.within(
                    initialState.igtPauseTotal + pauseTime, initialState.igtPauseTotal + pauseTime + maxTimeDeviation);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should unpause (IGT only) the timer correctly [RUNNING_IGT_PAUSED => RUNNING]', () => {
                const time = now();
                const pauseTime = 20_000;

                const initialState: TimerState = {
                    status: TimerStatus.RUNNING_IGT_PAUSE,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: time - pauseTime,
                    igtPauseTime: time - pauseTime,
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state: TimerState = { ...initialState };

                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING);
                expect(state.status).to.equal(TimerStatus.RUNNING);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.equal(0);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.be.within(
                    initialState.igtPauseTotal + pauseTime, initialState.igtPauseTotal + pauseTime + maxTimeDeviation);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should unpause (IGT only) the timer correctly [FINISHED => RUNNING]', () => {
                const time = now();
                const pauseTime = 20_000;

                const initialState: TimerState = {
                    status: TimerStatus.FINISHED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: time - pauseTime,
                    igtPauseTime: time - pauseTime,
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state: TimerState = { ...initialState };

                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING);
                expect(state.status).to.equal(TimerStatus.RUNNING);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(0);
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

                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING);

                    expect(state.status).to.deep.equal(invalidStatus);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(initialState.startTime);
                    expect(state.pauseTime).to.equal(initialState.pauseTime);
                    expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                    expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                    expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                    expect(state.finishTime).to.equal(initialState.finishTime);
                });
            });

            it('should pause the RTA timer now as well [RUNNING_IGT_PAUSED => PAUSED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.RUNNING_IGT_PAUSE,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.PAUSED);

                expect(state.status).to.deep.equal(TimerStatus.PAUSED);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.be.within(time, time + maxTimeDeviation);
                expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should pause both timers [RUNNING => PAUSED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.RUNNING,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.PAUSED);

                expect(state.status).to.deep.equal(TimerStatus.PAUSED);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.be.within(time, time + maxTimeDeviation);
                expect(state.igtPauseTime).to.be.within(time, time + maxTimeDeviation);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
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

                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.PAUSED);

                    expect(state.status).to.deep.equal(invalidStatus);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(initialState.startTime);
                    expect(state.pauseTime).to.equal(initialState.pauseTime);
                    expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                    expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                    expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                    expect(state.finishTime).to.equal(initialState.finishTime);
                });
            });

            it('should pause the IGT timer correctly [RUNNING => RUNNING_IGT_PAUSED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.RUNNING,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                expect(state.status).to.deep.equal(TimerStatus.RUNNING_IGT_PAUSE);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.be.within(time, time + maxTimeDeviation);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should set it back to running but keep the IGT timer paused [FINISHED => RUNNING_IGT_PAUSED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.FINISHED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                expect(state.status).to.deep.equal(TimerStatus.RUNNING_IGT_PAUSE);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.be.within(time, time + maxTimeDeviation);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
            });

            it('should unpause the RTA timer but keep the IGT timer paused [PAUSED => RUNNING_IGT_PAUSED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.PAUSED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                expect(state.status).to.deep.equal(TimerStatus.RUNNING_IGT_PAUSE);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(0);
                expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                expect(state.pauseTotal).to.be.within(
                    initialState.pauseTotal + (time - initialState.pauseTime),
                    initialState.pauseTotal + (time - initialState.pauseTime) + maxTimeDeviation
                );
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.equal(initialState.finishTime);
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

                        timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.RUNNING_IGT_PAUSE);

                        expect(state.status).to.deep.equal(invalidStatus);
                        expect(state.startDelay).to.equal(initialState.startDelay);
                        expect(state.startTime).to.equal(initialState.startTime);
                        expect(state.pauseTime).to.equal(initialState.pauseTime);
                        expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                        expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                        expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                        expect(state.finishTime).to.equal(initialState.finishTime);
                    });
                });

            it('should finish the timer when it was paused previously [PAUSED => FINISHED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.PAUSED,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.FINISHED);

                expect(state.status).to.deep.equal(TimerStatus.FINISHED);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(0);
                expect(state.igtPauseTime).to.equal(0);
                expect(state.pauseTotal).to.be.within(
                    initialState.pauseTotal + (time - initialState.pauseTime),
                    initialState.pauseTotal + (time - initialState.pauseTime) + maxTimeDeviation
                );
                expect(state.igtPauseTotal).to.be.within(
                    initialState.igtPauseTotal + (time - initialState.igtPauseTime),
                    initialState.igtPauseTotal + (time - initialState.igtPauseTime) + maxTimeDeviation
                );
                expect(state.finishTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should finish the paused IGT timer correctly [RUNNING_IGT_PAUSED => FINISHED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.RUNNING_IGT_PAUSE,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.FINISHED);

                expect(state.status).to.deep.equal(TimerStatus.FINISHED);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.equal(0);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.be.within(
                    initialState.igtPauseTotal + (time - initialState.igtPauseTime),
                    initialState.igtPauseTotal + (time - initialState.igtPauseTime) + maxTimeDeviation
                );
                expect(state.finishTime).to.be.within(time, time + maxTimeDeviation);
            });

            it('should finish the running timer correctly [RUNNING => FINISHED]', () => {
                const initialState: TimerState = {
                    status: TimerStatus.RUNNING,
                    startDelay: randomInt(99_999),
                    startTime: randomInt(99_999),
                    pauseTime: randomInt(99_999),
                    igtPauseTime: randomInt(99_999),
                    pauseTotal: randomInt(99_999),
                    igtPauseTotal: randomInt(99_999),
                    finishTime: randomInt(99_999),
                };

                const state = { ...initialState };

                const time = now();
                timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.FINISHED);

                expect(state.status).to.deep.equal(TimerStatus.FINISHED);
                expect(state.startDelay).to.equal(initialState.startDelay);
                expect(state.startTime).to.equal(initialState.startTime);
                expect(state.pauseTime).to.equal(initialState.pauseTime);
                expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                expect(state.finishTime).to.be.within(time, time + maxTimeDeviation);
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

                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.FINISHED);

                    expect(state.status).to.deep.equal(invalidStatus);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(initialState.startTime);
                    expect(state.pauseTime).to.equal(initialState.pauseTime);
                    expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                    expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                    expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                    expect(state.finishTime).to.equal(initialState.finishTime);
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

                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.STOPPED);

                    expect(state.status).to.deep.equal(TimerStatus.STOPPED);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(0);
                    expect(state.pauseTime).to.equal(0);
                    expect(state.igtPauseTime).to.equal(0);
                    expect(state.pauseTotal).to.equal(0);
                    expect(state.igtPauseTotal).to.equal(0);
                    expect(state.finishTime).to.equal(0);
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

                    timerModule.mutations[ID_MUTATION_SET_STATUS](state, TimerStatus.STOPPED);

                    expect(state.status).to.deep.equal(invalidStatus);
                    expect(state.startDelay).to.equal(initialState.startDelay);
                    expect(state.startTime).to.equal(initialState.startTime);
                    expect(state.pauseTime).to.equal(initialState.pauseTime);
                    expect(state.igtPauseTime).to.equal(initialState.igtPauseTime);
                    expect(state.pauseTotal).to.equal(initialState.pauseTotal);
                    expect(state.igtPauseTotal).to.equal(initialState.igtPauseTotal);
                    expect(state.finishTime).to.equal(initialState.finishTime);
                });
            });
        });
    });
});
