import { expect } from 'chai';
import { v4 as uuid } from 'uuid';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { Segment } from '../../../src/common/interfaces/segment';
import { TimerStatus } from '../../../src/common/timer-status';
import {
    ACTION_START,
    getSplitsStoreModule,
    ID_ACTION_START,
    ID_MUTATION_ADD_SEGMENT,
    ID_MUTATION_CLEAR_SEGMENTS,
    ID_MUTATION_HARD_RESET,
    ID_MUTATION_REMOVE_SEGMENT,
    ID_MUTATION_SET_ALL_SEGMENTS,
    ID_MUTATION_SET_CURRENT,
    ID_MUTATION_SET_CURRENT_OPEN_FILE,
    ID_MUTATION_SET_SEGMENT,
    ID_MUTATION_SOFT_RESET,
    MUTATION_ADD_SEGMENT,
    MUTATION_CLEAR_SEGMENTS,
    MUTATION_HARD_RESET,
    MUTATION_REMOVE_SEGMENT,
    MUTATION_SET_ALL_SEGMENTS,
    MUTATION_SET_CURRENT,
    MUTATION_SET_CURRENT_OPEN_FILE,
    MUTATION_SET_SEGMENT,
    MUTATION_SOFT_RESET,
    ACTION_SPLIT,
    ID_ACTION_SPLIT,
    ID_ACTION_SOFT_RESET,
} from '../../../src/store/modules/splits.module';
import { MUTATION_SET_STATUS, timerStoreModule } from '../../../src/store/modules/timer.module';
import { RootState } from '../../../src/store/states/root.state';
import { SplitsState } from '../../../src/store/states/splits.state';
import { TimerState } from '../../../src/store/states/timer.state';
import { now } from '../../../src/utils/time';
import { createMockInjector, testAction } from '../../mocks/utils';
import { ACTION_SKIP, ID_ACTION_SKIP } from '../../../src/store/modules/splits.module';

// Initialize the Dependency-Injection
const injector = createMockInjector();

Vue.use(Vuex);

function randomInt(max: number, min: number = 1): number {
    return Math.max(min, Math.floor(Math.random() * Math.floor(max)));
}

function generateSegmentArray(size: number): Segment[] {
    return new Array(size)
        .fill(null)
        .map(_ => ({
            id: uuid(),
            name: 'test',
            time: randomInt(99999),
            hasNewOverallBest: true,
            hasNewPersonalBest: true,
            overallBest: randomInt(99999),
            passed: true,
            pauseTime: randomInt(99999),
            personalBest: randomInt(99999),
            previousOverallBest: randomInt(99999),
            previousPersonalBest: randomInt(99999),
            skipped: false,
            startTime: now(),
        }));
}

