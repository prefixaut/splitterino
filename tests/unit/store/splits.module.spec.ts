/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';
import { v4 as uuid } from 'uuid';
import Vue from 'vue';
import Vuex, { Module } from 'vuex';

import { TimerStatus } from '../../../src/common/timer-status';
import { ELECTRON_INTERFACE_TOKEN } from '../../../src/models/electron';
import { Segment, SegmentTime, TimingMethod } from '../../../src/models/segment';
import { RootState } from '../../../src/models/states/root.state';
import { SplitsState } from '../../../src/models/states/splits.state';
import {
    ACTION_DISCARDING_RESET,
    ACTION_PAUSE,
    ACTION_RESET,
    ACTION_SAVING_RESET,
    ACTION_SET_ALL_SEGMENTS,
    ACTION_SKIP,
    ACTION_SPLIT,
    ACTION_START,
    ACTION_UNDO,
    ACTION_UNPAUSE,
    getSplitsStoreModule,
    ID_ACTION_DISCARDING_RESET,
    ID_ACTION_PAUSE,
    ID_ACTION_RESET,
    ID_ACTION_SAVING_RESET,
    ID_ACTION_SET_ALL_SEGMENTS,
    ID_ACTION_SKIP,
    ID_ACTION_SPLIT,
    ID_ACTION_START,
    ID_ACTION_UNDO,
    ID_ACTION_UNPAUSE,
    ID_MUTATION_ADD_SEGMENT,
    ID_MUTATION_CLEAR_SEGMENTS,
    ID_MUTATION_DISCARDING_RESET,
    ID_MUTATION_REMOVE_SEGMENT,
    ID_MUTATION_SAVING_RESET,
    ID_MUTATION_SET_ALL_SEGMENTS,
    ID_MUTATION_SET_CURRENT,
    ID_MUTATION_SET_PREVIOUS_IGT_TIME,
    ID_MUTATION_SET_PREVIOUS_RTA_TIME,
    ID_MUTATION_SET_SEGMENT,
    ID_MUTATION_SET_TIMING,
    MUTATION_ADD_SEGMENT,
    MUTATION_CLEAR_SEGMENTS,
    MUTATION_DISCARDING_RESET,
    MUTATION_REMOVE_SEGMENT,
    MUTATION_SAVING_RESET,
    MUTATION_SET_ALL_SEGMENTS,
    MUTATION_SET_CURRENT,
    MUTATION_SET_PREVIOUS_IGT_TIME,
    MUTATION_SET_PREVIOUS_RTA_TIME,
    MUTATION_SET_SEGMENT,
    MUTATION_SET_TIMING,
} from '../../../src/store/modules/splits.module';
import { MUTATION_SET_STATUS } from '../../../src/store/modules/timer.module';
import { getFinalTime, now } from '../../../src/utils/time';
import { ElectronMockService } from '../../mocks/electron-mock.service';
import { createMockInjector, randomInt, testAction } from '../../utils';

// Initialize the Dependency-Injection
const injector = createMockInjector();
const maxTimeDeviation = 1;

Vue.use(Vuex);

function generateRandomTime(): SegmentTime {
    const rawTime = randomInt(99999, 100);
    const pauseTime = randomInt(rawTime - 1, 1);

    return {
        igt: {
            rawTime,
            pauseTime,
        },
        rta: {
            rawTime,
            pauseTime,
        }
    };
}

function generateSegmentArray(size: number): Segment[] {
    return new Array(size).fill(null).map(_ => ({
        id: uuid(),
        name: 'test',
        currentTime: generateRandomTime(),
        hasNewOverallBest: true,
        overallBest: generateRandomTime(),
        passed: true,
        personalBest: generateRandomTime(),
        previousOverallBest: generateRandomTime(),
        skipped: false,
        startTime: now(),
    }));
}