describe('Splits Store-Module', () => {
    const splitsModule: Module<SplitsState, RootState> = getSplitsStoreModule(injector);
    const timerModule: Module<TimerState, RootState> = timerStoreModule;
    // const electron = injector.get(ELECTRON_INTERFACE_TOKEN) as ElectronMockService;

    describe('mutations', () => {
        describe(MUTATION_SET_CURRENT, () => {
            it('should apply the mutation correctly', () => {
                const newCurrent = 15;

                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: generateSegmentArray(20),
                };

                splitsModule.mutations[ID_MUTATION_SET_CURRENT](state, newCurrent);
                expect(state.current).to.equal(newCurrent);

                [
                    null,
                    undefined,
                    'invalid',
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    -2,
                    state.segments.length,
                    {},
                    [],
                    true,
                    false
                ].forEach(invalidCurrent => {
                    splitsModule.mutations[ID_MUTATION_SET_CURRENT](state, newCurrent);
                    expect(state.current).to.equal(newCurrent);
                });
            });
        });

        describe(MUTATION_SET_CURRENT_OPEN_FILE, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [],
                };

                const newCurrentFile = 'test';
                splitsModule.mutations[ID_MUTATION_SET_CURRENT_OPEN_FILE](state, newCurrentFile);

                expect(state.currentOpenFile).to.equal(newCurrentFile);
            });
        });

        describe(MUTATION_ADD_SEGMENT, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [],
                };

                const segmentOne: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentOne);

                expect(state.segments.length).to.equal(1);
                expect(state.segments[0].id).to.equal(segmentOne.id);

                const segmentTwo: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentTwo);

                expect(state.segments.length).to.equal(2);
                expect(state.segments[0].id).to.equal(segmentOne.id);
                expect(state.segments[1].id).to.equal(segmentTwo.id);

                const segmentThree: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentThree);

                expect(state.segments.length).to.equal(3);
                expect(state.segments[0].id).to.equal(segmentOne.id);
                expect(state.segments[1].id).to.equal(segmentTwo.id);
                expect(state.segments[2].id).to.equal(segmentThree.id);
            });
        });

        describe(MUTATION_SET_SEGMENT, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [
                        { id: '0', name: '0' },
                        { id: '1', name: '1' },
                        { id: '2', name: '2' },
                    ]
                };

                const newSegment: Segment = {
                    id: uuid(),
                    name: 'test'
                };

                splitsModule.mutations[ID_MUTATION_SET_SEGMENT](state, { index: 0, segment: newSegment });

                expect(state.segments.length).to.equal(3);
                expect(state.segments[0].id).to.equal(newSegment.id);
                expect(state.segments[1].id).to.equal('1');
                expect(state.segments[2].id).to.equal('2');
            });
        });

        describe(MUTATION_SET_ALL_SEGMENTS, () => {
            it('should apply the mutation correctly', () => {
                const originalSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: originalSegments.slice(0),
                };

                expect(state.segments.length).to.equal(originalSegments.length);
                expect(state.segments).to.deep.eq(originalSegments);

                const newSegments = generateSegmentArray(10);

                splitsModule.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, newSegments);

                expect(state.segments.length).to.equal(newSegments.length);
                expect(state.segments).to.deep.eq(newSegments);
            });
        });

        describe(MUTATION_REMOVE_SEGMENT, () => {
            it('should apply the mutation correctly', () => {
                const deleteIndicies = [0, 1, 2];
                const originalSegments = generateSegmentArray(deleteIndicies.length);

                deleteIndicies.forEach(deleteIndex => {
                    const state: SplitsState = {
                        current: -1,
                        currentOpenFile: null,
                        segments: originalSegments.slice(0),
                    };

                    splitsModule.mutations[ID_MUTATION_REMOVE_SEGMENT](state, deleteIndex);

                    // Create a copy
                    const expectedSegments = originalSegments.slice(0);
                    // Remove the item like it should in the mutation
                    expectedSegments.splice(deleteIndex, 1);

                    expect(state.segments.length).to.equal(expectedSegments.length);
                    expect(state.segments).to.deep.eq(expectedSegments);
                });
            });

            it('should handle errors', () => {
                const originalSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: originalSegments.slice(0),
                };

                [
                    null,
                    undefined,
                    'invalid',
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    originalSegments.length,
                    -1,
                    {},
                    [],
                    true,
                    false
                ].forEach(value => {
                    splitsModule.mutations[ID_MUTATION_REMOVE_SEGMENT](state, value);
                    expect(state.segments.length).to.equal(originalSegments.length);
                    expect(state.segments).to.deep.eq(originalSegments);
                });
            });
        });

        describe(MUTATION_CLEAR_SEGMENTS, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [
                        { id: 'test', name: 'test' },
                    ],
                };

                splitsModule.mutations[ID_MUTATION_CLEAR_SEGMENTS](state, null);

                expect(state.segments.length).to.equal(0);
            });
        });

        describe(MUTATION_SOFT_RESET, () => {
            it('should apply the mutation correctly', () => {
                const originalSegments: Segment[] = generateSegmentArray(10);
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    // Create a copy
                    segments: originalSegments.slice(0),
                };

                splitsModule.mutations[ID_MUTATION_SOFT_RESET](state, null);

                state.segments.forEach((segment, index) => {
                    expect(segment.id).to.equal(originalSegments[index].id);
                    expect(segment.name).to.equal(originalSegments[index].name);
                    expect(segment.time).to.equal(originalSegments[index].time);
                    expect(segment.pauseTime).to.equal(originalSegments[index].pauseTime);
                    expect(segment.personalBest).to.equal(originalSegments[index].personalBest);
                    expect(segment.overallBest).to.equal(originalSegments[index].overallBest);

                    expect(segment.hasNewOverallBest).to.equal(false);
                    expect(segment.hasNewPersonalBest).to.equal(false);
                    expect(segment.previousOverallBest).to.equal(-1);
                    expect(segment.previousPersonalBest).to.equal(-1);
                    expect(segment.startTime).to.equal(-1);
                    expect(segment.skipped).to.equal(false);
                    expect(segment.passed).to.equal(false);
                });
            });
        });

        describe(MUTATION_HARD_RESET, () => {
            it('should apply the mutation correctly', () => {
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'none',
                        time: randomInt(99999),
                        pauseTime: randomInt(99999),
                        personalBest: randomInt(99999),
                        hasNewOverallBest: false,
                        previousPersonalBest: randomInt(99999),
                        overallBest: randomInt(99999),
                        hasNewPersonalBest: false,
                        previousOverallBest: randomInt(99999),
                    },
                    {
                        id: uuid(),
                        name: 'pb',
                        time: randomInt(99999),
                        pauseTime: randomInt(99999),
                        personalBest: randomInt(99999),
                        hasNewPersonalBest: true,
                        previousPersonalBest: randomInt(99999),
                        overallBest: randomInt(99999),
                        hasNewOverallBest: false,
                        previousOverallBest: randomInt(99999),
                    },
                    {
                        id: uuid(),
                        name: 'ob',
                        time: randomInt(99999),
                        pauseTime: randomInt(99999),
                        personalBest: randomInt(99999),
                        hasNewPersonalBest: false,
                        previousPersonalBest: randomInt(99999),
                        overallBest: randomInt(99999),
                        hasNewOverallBest: true,
                        previousOverallBest: randomInt(99999),
                    },
                    {
                        id: uuid(),
                        name: 'both',
                        time: randomInt(99999),
                        pauseTime: randomInt(99999),
                        personalBest: randomInt(99999),
                        hasNewPersonalBest: true,
                        previousPersonalBest: randomInt(99999),
                        overallBest: randomInt(99999),
                        hasNewOverallBest: true,
                        previousOverallBest: randomInt(99999),
                    }
                ];

                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: originalSegments.slice(0),
                };

                splitsModule.mutations[ID_MUTATION_HARD_RESET](state, null);

                expect(state.segments[0].id).to.equal(originalSegments[0].id);
                expect(state.segments[0].name).to.equal(originalSegments[0].name);
                expect(state.segments[0].time).to.equal(originalSegments[0].time);
                expect(state.segments[0].pauseTime).to.equal(originalSegments[0].pauseTime);
                expect(state.segments[0].personalBest).to.equal(originalSegments[0].personalBest);
                expect(state.segments[0].overallBest).to.equal(originalSegments[0].overallBest);
                expect(state.segments[0].hasNewPersonalBest).to.equal(false);
                expect(state.segments[0].previousPersonalBest).to.equal(-1);
                expect(state.segments[0].hasNewOverallBest).to.equal(false);
                expect(state.segments[0].previousOverallBest).to.equal(-1);
                expect(state.segments[0].startTime).to.equal(-1);
                expect(state.segments[0].skipped).to.equal(false);
                expect(state.segments[0].passed).to.equal(false);

                expect(state.segments[1].id).to.equal(originalSegments[1].id);
                expect(state.segments[1].name).to.equal(originalSegments[1].name);
                expect(state.segments[1].time).to.equal(originalSegments[1].time);
                expect(state.segments[1].pauseTime).to.equal(originalSegments[1].pauseTime);
                expect(state.segments[1].personalBest).to.equal(originalSegments[1].previousPersonalBest);
                expect(state.segments[1].overallBest).to.equal(originalSegments[1].overallBest);
                expect(state.segments[1].hasNewPersonalBest).to.equal(false);
                expect(state.segments[1].previousPersonalBest).to.equal(-1);
                expect(state.segments[1].hasNewOverallBest).to.equal(false);
                expect(state.segments[1].previousOverallBest).to.equal(-1);
                expect(state.segments[1].startTime).to.equal(-1);
                expect(state.segments[1].skipped).to.equal(false);
                expect(state.segments[1].passed).to.equal(false);

                expect(state.segments[2].id).to.equal(originalSegments[2].id);
                expect(state.segments[2].name).to.equal(originalSegments[2].name);
                expect(state.segments[2].time).to.equal(originalSegments[2].time);
                expect(state.segments[2].pauseTime).to.equal(originalSegments[2].pauseTime);
                expect(state.segments[2].personalBest).to.equal(originalSegments[2].personalBest);
                expect(state.segments[2].overallBest).to.equal(originalSegments[2].previousOverallBest);
                expect(state.segments[2].hasNewPersonalBest).to.equal(false);
                expect(state.segments[2].previousPersonalBest).to.equal(-1);
                expect(state.segments[2].hasNewOverallBest).to.equal(false);
                expect(state.segments[2].previousOverallBest).to.equal(-1);
                expect(state.segments[2].startTime).to.equal(-1);
                expect(state.segments[2].skipped).to.equal(false);
                expect(state.segments[2].passed).to.equal(false);

                expect(state.segments[3].id).to.equal(originalSegments[3].id);
                expect(state.segments[3].name).to.equal(originalSegments[3].name);
                expect(state.segments[3].time).to.equal(originalSegments[3].time);
                expect(state.segments[3].pauseTime).to.equal(originalSegments[3].pauseTime);
                expect(state.segments[3].personalBest).to.equal(originalSegments[3].previousPersonalBest);
                expect(state.segments[3].overallBest).to.equal(originalSegments[3].previousOverallBest);
                expect(state.segments[3].hasNewPersonalBest).to.equal(false);
                expect(state.segments[3].previousPersonalBest).to.equal(-1);
                expect(state.segments[3].hasNewOverallBest).to.equal(false);
                expect(state.segments[3].previousOverallBest).to.equal(-1);
                expect(state.segments[3].startTime).to.equal(-1);
                expect(state.segments[3].skipped).to.equal(false);
                expect(state.segments[3].passed).to.equal(false);
            });
        });
    });

    describe('actions', () => {
        describe(ACTION_START, () => {
            it('should start the splits and timer', async () => {
                const startTime = now();
                const segments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: segments,
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                            startTime: -1,
                        },
                    }
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_START], {
                    state, rootState
                });

                expect(commits).to.have.lengthOf(3);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;

                expect(commits[0].type).to.equal(MUTATION_SET_STATUS);
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload).to.exist;
                // Either current time or +1, as it may be a millisecond off
                expect(commits[0].payload.time).to.be.within(startTime, startTime + 1);
                expect(commits[0].payload.status).to.equal(TimerStatus.RUNNING);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_SEGMENT);
                // tslint:disable-next-line:no-unused-expression
                expect(commits[1].payload).to.exist;
                expect(commits[1].payload.index).to.equal(0);
                expect(commits[1].payload.segment.id).to.equal(segments[0].id);
                expect(commits[1].payload.segment.startTime).to.be.within(startTime, startTime + 1);

                expect(commits[2]).to.deep.equal({ type: ID_MUTATION_SET_CURRENT, payload: 0 });
            });

            it('should not start without segments', async () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [],
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                            startTime: -1,
                        },
                    }
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_START], {
                    state, rootState
                });

                // tslint:disable-next-line:no-unused-expression
                expect(commits).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
            });

            it('should not start when the timer is not stopped', async () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [],
                };

                const statuses = [TimerStatus.FINISHED, TimerStatus.PAUSED, TimerStatus.RUNNING];
                for (const status of statuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: -1,
                            },
                        }
                    };

                    const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_START], {
                        state, rootState
                    });

                    // tslint:disable-next-line:no-unused-expression
                    expect(commits).to.be.empty;
                    // tslint:disable-next-line:no-unused-expression
                    expect(dispatches).to.be.empty;
                }
            });
        });

        describe(ACTION_SPLIT, () => {
            it('should not do anything while not running', async () => {
                const state: SplitsState = {
                    current: -1,
                    currentOpenFile: null,
                    segments: [],
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                // tslint:disable-next-line:no-unused-expression
                expect(commits).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
            });

            it('should split to the next segment', async () => {
                const segmentTime = 20_000;
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTime,
                        personalBest: -1,
                        overallBest: -1,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        time: 123,
                        passed: true,
                        skipped: true,
                    }
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    }
                };

                const time = now();
                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits).to.be.lengthOf(3);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                // tslint:disable-next-line:no-unused-expression
                expect(commits[0].payload).to.exist;
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.time).to.be.within(segmentTime, segmentTime + 1);
                expect(commits[0].payload.segment.passed).to.equal(true);
                expect(commits[0].payload.segment.skipped).to.equal(false);
                expect(commits[0].payload.segment.hasNewPersonalBest).to.equal(true);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(true);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_SEGMENT);
                // tslint:disable-next-line:no-unused-expression
                expect(commits[1].payload).to.exist;
                expect(commits[1].payload.index).to.equal(currentIndex + 1);
                expect(commits[1].payload.segment.id).to.equal(segments[currentIndex + 1].id);
                expect(commits[1].payload.segment.startTime).to.be.within(time, time + 1);
                expect(commits[1].payload.segment.passed).to.equal(false);
                expect(commits[1].payload.segment.skipped).to.equal(false);

                expect(commits[2].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[2].payload).to.equal(currentIndex + 1);
            });

            it('should apply personal bests correctly', async () => {
                const segmentTime = 20_000;
                const personalBest = 25_000;
                const overallBest = 10_000;
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTime,
                        personalBest: personalBest,
                        overallBest: overallBest,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        time: 123,
                        passed: true,
                        skipped: true,
                    }
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    }
                };

                const { commits } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.hasNewPersonalBest).to.equal(true);
                expect(commits[0].payload.segment.personalBest).to.be.within(segmentTime, segmentTime + 1);
                expect(commits[0].payload.segment.previousPersonalBest).to.equal(personalBest);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.overallBest).to.equal(overallBest);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(-1);
            });

            it('should not apply personal bests', async () => {
                const segmentTime = 25_000;
                const personalBest = 20_000;
                const overallBest = 10_000;
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTime,
                        personalBest: personalBest,
                        overallBest: overallBest,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        time: 123,
                        passed: true,
                        skipped: true,
                    }
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    }
                };

                const { commits } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.hasNewPersonalBest).to.equal(false);
                expect(commits[0].payload.segment.personalBest).to.equal(personalBest);
                expect(commits[0].payload.segment.previousPersonalBest).to.equal(-1);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.overallBest).to.equal(overallBest);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(-1);
            });

            it('should apply overall bests correctly', async () => {
                const segmentTime = 5_000;
                const personalBest = 25_000;
                const overallBest = 10_000;
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTime,
                        personalBest: personalBest,
                        overallBest: overallBest,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        time: 123,
                        passed: true,
                        skipped: true,
                    }
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    }
                };

                const { commits } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.hasNewPersonalBest).to.equal(true);
                expect(commits[0].payload.segment.personalBest).to.be.within(segmentTime, segmentTime + 1);
                expect(commits[0].payload.segment.previousPersonalBest).to.equal(personalBest);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(true);
                expect(commits[0].payload.segment.overallBest).to.be.within(segmentTime, segmentTime + 1);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(overallBest);
            });

            it('should not apply overall bests', async () => {
                const segmentTime = 25_000;
                const personalBest = 20_000;
                const overallBest = 10_000;
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTime,
                        personalBest: personalBest,
                        overallBest: overallBest,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        time: 123,
                        passed: true,
                        skipped: true,
                    }
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    }
                };

                const { commits } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.hasNewPersonalBest).to.equal(false);
                expect(commits[0].payload.segment.personalBest).to.equal(personalBest);
                expect(commits[0].payload.segment.previousPersonalBest).to.equal(-1);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.overallBest).to.equal(overallBest);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(-1);
            });

            it('should finish after the last split', async () => {
                const state: SplitsState = {
                    current: 0,
                    currentOpenFile: null,
                    segments: generateSegmentArray(1),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state, rootState,
                });

                expect(commits).to.be.lengthOf(2);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;

                expect(commits[1].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[1].payload).to.equal(TimerStatus.FINISHED);
            });

            it('should reset after the run is finished', async () => {
                const state: SplitsState = {
                    current: 1,
                    currentOpenFile: null,
                    segments: generateSegmentArray(1),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.FINISHED,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state, rootState,
                });

                // tslint:disable-next-line:no-unused-expression
                expect(commits).to.be.empty;
                expect(dispatches).to.be.lengthOf(1);

                expect(dispatches[0].type).to.equal(ID_ACTION_SOFT_RESET);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches[0].payload).to.not.exist;
            });
        });

        describe(ACTION_SKIP, () => {
            it('should skip to the next segment', async () => {
                const segments = generateSegmentArray(5);
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const { commits, dispatches, response } = await testAction(splitsModule.actions[ID_ACTION_SKIP], {
                    state, rootState
                });

                expect(commits).to.be.lengthOf(2);
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                expect(response).to.equal(true);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.time).to.equal(-1);
                expect(commits[0].payload.segment.startTime).to.equal(-1);
                expect(commits[0].payload.segment.skipped).to.equal(true);
                expect(commits[0].payload.segment.passed).to.equal(false);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[1].payload).to.equal(currentIndex + 1);
            });

            it('should not skip when timer is not running', async () => {
                const segments = generateSegmentArray(5);
                const currentIndex = 1;

                const invalidStatuses = [TimerStatus.STOPPED, TimerStatus.PAUSED, TimerStatus.FINISHED];
                for (const status of invalidStatuses) {
                    const state: SplitsState = {
                        current: currentIndex,
                        currentOpenFile: null,
                        segments: segments.slice(0),
                    };

                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            }
                        }
                    };

                    const { commits, dispatches, response } = await testAction(splitsModule.actions[ID_ACTION_SKIP], {
                        state, rootState
                    });

                    // tslint:disable-next-line:no-unused-expression
                    expect(commits).to.be.empty;
                    // tslint:disable-next-line:no-unused-expression
                    expect(dispatches).to.be.empty;
                    expect(response).to.equal(false);
                }
            });

            it('should not skip when it is the last segment', async () => {
                const segments = generateSegmentArray(5);
                const currentIndex = segments.length - 1;
                const state: SplitsState = {
                    current: currentIndex,
                    currentOpenFile: null,
                    segments: segments.slice(0),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const { commits, dispatches, response } = await testAction(splitsModule.actions[ID_ACTION_SKIP], {
                    state, rootState
                });

                // tslint:disable-next-line:no-unused-expression
                expect(commits).to.be.empty;
                // tslint:disable-next-line:no-unused-expression
                expect(dispatches).to.be.empty;
                expect(response).to.equal(false);
            });
        });
    });
});