describe('Splits Store-Module', () => {
    const splitsModule: Module<SplitsState, RootState> = getSplitsStoreModule(injector);
    const electron = injector.get(ELECTRON_INTERFACE_TOKEN) as ElectronMockService;

    it('should be a valid module', () => {
        expect(splitsModule).to.be.a('object');
        expect(splitsModule).to.have.property('state').and.to.be.a('object').which.has.keys;
        expect(splitsModule).to.have.property('mutations').and.to.be.a('object').which.has.keys;
        expect(splitsModule).to.have.property('actions').and.to.be.a('object').which.has.keys;
    });

    describe('mutations', () => {
        describe(MUTATION_SET_CURRENT, () => {
            it('should apply the mutation correctly', () => {
                const newCurrent = 15;

                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(20),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
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
                    state.segments.length + maxTimeDeviation,
                    {},
                    [],
                    true,
                    false,
                ].forEach(invalidCurrent => {
                    splitsModule.mutations[ID_MUTATION_SET_CURRENT](state, invalidCurrent);
                    expect(state.current).to.equal(newCurrent);
                });
            });
        });

        describe(MUTATION_SET_TIMING, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(1),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const valid = [TimingMethod.IGT, TimingMethod.RTA];
                valid.forEach(timing => {
                    splitsModule.mutations[ID_MUTATION_SET_TIMING](state, timing);
                    expect(state.timing).to.equal(timing);
                });

                [
                    undefined,
                    null,
                    1,
                    2,
                    -1,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    {},
                    [],
                    true,
                    false,
                    'cool',
                    '',
                ].forEach(timing => {
                    splitsModule.mutations[ID_MUTATION_SET_TIMING](state, timing);
                    expect(state.timing).to.equal(valid[valid.length - 1]);
                });
            });
        });

        describe(MUTATION_SET_PREVIOUS_RTA_TIME, () => {
            it('should apply the mutation correctly', () => {
                const newTime = randomInt(99999);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                splitsModule.mutations[ID_MUTATION_SET_PREVIOUS_RTA_TIME](state, newTime);

                expect(state.previousRTATotal).to.equal(newTime);
            });
        });

        describe(MUTATION_SET_PREVIOUS_IGT_TIME, () => {
            it('should apply the mutation correctly', () => {
                const newTime = randomInt(99999);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                splitsModule.mutations[ID_MUTATION_SET_PREVIOUS_IGT_TIME](state, newTime);

                expect(state.previousIGTTotal).to.equal(newTime);
            });
        });

        describe(MUTATION_ADD_SEGMENT, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const segmentOne: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentOne);

                expect(state.segments).to.have.lengthOf(1);
                expect(state.segments[0].id).to.equal(segmentOne.id);

                const segmentTwo: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentTwo);

                expect(state.segments).to.have.lengthOf(2);
                expect(state.segments[0].id).to.equal(segmentOne.id);
                expect(state.segments[1].id).to.equal(segmentTwo.id);

                const segmentThree: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentThree);

                expect(state.segments).to.have.lengthOf(3);
                expect(state.segments[0].id).to.equal(segmentOne.id);
                expect(state.segments[1].id).to.equal(segmentTwo.id);
                expect(state.segments[2].id).to.equal(segmentThree.id);
            });

            it('shold not add invalid items', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                [
                    undefined,
                    null,
                    1,
                    2,
                    -1,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    false,
                    true,
                    [],
                    {},
                    { cool: 'value' },
                    { name: 'but no uuid' },
                    { uuid: 'but no name' },
                    { name: 'invalid uuid', uuid: 'cool test' },
                ].forEach(segment => {
                    splitsModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segment);

                    expect(state.segments).to.have.lengthOf(0, `"${segment}" was accepted as valid segment`);
                });
            });
        });

        describe(MUTATION_SET_SEGMENT, () => {
            it('should apply the mutation correctly', () => {
                const originalSegments: Segment[] = [
                    { id: uuid(), name: '0' },
                    { id: uuid(), name: '1' },
                    { id: uuid(), name: '2' }
                ];
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const newSegment: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                splitsModule.mutations[ID_MUTATION_SET_SEGMENT](state, { index: 0, segment: newSegment });

                expect(state.segments).to.have.lengthOf(3);
                expect(state.segments[0]).to.deep.equal(newSegment);
                expect(state.segments[1]).to.deep.equal(originalSegments[1]);
                expect(state.segments[2]).to.deep.equal(originalSegments[2]);
            });

            it('should not set the segment when the segment is invalid', () => {
                const initialSegment: Segment = {
                    id: uuid(),
                    name: 'test',
                };
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [initialSegment],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                [
                    undefined,
                    null,
                    1,
                    2,
                    -1,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    false,
                    true,
                    [],
                    {},
                    { cool: 'value' },
                    { name: 'but no uuid' },
                    { uuid: 'but no name' },
                    { name: 'invalid uuid', uuid: 'cool test' },
                ].forEach(segment => {
                    splitsModule.mutations[ID_MUTATION_SET_SEGMENT](state, { index: 0, segment });

                    expect(state.segments).to.have.lengthOf(1);
                    expect(state.segments[0]).to.deep.equal(
                        initialSegment,
                        `"${segment}" was accepted as valid segment`
                    );
                });
            });

            it('should not set the segment when the index is invalid', () => {
                const initialSegment: Segment = {
                    id: uuid(),
                    name: 'test',
                };
                const newSegment: Segment = {
                    id: uuid(),
                    name: 'new segment',
                };
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [initialSegment],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                [
                    -1,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    1,
                    2,
                    null,
                    undefined,
                    [],
                    {},
                    'invalid',
                    true,
                    false,
                ].forEach(index => {
                    splitsModule.mutations[ID_MUTATION_SET_SEGMENT](state, { index, segment: newSegment });

                    expect(state.segments).to.have.lengthOf(1);
                    expect(state.segments[0]).to.deep.equal(
                        initialSegment,
                        `"${index}" was accepted as valid index`
                    );
                });
            });
        });

        describe(MUTATION_SET_ALL_SEGMENTS, () => {
            it('should apply the mutation correctly', () => {
                const originalSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                expect(state.segments.length).to.equal(originalSegments.length);
                expect(state.segments).to.deep.eq(originalSegments);

                const newSegments = generateSegmentArray(10);

                splitsModule.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, newSegments);

                expect(state.segments).to.deep.equal(newSegments);
            });

            it('should not apply the new segments, when an invalid one is in the array', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const validSegment = {
                    id: uuid(),
                    name: 'valid',
                };

                [
                    undefined,
                    null,
                    1,
                    2,
                    -1,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    false,
                    true,
                    [],
                    {},
                    { cool: 'value' },
                    { name: 'but no uuid' },
                    { uuid: 'but no name' },
                    { name: 'invalid uuid', uuid: 'cool test' },
                ].forEach(invalidSegment => {
                    splitsModule.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, [invalidSegment]);
                    expect(state.segments).to.have.lengthOf(0, `"${[invalidSegment]}" were accepted as valid segments`);

                    splitsModule.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, [invalidSegment, validSegment]);
                    expect(state.segments).to.have.lengthOf(
                        0,
                        `"${[invalidSegment, validSegment]}" were accepted as valid segments`
                    );

                    splitsModule.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, [validSegment, invalidSegment]);
                    expect(state.segments).to.have.lengthOf(
                        0,
                        `"${[validSegment, invalidSegment]}" were accepted as valid segments`
                    );

                    splitsModule.mutations[ID_MUTATION_SET_ALL_SEGMENTS](
                        state,
                        [validSegment, invalidSegment, validSegment]
                    );
                    expect(state.segments).to.have.lengthOf(
                        0,
                        `"${[validSegment, invalidSegment, validSegment]}" were accepted as valid segments`
                    );
                });
            });
        });

        describe(MUTATION_REMOVE_SEGMENT, () => {
            it('should apply the mutation correctly', () => {
                const deleteIndicies = [0, 1, 2];
                const originalSegments = generateSegmentArray(deleteIndicies.length);

                deleteIndicies.forEach(deleteIndex => {
                    const state: SplitsState = {
                        current: -1,
                        timing: TimingMethod.RTA,
                        segments: originalSegments.slice(0),
                        previousRTATotal: randomInt(99999),
                        previousIGTTotal: randomInt(99999),
                    };

                    splitsModule.mutations[ID_MUTATION_REMOVE_SEGMENT](state, deleteIndex);

                    // Create a copy
                    const expectedSegments = originalSegments.slice(0);
                    // Remove the item like it should in the mutation
                    expectedSegments.splice(deleteIndex, 1);

                    expect(state.segments).to.deep.equal(expectedSegments);
                });
            });

            it('should not remove when an invalid index is provided', () => {
                const originalSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
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
                    false,
                ].forEach(value => {
                    splitsModule.mutations[ID_MUTATION_REMOVE_SEGMENT](state, value);
                    expect(state.segments).to.deep.equals(originalSegments);
                });
            });
        });

        describe(MUTATION_CLEAR_SEGMENTS, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [{ id: 'test', name: 'test' }],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                splitsModule.mutations[ID_MUTATION_CLEAR_SEGMENTS](state, null);

                expect(state.segments.length).to.equal(0);
            });
        });

        describe(MUTATION_DISCARDING_RESET, () => {
            it('should apply the mutation correctly', () => {
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'none',
                        currentTime: {
                            rta: {
                                rawTime: 1000,
                                pauseTime: randomInt(99999),
                            },
                            igt: {
                                rawTime: 1000,
                                pauseTime: randomInt(99999),
                            },
                        },
                        personalBest: {
                            rta: {
                                rawTime: 99,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 99,
                                pauseTime: 0,
                            },
                        },
                        hasNewOverallBest: false,
                        overallBest: {
                            rta: {
                                rawTime: randomInt(99999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999),
                                pauseTime: 0,
                            },
                        },
                        previousOverallBest: {
                            rta: {
                                rawTime: randomInt(99999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999),
                                pauseTime: 0,
                            },
                        }
                    },
                    {
                        id: uuid(),
                        name: 'ob',
                        currentTime: {
                            rta: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                        },
                        personalBest: {
                            rta: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                        },
                        hasNewOverallBest: true,
                        overallBest: {
                            rta: {
                                rawTime: 1000,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 1000,
                                pauseTime: 0,
                            },
                        },
                        previousOverallBest: {
                            rta: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                        },
                    },
                ];

                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                splitsModule.mutations[ID_MUTATION_SAVING_RESET](state, null);

                expect(state.segments).to.have.lengthOf(originalSegments.length);

                expect(state.segments[0].id).to.equal(originalSegments[0].id);
                expect(state.segments[0].name).to.equal(originalSegments[0].name);
                expect(state.segments[0].currentTime).to.equal(null);
                expect(state.segments[0].personalBest).to.equal(originalSegments[0].personalBest);
                expect(state.segments[0].overallBest).to.equal(originalSegments[0].overallBest);
                expect(state.segments[0].hasNewOverallBest).to.equal(false);
                expect(state.segments[0].previousOverallBest).to.equal(null);
                expect(state.segments[0].startTime).to.equal(-1);
                expect(state.segments[0].skipped).to.equal(false);
                expect(state.segments[0].passed).to.equal(false);

                expect(state.segments[1].id).to.equal(originalSegments[1].id);
                expect(state.segments[1].name).to.equal(originalSegments[1].name);
                expect(state.segments[1].currentTime).to.equal(null);
                expect(state.segments[1].personalBest).to.equal(originalSegments[1].personalBest);
                expect(state.segments[1].overallBest).to.equal(originalSegments[1].overallBest);
                expect(state.segments[1].hasNewOverallBest).to.equal(false);
                expect(state.segments[1].previousOverallBest).to.equal(null);
                expect(state.segments[1].startTime).to.equal(-1);
                expect(state.segments[1].skipped).to.equal(false);
                expect(state.segments[1].passed).to.equal(false);
            });
        });

        describe(MUTATION_SAVING_RESET, () => {
            it('should apply the time without personal-bests mutation correctly', () => {
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'none',
                        currentTime: {
                            rta: {
                                rawTime: 1000,
                                pauseTime: randomInt(99999),
                            },
                            igt: {
                                rawTime: 1000,
                                pauseTime: randomInt(99999),
                            },
                        },
                        personalBest: {
                            rta: {
                                rawTime: 99,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 99,
                                pauseTime: 0,
                            },
                        },
                        hasNewOverallBest: false,
                        overallBest: {
                            rta: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                        },
                        previousOverallBest: {
                            rta: {
                                rawTime: randomInt(99999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999),
                                pauseTime: 0,
                            },
                        }
                    },
                    {
                        id: uuid(),
                        name: 'ob',
                        currentTime: {
                            rta: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                        },
                        personalBest: {
                            rta: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                        },
                        hasNewOverallBest: true,
                        overallBest: {
                            rta: {
                                rawTime: 1000,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 1000,
                                pauseTime: 0,
                            },
                        },
                        previousOverallBest: {
                            rta: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(99999, 1000),
                                pauseTime: 0,
                            },
                        },
                    },
                ];

                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                splitsModule.mutations[ID_MUTATION_SAVING_RESET](state, null);

                expect(state.segments).to.have.lengthOf(originalSegments.length);

                expect(state.segments[0].id).to.equal(originalSegments[0].id);
                expect(state.segments[0].name).to.equal(originalSegments[0].name);
                expect(state.segments[0].currentTime).to.equal(null);
                expect(state.segments[0].personalBest).to.equal(originalSegments[0].personalBest);
                expect(state.segments[0].overallBest).to.equal(originalSegments[0].overallBest);
                expect(state.segments[0].hasNewOverallBest).to.equal(false);
                expect(state.segments[0].previousOverallBest).to.equal(null);
                expect(state.segments[0].startTime).to.equal(-1);
                expect(state.segments[0].skipped).to.equal(false);
                expect(state.segments[0].passed).to.equal(false);

                expect(state.segments[1].id).to.equal(originalSegments[1].id);
                expect(state.segments[1].name).to.equal(originalSegments[1].name);
                expect(state.segments[1].currentTime).to.equal(null);
                expect(state.segments[1].personalBest).to.equal(originalSegments[1].personalBest);
                expect(state.segments[1].overallBest).to.equal(originalSegments[1].overallBest);
                expect(state.segments[1].hasNewOverallBest).to.equal(false);
                expect(state.segments[1].previousOverallBest).to.equal(null);
                expect(state.segments[1].startTime).to.equal(-1);
                expect(state.segments[1].skipped).to.equal(false);
                expect(state.segments[1].passed).to.equal(false);
            });

            it('should apply the time with personal-bests mutation correctly', () => {
                const newPBTime = 1_000;
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'pb',
                        passed: true,
                        currentTime: {
                            rta: {
                                rawTime: newPBTime,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: newPBTime,
                                pauseTime: 0,
                            },
                        },
                        personalBest: {
                            rta: {
                                rawTime: 2000,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 2000,
                                pauseTime: 0,
                            },
                        },
                        hasNewOverallBest: false,
                        overallBest: {
                            rta: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: randomInt(999),
                                pauseTime: 0,
                            },
                        }
                    },
                ];

                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: 1_000_000,
                    previousIGTTotal: 1_000_000,
                };

                splitsModule.mutations[ID_MUTATION_SAVING_RESET](state, null);

                expect(state.segments).to.have.lengthOf(originalSegments.length);

                expect(state.segments[0].id).to.equal(originalSegments[0].id);
                expect(state.segments[0].name).to.equal(originalSegments[0].name);
                expect(state.segments[0].currentTime).to.equal(null);
                expect(state.segments[0].personalBest).to.deep.equal(originalSegments[0].currentTime);
                expect(state.segments[0].overallBest).to.deep.equal(originalSegments[0].overallBest);
                expect(state.segments[0].hasNewOverallBest).to.equal(false);
                expect(state.segments[0].previousOverallBest).to.equal(null);
                expect(state.segments[0].startTime).to.equal(-1);
                expect(state.segments[0].skipped).to.equal(false);
                expect(state.segments[0].passed).to.equal(false);

                expect(state.previousRTATotal).to.equal(newPBTime);
                expect(state.previousIGTTotal).to.equal(newPBTime);
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
                    timing: TimingMethod.RTA,
                    segments: segments,
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                            startTime: -1,
                        },
                    },
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_START], {
                    state,
                    rootState,
                });

                let totalRTATime = 0;
                let totalIGTTime = 0;
                segments.forEach(segment => {
                    if (segment.passed) {
                        totalRTATime += getFinalTime(segment.personalBest.rta);
                        totalIGTTime += getFinalTime(segment.personalBest.igt);
                    }
                });

                expect(commits).to.have.lengthOf(5);
                expect(dispatches).to.be.empty;
                expect(commits[0].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[0].payload).to.exist;
                // Either current time or +1, as it may be a millisecond off
                expect(commits[0].payload.time).to.be.within(startTime, startTime + maxTimeDeviation);
                expect(commits[0].payload.status).to.equal(TimerStatus.RUNNING);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_PREVIOUS_RTA_TIME);
                expect(commits[1].payload).to.equal(totalRTATime);

                expect(commits[2].type).to.equal(ID_MUTATION_SET_PREVIOUS_IGT_TIME);
                expect(commits[2].payload).to.equal(totalIGTTime);

                expect(commits[3].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[3].payload).to.exist;
                expect(commits[3].payload.index).to.equal(0);
                expect(commits[3].payload.segment.id).to.equal(segments[0].id);
                expect(commits[3].payload.segment.startTime).to.be.within(startTime, startTime + maxTimeDeviation);

                expect(commits[4]).to.deep.equal({ type: ID_MUTATION_SET_CURRENT, payload: 0 });
            });

            it('should not start without segments', async () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                            startTime: -1,
                        },
                    },
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_START], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.be.empty;
            });

            it('should not start when the timer is not stopped', async () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
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
                        },
                    };

                    const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_START], {
                        state,
                        rootState,
                    });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                }
            });
        });

        describe(ACTION_SPLIT, () => {
            it('should not do anything while not running', async () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
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
                        personalBest: null,
                        overallBest: null,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        currentTime: {
                            rta: {
                                rawTime: 123,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 123,
                                pauseTime: 0,
                            },
                        },
                        passed: true,
                        skipped: true,
                    },
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const time = now();
                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(3);
                expect(dispatches).to.be.empty;

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload).to.exist;
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.currentTime.rta.rawTime)
                    .to.be.within(segmentTime, segmentTime + maxTimeDeviation);
                expect(commits[0].payload.segment.passed).to.equal(true);
                expect(commits[0].payload.segment.skipped).to.equal(false);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(true);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[1].payload).to.exist;
                expect(commits[1].payload.index).to.equal(currentIndex + maxTimeDeviation);
                expect(commits[1].payload.segment.id).to.equal(segments[currentIndex + maxTimeDeviation].id);
                expect(commits[1].payload.segment.startTime).to.be.within(time, time + maxTimeDeviation);
                expect(commits[1].payload.segment.passed).to.equal(false);
                expect(commits[1].payload.segment.skipped).to.equal(false);

                expect(commits[2].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[2].payload).to.equal(currentIndex + maxTimeDeviation);
            });

            it('should apply overall bests correctly', async () => {
                const segmentTimeMs = 5_000;
                const personalBest: SegmentTime = {
                    rta: {
                        rawTime: 25_000,
                        pauseTime: 0,
                    },
                    igt: {
                        rawTime: 25_000,
                        pauseTime: 0,
                    },
                };
                const overallBest: SegmentTime = {
                    rta: {
                        rawTime: 10_000,
                        pauseTime: 0,
                    },
                    igt: {
                        rawTime: 10_000,
                        pauseTime: 0,
                    },
                };
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTimeMs,
                        personalBest: personalBest,
                        overallBest: overallBest,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        currentTime: {
                            rta: {
                                rawTime: 123,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 123,
                                pauseTime: 0,
                            },
                        },
                        passed: true,
                        skipped: true,
                    },
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.personalBest).to.deep.equal(personalBest);
                expect(commits[0].payload.segment.overallBest.rta.rawTime)
                    .to.be.within(segmentTimeMs, segmentTimeMs + maxTimeDeviation);
                expect(commits[0].payload.segment.previousOverallBest).to.deep.equal(overallBest);
            });

            it('should not apply overall bests', async () => {
                const segmentTimeMs = 25_000;
                const personalBest: SegmentTime = {
                    rta: {
                        rawTime: 20_000,
                        pauseTime: 0,
                    },
                    igt: {
                        rawTime: 20_000,
                        pauseTime: 0,
                    },
                };
                const overallBest: SegmentTime = {
                    rta: {
                        rawTime: 10_000,
                        pauseTime: 0,
                    },
                    igt: {
                        rawTime: 10_000,
                        pauseTime: 0,
                    },
                };
                const segments: Segment[] = [
                    null,
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: now() - segmentTimeMs,
                        personalBest: personalBest,
                        overallBest: overallBest,
                    },
                    {
                        id: uuid(),
                        name: 'next',
                        currentTime: {
                            rta: {
                                rawTime: 123,
                                pauseTime: 0,
                            },
                            igt: {
                                rawTime: 123,
                                pauseTime: 0,
                            },
                        },
                        passed: true,
                        skipped: true,
                    },
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.personalBest).to.deep.equal(personalBest);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.overallBest).to.deep.equal(overallBest);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(null);
            });

            it('should finish after the last split', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(1),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(2);
                expect(dispatches).to.be.empty;

                expect(commits[1].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[1].payload).to.equal(TimerStatus.FINISHED);
            });

            it('should reset after the run is finished', async () => {
                const state: SplitsState = {
                    current: 1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(1),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.FINISHED,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches } = await testAction(splitsModule.actions[ID_ACTION_SPLIT], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.have.lengthOf(1);

                expect(dispatches[0].type).to.equal(ID_ACTION_RESET);
                expect(dispatches[0].payload).to.not.exist;
            });
        });

        describe(ACTION_SKIP, () => {
            it('should skip to the next segment', async () => {
                const segments = generateSegmentArray(5);
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_SKIP], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(2);
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.currentTime).to.equal(null);
                expect(commits[0].payload.segment.startTime).to.equal(segments[currentIndex].startTime);
                expect(commits[0].payload.segment.skipped).to.equal(true);
                expect(commits[0].payload.segment.passed).to.equal(false);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[1].payload).to.equal(currentIndex + maxTimeDeviation);
            });

            it('should not skip when timer is not running', async () => {
                const segments = generateSegmentArray(5);
                const currentIndex = 1;

                const invalidStatuses = [TimerStatus.STOPPED, TimerStatus.PAUSED, TimerStatus.FINISHED];
                for (const status of invalidStatuses) {
                    const state: SplitsState = {
                        current: currentIndex,
                        timing: TimingMethod.RTA,
                        segments: segments.slice(0),
                        previousRTATotal: randomInt(99999),
                        previousIGTTotal: randomInt(99999),
                    };

                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            },
                        },
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_SKIP], {
                        state,
                        rootState,
                    });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });

            it('should not skip when it is the last segment', async () => {
                const segments = generateSegmentArray(5);
                const currentIndex = segments.length - 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_SKIP], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(false);
            });
        });

        describe(ACTION_UNDO, () => {
            it('should undo the most recent split', async () => {
                const pauseTime = randomInt(99999);
                const segments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'first',
                        startTime: randomInt(99999),
                    },
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        personalBest: generateRandomTime(),
                        overallBest: generateRandomTime(),
                        hasNewOverallBest: true,
                        previousOverallBest: generateRandomTime(),
                        currentTime: {
                            rta: { rawTime: 0, pauseTime: pauseTime },
                            igt: { rawTime: 0, pauseTime: pauseTime },
                        },
                    },
                ];
                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNDO], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(3);
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.startTime).to.equal(-1);
                expect(commits[0].payload.segment.currentTime).to.equal(null);
                expect(commits[0].payload.segment.passed).to.equal(false);
                expect(commits[0].payload.segment.skipped).to.equal(false);
                expect(commits[0].payload.segment.personalBest).to.deep.equal(segments[currentIndex].personalBest);
                expect(commits[0].payload.segment.overallBest)
                    .to.deep.equal(segments[currentIndex].previousOverallBest);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(null);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[1].payload.segment.id).to.equal(segments[currentIndex - 1].id);
                expect(commits[1].payload.segment.startTime).to.equal(segments[currentIndex - 1].startTime);
                expect(commits[1].payload.segment.passed).to.equal(false);
                expect(commits[1].payload.segment.skipped).to.equal(false);
                expect(commits[1].payload.segment.currentTime.rta.pauseTime).to.equal(pauseTime);

                expect(commits[2].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[2].payload).to.equal(currentIndex - 1);
            });

            it('should undo the most recent split and apply the pause time to the previous one', async () => {
                const pauseTime = randomInt(99999, 2_000);
                const initialRawTime = 1_000_000;
                const initialPauseTime = 1_000;

                const segments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'first',
                        passed: true,
                        currentTime: {
                            rta: { rawTime: initialRawTime, pauseTime: initialPauseTime },
                        } as any,
                    },
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        personalBest: generateRandomTime(),
                        overallBest: generateRandomTime(),
                        hasNewOverallBest: true,
                        previousOverallBest: generateRandomTime(),
                        currentTime: {
                            rta: { rawTime: 0, pauseTime: pauseTime },
                            igt: { rawTime: 0, pauseTime: pauseTime },
                        },
                    },
                ];

                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNDO], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(3);
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.startTime).to.equal(-1);
                expect(commits[0].payload.segment.currentTime).to.equal(null);
                expect(commits[0].payload.segment.passed).to.equal(false);
                expect(commits[0].payload.segment.skipped).to.equal(false);
                expect(commits[0].payload.segment.personalBest).to.deep.equal(segments[currentIndex].personalBest);
                expect(commits[0].payload.segment.overallBest)
                    .to.deep.equal(segments[currentIndex].previousOverallBest);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(null);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[1].payload.segment.id).to.equal(segments[currentIndex - 1].id);
                expect(commits[1].payload.segment.startTime).to.equal(segments[currentIndex - 1].startTime);
                expect(commits[1].payload.segment.passed).to.equal(false);
                expect(commits[1].payload.segment.skipped).to.equal(false);
                expect(commits[1].payload.segment.currentTime.rta.pauseTime).to.equal(initialPauseTime + pauseTime);
                expect(commits[1].payload.segment.currentTime.igt.pauseTime).to.equal(pauseTime);

                expect(commits[2].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[2].payload).to.equal(currentIndex - 1);
            });

            it('should undo the most recent split and not apply the pause time when there is no time', async () => {
                const initialRawTime = 1_000_000;
                const initialPauseTime = 1_000;

                const segments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'first',
                        passed: true,
                        currentTime: {
                            rta: { rawTime: initialRawTime, pauseTime: initialPauseTime },
                            igt: { rawTime: initialRawTime, pauseTime: initialPauseTime },
                        },
                    },
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        personalBest: generateRandomTime(),
                        overallBest: generateRandomTime(),
                        hasNewOverallBest: true,
                        previousOverallBest: generateRandomTime()
                    },
                ];

                const currentIndex = 1;
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: segments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNDO], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(3);
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(segments[currentIndex].id);
                expect(commits[0].payload.segment.startTime).to.equal(-1);
                expect(commits[0].payload.segment.currentTime).to.equal(null);
                expect(commits[0].payload.segment.passed).to.equal(false);
                expect(commits[0].payload.segment.skipped).to.equal(false);
                expect(commits[0].payload.segment.personalBest).to.deep.equal(segments[currentIndex].personalBest);
                expect(commits[0].payload.segment.overallBest)
                    .to.deep.equal(segments[currentIndex].previousOverallBest);
                expect(commits[0].payload.segment.hasNewOverallBest).to.equal(false);
                expect(commits[0].payload.segment.previousOverallBest).to.equal(null);

                expect(commits[1].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[1].payload.segment.id).to.equal(segments[currentIndex - 1].id);
                expect(commits[1].payload.segment.startTime).to.equal(segments[currentIndex - 1].startTime);
                expect(commits[1].payload.segment.passed).to.equal(false);
                expect(commits[1].payload.segment.skipped).to.equal(false);
                expect(commits[1].payload.segment.currentTime.rta.pauseTime).to.equal(initialPauseTime);
                expect(commits[1].payload.segment.currentTime.igt.pauseTime).to.equal(initialPauseTime);

                expect(commits[2].type).to.equal(ID_MUTATION_SET_CURRENT);
                expect(commits[2].payload).to.equal(currentIndex - 1);
            });

            it('should not undo when the timer is not running', async () => {
                const state: SplitsState = {
                    current: 1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };
                const invalidStatuses = [TimerStatus.STOPPED, TimerStatus.PAUSED, TimerStatus.FINISHED];
                for (const status of invalidStatuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            },
                        },
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_UNDO], {
                        state,
                        rootState,
                    });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });

            it('should not undo when it is the first segment', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                            startTime: randomInt(99999),
                        },
                    },
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNDO], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(false);
            });
        });

        describe(ACTION_PAUSE, () => {
            it('should pause the timer (RTA & IGT)', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
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

                const time = now();
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_PAUSE], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(1);
                expect(commits[0].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[0].payload.time).to.be.within(time, time + maxTimeDeviation);
                expect(commits[0].payload.status).to.equal(TimerStatus.PAUSED);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should not pause the timer unless it is running', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const invalidStatuses = [TimerStatus.FINISHED, TimerStatus.STOPPED];
                for (const status of invalidStatuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            }
                        }
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_PAUSE], {
                        state,
                        rootState,
                    });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });

            it('should only pause the IGT Timer', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
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

                const time = now();
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_PAUSE], {
                    state,
                    rootState,
                }, { igtOnly: true });

                expect(commits).to.have.lengthOf(1);
                expect(commits[0].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[0].payload.time).to.be.within(time, time + maxTimeDeviation);
                expect(commits[0].payload.status).to.equal(TimerStatus.RUNNING_IGT_PAUSE);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should not pause the IGT timer unless it is running', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const invalidStatuses = [TimerStatus.FINISHED, TimerStatus.STOPPED, TimerStatus.RUNNING_IGT_PAUSE];
                for (const status of invalidStatuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            }
                        }
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_PAUSE], {
                        state,
                        rootState,
                    }, { igtOnly: true });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });
        });

        describe(ACTION_UNPAUSE, () => {
            it('should unpause all timers when it was paused previously', async () => {
                const currentIndex = 0;
                const originalSegments: Segment[] = generateSegmentArray(3);
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.PAUSED,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const time = now();
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(2);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(originalSegments[currentIndex].id);

                expect(commits[1].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[1].payload.time).to.be.within(time, time + maxTimeDeviation);
                expect(commits[1].payload.status).to.equal(TimerStatus.RUNNING);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should not unpause when the timer was not paused previously', async () => {
                const currentIndex = 0;
                const originalSegments: Segment[] = generateSegmentArray(3);
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const invalidStatuses = [
                    TimerStatus.FINISHED,
                    TimerStatus.RUNNING,
                    TimerStatus.RUNNING_IGT_PAUSE,
                    TimerStatus.STOPPED
                ];

                for (const status of invalidStatuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            }
                        }
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_UNPAUSE], {
                        state,
                        rootState,
                    });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });

            it('should unpause the IGT timer when it was paused previously', async () => {
                const currentIndex = 0;
                const originalSegments: Segment[] = generateSegmentArray(3);
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING_IGT_PAUSE,
                            startTime: randomInt(99999),
                        }
                    }
                };

                const time = now();
                const { commits, dispatches, returnValue } = await testAction(
                    splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState,
                }, { igtOnly: true });

                expect(commits).to.have.lengthOf(2);

                expect(commits[0].type).to.equal(ID_MUTATION_SET_SEGMENT);
                expect(commits[0].payload.index).to.equal(currentIndex);
                expect(commits[0].payload.segment.id).to.equal(originalSegments[currentIndex].id);

                expect(commits[1].type).to.equal(MUTATION_SET_STATUS);
                expect(commits[1].payload.time).to.be.within(time, time + maxTimeDeviation);
                expect(commits[1].payload.status).to.equal(TimerStatus.RUNNING);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should not unpause when the IGT timer was not paused previously', async () => {
                const currentIndex = 0;
                const originalSegments: Segment[] = generateSegmentArray(3);
                const state: SplitsState = {
                    current: currentIndex,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const invalidStatuses = [
                    TimerStatus.FINISHED,
                    TimerStatus.RUNNING,
                    TimerStatus.STOPPED,
                    TimerStatus.PAUSED,
                ];

                for (const status of invalidStatuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                                startTime: randomInt(99999),
                            }
                        }
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_UNPAUSE], {
                        state,
                        rootState,
                    }, { igtOnly: true });

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });

            it('should apply the pause time to the current segment time', async () => {
                const initialPauseTime = 10_000;
                const pauseTime = 5_000;
                const totalPauseTime = initialPauseTime + pauseTime;
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        currentTime: {
                            rta: { rawTime: 0, pauseTime: initialPauseTime },
                            igt: { rawTime: 0, pauseTime: initialPauseTime },
                        },
                    },
                ];

                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousIGTTotal: randomInt(99999),
                    previousRTATotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.PAUSED,
                            startTime: randomInt(99999),
                            pauseTime: now() - pauseTime,
                            igtPauseTime: now() - pauseTime,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState
                });

                expect(commits).to.have.lengthOf(2);
                expect(commits[0].payload.segment.currentTime.rta.pauseTime)
                    .to.be.within(totalPauseTime, totalPauseTime + maxTimeDeviation);
                expect(commits[0].payload.segment.currentTime.igt.pauseTime)
                    .to.be.within(totalPauseTime, totalPauseTime + maxTimeDeviation);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should apply the IGT pause time to the current segment time', async () => {
                const initialPauseTime = 10_000;
                const pauseTime = 5_000;
                const totalPauseTime = initialPauseTime + pauseTime;
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        currentTime: {
                            rta: { rawTime: 0, pauseTime: initialPauseTime },
                            igt: { rawTime: 0, pauseTime: initialPauseTime },
                        },
                    },
                ];

                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousIGTTotal: randomInt(99999),
                    previousRTATotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING_IGT_PAUSE,
                            startTime: randomInt(99999),
                            igtPauseTime: now() - pauseTime,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState
                }, { igtOnly: true });

                expect(commits).to.have.lengthOf(2);
                expect(commits[0].payload.segment.currentTime.rta.pauseTime).to.equal(initialPauseTime);
                expect(commits[0].payload.segment.currentTime.igt.pauseTime)
                    .to.be.within(totalPauseTime, totalPauseTime + maxTimeDeviation);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should apply the pause time without currentTime set', async () => {
                const pauseTime = 5_000;
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        currentTime: null,
                    },
                ];

                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousIGTTotal: randomInt(99999),
                    previousRTATotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.PAUSED,
                            startTime: randomInt(99999),
                            pauseTime: now() - pauseTime,
                            igtPauseTime: now() - pauseTime,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState
                });

                expect(commits).to.have.lengthOf(2);
                expect(commits[0].payload.segment.currentTime.rta.pauseTime)
                    .to.be.within(pauseTime, pauseTime + maxTimeDeviation);
                expect(commits[0].payload.segment.currentTime.igt.pauseTime)
                    .to.be.within(pauseTime, pauseTime + maxTimeDeviation);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should apply the pause time without time for RTA set', async () => {
                const pauseTime = 5_000;
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        currentTime: {
                            igt: { rawTime: 0, pauseTime: 0 },
                        } as any,
                    },
                ];

                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousIGTTotal: randomInt(99999),
                    previousRTATotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.PAUSED,
                            startTime: randomInt(99999),
                            pauseTime: now() - pauseTime,
                            igtPauseTime: now() - pauseTime,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState
                });

                expect(commits).to.have.lengthOf(2);
                expect(commits[0].payload.segment.currentTime.rta.pauseTime)
                    .to.be.within(pauseTime, pauseTime + maxTimeDeviation);
                expect(commits[0].payload.segment.currentTime.igt.pauseTime)
                    .to.be.within(pauseTime, pauseTime + maxTimeDeviation);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should apply the pause time without time for RTA set', async () => {
                const pauseTime = 5_000;
                const originalSegments: Segment[] = [
                    {
                        id: uuid(),
                        name: 'test',
                        startTime: randomInt(99999),
                        currentTime: {
                            rta: { rawTime: 0, pauseTime: 0 },
                        } as any,
                    },
                ];

                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousIGTTotal: randomInt(99999),
                    previousRTATotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.PAUSED,
                            startTime: randomInt(99999),
                            pauseTime: now() - pauseTime,
                            igtPauseTime: now() - pauseTime,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_UNPAUSE], {
                    state,
                    rootState
                });

                expect(commits).to.have.lengthOf(2);
                expect(commits[0].payload.segment.currentTime.rta.pauseTime)
                    .to.be.within(pauseTime, pauseTime + maxTimeDeviation);
                expect(commits[0].payload.segment.currentTime.igt.pauseTime)
                    .to.be.within(pauseTime, pauseTime + maxTimeDeviation);

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });
        });

        describe(ACTION_RESET, () => {
            it('should not reset when it\'s already stopped', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousIGTTotal: randomInt(99999),
                    previousRTATotal: randomInt(99999),
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should trigger a saving reset without a new PB', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousIGTTotal: 1,
                    previousRTATotal: 1,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.FINISHED,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.have.lengthOf(1);
                expect(dispatches[0].type).to.equal(ID_ACTION_SAVING_RESET);

                expect(returnValue).to.equal(true);
            });

            it('should trigger a saving reset with a new PB', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(3),
                    previousIGTTotal: 1_000_000,
                    previousRTATotal: 1_000_000,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.FINISHED,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.have.lengthOf(1);
                expect(dispatches[0].type).to.equal(ID_ACTION_SAVING_RESET);

                expect(returnValue).to.equal(true);
            });

            it('should trigger a discarding reset when not finished and no new OB has been set', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [
                        {
                            id: uuid(),
                            name: 'test',
                            passed: false,
                            hasNewOverallBest: false,
                        }
                    ],
                    previousIGTTotal: 1,
                    previousRTATotal: 1,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.have.lengthOf(1);
                expect(dispatches[0].type).to.equal(ID_ACTION_DISCARDING_RESET);
                expect(dispatches[0].payload).to.equal(undefined);

                // Returns undefined, as the other reset action isn't actually getting called due to the mock
                expect(returnValue).to.equal(undefined);
            });

            it('should not trigger a reset when the user cancels the reset in the dialog', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [
                        {
                            id: uuid(),
                            name: 'test',
                            passed: true,
                            currentTime: generateRandomTime(),
                            personalBest: generateRandomTime(),
                            hasNewOverallBest: true,
                        }
                    ],
                    previousIGTTotal: 1,
                    previousRTATotal: 1,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                electron.setResponseMessageDialog(0);
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(false);
            });

            it('should not trigger a reset when the user cancels the reset in the dialog + windowId', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [
                        {
                            id: uuid(),
                            name: 'test',
                            passed: true,
                            currentTime: generateRandomTime(),
                            personalBest: generateRandomTime(),
                            hasNewOverallBest: true,
                        }
                    ],
                    previousIGTTotal: 1,
                    previousRTATotal: 1,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                electron.setResponseMessageDialog(0);
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                }, { windowId: 1 });

                expect(commits).to.be.empty;
                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(false);
            });

            it('should trigger a discarding reset, when the user choose to', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [
                        {
                            id: uuid(),
                            name: 'test',
                            passed: true,
                            currentTime: generateRandomTime(),
                            personalBest: generateRandomTime(),
                            hasNewOverallBest: true,
                        }
                    ],
                    previousIGTTotal: 1,
                    previousRTATotal: 1,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                electron.setResponseMessageDialog(1);
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;

                expect(dispatches).to.have.lengthOf(1);
                expect(dispatches[0].type).to.equal(ID_ACTION_DISCARDING_RESET);
                expect(dispatches[0].payload).to.equal(undefined);

                // Returns undefined, as the other reset action isn't actually getting called due to the mock
                expect(returnValue).to.equal(undefined);
            });

            it('should trigger a saving reset without a PB, when the user choose to', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [
                        {
                            id: uuid(),
                            name: 'test',
                            passed: true,
                            currentTime: generateRandomTime(),
                            personalBest: generateRandomTime(),
                            hasNewOverallBest: true,
                        }
                    ],
                    previousIGTTotal: 1,
                    previousRTATotal: 1,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                electron.setResponseMessageDialog(2);
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;

                expect(dispatches).to.have.lengthOf(1);
                expect(dispatches[0].type).to.equal(ID_ACTION_SAVING_RESET);
                expect(dispatches[0].payload.isNewPersonalBest).to.equal(false);

                // Returns undefined, as the other reset action isn't actually getting called due to the mock
                expect(returnValue).to.equal(undefined);
            });

            it('should trigger a saving reset with a PB, when the user choose to', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [
                        {
                            id: uuid(),
                            name: 'test',
                            passed: true,
                            currentTime: generateRandomTime(),
                            personalBest: generateRandomTime(),
                            hasNewOverallBest: true,
                        }
                    ],
                    previousIGTTotal: 1_000_000,
                    previousRTATotal: 1_000_000,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                electron.setResponseMessageDialog(2);
                const { commits, dispatches, returnValue } = await testAction(splitsModule.actions[ID_ACTION_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.be.empty;

                expect(dispatches).to.have.lengthOf(1);
                expect(dispatches[0].type).to.equal(ID_ACTION_SAVING_RESET);
                expect(dispatches[0].payload.isNewPersonalBest).to.equal(true);

                // Returns undefined, as the other reset action isn't actually getting called due to the mock
                expect(returnValue).to.equal(undefined);
            });
        });

        describe(ACTION_DISCARDING_RESET, () => {
            it('should handle the discarding reset', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(
                    splitsModule.actions[ID_ACTION_DISCARDING_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(3);
                expect(commits[0]).to.deep.equal({
                    type: MUTATION_SET_STATUS,
                    payload: TimerStatus.STOPPED,
                });
                expect(commits[1]).to.deep.equal({
                    type: ID_MUTATION_SET_CURRENT,
                    payload: -1,
                });
                expect(commits[2]).to.deep.equal({
                    type: ID_MUTATION_DISCARDING_RESET,
                    payload: undefined,
                });

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });
        });

        describe(ACTION_SAVING_RESET, () => {
            it('should handle the discarding reset without new PB', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(
                    splitsModule.actions[ID_ACTION_SAVING_RESET], {
                    state,
                    rootState,
                });

                expect(commits).to.have.lengthOf(3);
                expect(commits[0]).to.deep.equal({
                    type: MUTATION_SET_STATUS,
                    payload: TimerStatus.STOPPED,
                });
                expect(commits[1]).to.deep.equal({
                    type: ID_MUTATION_SET_CURRENT,
                    payload: -1,
                });
                expect(commits[2]).to.deep.equal({
                    type: ID_MUTATION_SAVING_RESET,
                    payload: undefined,
                });

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should handle the discarding reset with new PB', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.RUNNING,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(
                    splitsModule.actions[ID_ACTION_SAVING_RESET], {
                    state,
                    rootState,
                }, { isNewPersonalBest: true });

                expect(commits).to.have.lengthOf(3);
                expect(commits[0]).to.deep.equal({
                    type: MUTATION_SET_STATUS,
                    payload: TimerStatus.STOPPED,
                });
                expect(commits[1]).to.deep.equal({
                    type: ID_MUTATION_SET_CURRENT,
                    payload: -1,
                });
                expect(commits[2]).to.deep.equal({
                    type: ID_MUTATION_SAVING_RESET,
                    payload: undefined,
                });

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });
        });

        describe(ACTION_SET_ALL_SEGMENTS, () => {
            it('should apply the new segments', async () => {
                const newSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                        }
                    }
                };

                const { commits, dispatches, returnValue } = await testAction(
                    splitsModule.actions[ID_ACTION_SET_ALL_SEGMENTS], {
                    state,
                    rootState,
                }, newSegments);

                expect(commits).to.have.lengthOf(1);
                expect(commits[0]).to.deep.equal({
                    type: ID_MUTATION_SET_ALL_SEGMENTS,
                    payload: newSegments,
                });

                expect(dispatches).to.be.empty;
                expect(returnValue).to.equal(true);
            });

            it('should not apply invalid content', async () => {
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const rootState = {
                    splitterino: {
                        splits: state,
                        timer: {
                            status: TimerStatus.STOPPED,
                        }
                    }
                };

                const invalidPayloads = [undefined, null, {}, '', 'hi', 123, NaN, Infinity, true, false];
                for (const payload of invalidPayloads) {
                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_SET_ALL_SEGMENTS], {
                        state,
                        rootState,
                    }, payload);

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });

            it('should not apply new segments when the timer is not stopped', async () => {
                const newSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: 0,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const invalidStatuses = [
                    TimerStatus.FINISHED,
                    TimerStatus.PAUSED,
                    TimerStatus.RUNNING,
                    TimerStatus.RUNNING_IGT_PAUSE
                ];

                for (const status of invalidStatuses) {
                    const rootState = {
                        splitterino: {
                            splits: state,
                            timer: {
                                status: status,
                            }
                        }
                    };

                    const { commits, dispatches, returnValue } = await testAction(
                        splitsModule.actions[ID_ACTION_SET_ALL_SEGMENTS], {
                        state,
                        rootState,
                    }, newSegments);

                    expect(commits).to.be.empty;
                    expect(dispatches).to.be.empty;
                    expect(returnValue).to.equal(false);
                }
            });
        });
    });
});
