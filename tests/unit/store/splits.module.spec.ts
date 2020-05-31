/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';
import { v4 as uuid } from 'uuid';

import { Segment, TimingMethod } from '../../../src/models/splits';
import { SplitsState } from '../../../src/models/states/splits.state';
import { Module } from '../../../src/store';
import {
    getSplitsStoreModule,
    ID_HANDLER_ADD_SEGMENT,
    ID_HANDLER_CLEAR_SEGMENTS,
    ID_HANDLER_DISCARDING_RESET,
    ID_HANDLER_REMOVE_SEGMENT,
    ID_HANDLER_SAVING_RESET,
    ID_HANDLER_SET_ALL_SEGMENTS,
    ID_HANDLER_SET_CURRENT,
    ID_HANDLER_SET_PREVIOUS_IGT_TIME,
    ID_HANDLER_SET_PREVIOUS_RTA_TIME,
    ID_HANDLER_SET_SEGMENT,
    ID_HANDLER_SET_TIMING,
} from '../../../src/store/modules/splits.module';
import { createMockInjector, generateSegmentArray, randomInt } from '../../utils';

// Initialize the Dependency-Injection
const injector = createMockInjector();
const maxTimeDeviation = 1;

describe('Splits Store-Module', () => {
    const splitsModule: Module<SplitsState> = getSplitsStoreModule(injector);

    it('should be a valid module', () => {
        expect(splitsModule).to.be.a('object');
        expect(splitsModule).to.have.property('handlers').which.is.a('object').and.has.keys;
        expect(splitsModule).to.have.property('initialize').which.is.a('function');

        const state = splitsModule.initialize();
        expect(state).to.be.a('object').and.to.have.keys;
    });

    describe('Handlers', () => {
        describe(ID_HANDLER_SET_CURRENT, () => {
            it('should apply the valid value', () => {
                const newCurrent = 15;

                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(20),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const diff = splitsModule.handlers[ID_HANDLER_SET_CURRENT](state, newCurrent);
                expect(diff).to.deep.equal({ current: newCurrent });
            });

            it('should ignore invalid values', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(20),
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
                    -2,
                    state.segments.length + maxTimeDeviation,
                    {},
                    [],
                    true,
                    false,
                ].forEach(invalidCurrent => {
                    const diff = splitsModule.handlers[ID_HANDLER_SET_CURRENT](state, invalidCurrent);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_TIMING, () => {
            it('should apply valid timings', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(1),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const valid = [TimingMethod.IGT, TimingMethod.RTA];
                valid.forEach(timing => {
                    const diff = splitsModule.handlers[ID_HANDLER_SET_TIMING](state, timing);
                    expect(diff).to.deep.equal({ timing: timing });
                });
            });

            it('should ignore invalid timings', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: generateSegmentArray(1),
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
                    {},
                    [],
                    true,
                    false,
                    'cool',
                    '',
                ].forEach(timing => {
                    const diff = splitsModule.handlers[ID_HANDLER_SET_TIMING](state, timing);
                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_PREVIOUS_RTA_TIME, () => {
            it('should apply a valid previous rta time', () => {
                const newTime = randomInt(99999);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const diff = splitsModule.handlers[ID_HANDLER_SET_PREVIOUS_RTA_TIME](state, newTime);

                expect(diff).to.deep.equal({ previousRTATotal: newTime });
            });

            it('should apply negative numbers as -1', () => {
                const newTime = -1337;
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const diff = splitsModule.handlers[ID_HANDLER_SET_PREVIOUS_RTA_TIME](state, newTime);

                expect(diff).to.deep.equal({ previousRTATotal: -1 });
            });

            it('should ignore invalid numbers/types', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                [
                    undefined,
                    null,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    'string',
                    {},
                    [],
                    true,
                    false,
                ].forEach(invalidTime => {
                    const diff = splitsModule.handlers[ID_HANDLER_SET_PREVIOUS_RTA_TIME](state, invalidTime);

                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_SET_PREVIOUS_IGT_TIME, () => {
            it('should apply a valid previous igt time', () => {
                const newTime = randomInt(99999);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.IGT,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const diff = splitsModule.handlers[ID_HANDLER_SET_PREVIOUS_IGT_TIME](state, newTime);

                expect(diff).to.deep.equal({ previousIGTTotal: newTime });
            });

            it('should apply negative numbers as -1', () => {
                const newTime = -1337;
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.IGT,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                const diff = splitsModule.handlers[ID_HANDLER_SET_PREVIOUS_IGT_TIME](state, newTime);

                expect(diff).to.deep.equal({ previousIGTTotal: -1 });
            });

            it('should ignore invalid numbers/types', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.IGT,
                    segments: [],
                    previousRTATotal: 0,
                    previousIGTTotal: 0,
                };

                [
                    undefined,
                    null,
                    NaN,
                    -NaN,
                    Infinity,
                    -Infinity,
                    'string',
                    {},
                    [],
                    true,
                    false,
                ].forEach(invalidTime => {
                    const diff = splitsModule.handlers[ID_HANDLER_SET_PREVIOUS_IGT_TIME](state, invalidTime);

                    expect(diff).to.deep.equal({});
                });
            });
        });

        describe(ID_HANDLER_ADD_SEGMENT, () => {
            it('should add a valid segment', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const newSegment: Segment = {
                    id: uuid(),
                    name: 'test',
                };

                const diff = splitsModule.handlers[ID_HANDLER_ADD_SEGMENT](state, newSegment);

                expect(diff).to.deep.equal({ segments: [newSegment] });
            });

            it('should add new splits in correct order', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const segments = generateSegmentArray(10);

                segments.forEach((newSegment, index) => {
                    const diff = splitsModule.handlers[ID_HANDLER_ADD_SEGMENT](state, newSegment);

                    expect(diff).to.deep.equal({ segments: segments.slice(0, index + 1) });

                    state.segments.push(newSegment);
                });
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
                    const diff = splitsModule.handlers[ID_HANDLER_ADD_SEGMENT](state, segment);

                    expect(diff).to.deep.equal({}, `"${segment}" was accepted as valid segment`);
                });
            });
        });

        describe(ID_HANDLER_SET_SEGMENT, () => {
            it('should set the valid segment', () => {
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

                const diff = splitsModule.handlers[ID_HANDLER_SET_SEGMENT](state, {
                    index: 0,
                    segment: newSegment
                });

                expect(diff).to.deep.equal({
                    segments: [
                        newSegment,
                        originalSegments[1],
                        originalSegments[2],
                    ]
                });
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
                    const diff = splitsModule.handlers[ID_HANDLER_SET_SEGMENT](state, {
                        index: 0,
                        segment,
                    });

                    expect(diff).to.deep.equal({}, `"${segment}" was accepted as valid segment`);
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
                    const diff = splitsModule.handlers[ID_HANDLER_SET_SEGMENT](state, {
                        index,
                        segment: newSegment
                    });

                    expect(diff).to.deep.equal({}, `"${index}" was accepted as valid index`);
                });
            });
        });

        describe(ID_HANDLER_SET_ALL_SEGMENTS, () => {
            it('should set all segments', () => {
                const originalSegments = generateSegmentArray(5);
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: originalSegments.slice(0),
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                expect(state.segments.length).to.equal(originalSegments.length);
                expect(state.segments).to.deep.equal(originalSegments);

                const newSegments = generateSegmentArray(10);

                const diff = splitsModule.handlers[ID_HANDLER_SET_ALL_SEGMENTS](state, newSegments);

                expect(diff).to.deep.equal({ segments: newSegments });
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
                    let diff: Partial<SplitsState>;

                    diff = splitsModule.handlers[ID_HANDLER_SET_ALL_SEGMENTS](state, [invalidSegment]);
                    expect(diff).to.deep.equal({}, `"${[invalidSegment]}" were accepted as valid segments`);

                    diff = splitsModule.handlers[ID_HANDLER_SET_ALL_SEGMENTS](state, [invalidSegment, validSegment]);
                    expect(diff).to.deep.equal(
                        {},
                        `"${[invalidSegment, validSegment]}" were accepted as valid segments`
                    );

                    diff = splitsModule.handlers[ID_HANDLER_SET_ALL_SEGMENTS](state, [validSegment, invalidSegment]);
                    expect(diff).to.deep.equal(
                        {},
                        `"${[validSegment, invalidSegment]}" were accepted as valid segments`
                    );

                    diff = splitsModule.handlers[ID_HANDLER_SET_ALL_SEGMENTS](state, [
                        validSegment,
                        invalidSegment,
                        validSegment,
                    ]);
                    expect(diff).to.deep.equal(
                        {},
                        `"${[validSegment, invalidSegment, validSegment]}" were accepted as valid segments`
                    );
                });
            });
        });

        describe(ID_HANDLER_REMOVE_SEGMENT, () => {
            it('should remove the segment ', () => {
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

                    const diff = splitsModule.handlers[ID_HANDLER_REMOVE_SEGMENT](state, deleteIndex);

                    // Create a copy
                    const expectedSegments = originalSegments.slice(0);
                    // Remove the item like it should in the mutation
                    expectedSegments.splice(deleteIndex, 1);

                    expect(diff).to.deep.equal({ segments: expectedSegments });
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
                    5,
                    6,
                    7,
                    {},
                    [],
                    true,
                    false,
                ].forEach(value => {
                    const diff = splitsModule.handlers[ID_HANDLER_REMOVE_SEGMENT](state, value);
                    expect(diff).to.deep.equals({});
                });
            });
        });

        describe(ID_HANDLER_CLEAR_SEGMENTS, () => {
            it('should apply the mutation correctly', () => {
                const state: SplitsState = {
                    current: -1,
                    timing: TimingMethod.RTA,
                    segments: [{ id: 'test', name: 'test' }],
                    previousRTATotal: randomInt(99999),
                    previousIGTTotal: randomInt(99999),
                };

                const diff = splitsModule.handlers[ID_HANDLER_CLEAR_SEGMENTS](state, null);

                expect(diff).to.deep.equal({ segments: [] });
            });
        });

        describe(ID_HANDLER_DISCARDING_RESET, () => {
            it('should reset the segments correctly', () => {
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

                const diff = splitsModule.handlers[ID_HANDLER_SAVING_RESET](state, null);

                expect(diff).to.deep.equal({
                    segments: [
                        {
                            ...originalSegments[0],
                            currentTime: null,
                            hasNewOverallBest: false,
                            previousOverallBest: null,
                            startTime: -1,
                            skipped: false,
                            passed: false,
                        },
                        {
                            ...originalSegments[1],
                            currentTime: null,
                            hasNewOverallBest: false,
                            previousOverallBest: null,
                            startTime: -1,
                            skipped: false,
                            passed: false,
                        }
                    ]
                });
            });
        });

        describe(ID_HANDLER_SAVING_RESET, () => {
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

                const diff = splitsModule.handlers[ID_HANDLER_SAVING_RESET](state, null);

                expect(diff).to.deep.equal({
                    segments: [
                        {
                            ...originalSegments[0],
                            currentTime: null,
                            hasNewOverallBest: false,
                            previousOverallBest: null,
                            startTime: -1,
                            skipped: false,
                            passed: false,
                        },
                        {
                            ...originalSegments[1],
                            currentTime: null,
                            hasNewOverallBest: false,
                            previousOverallBest: null,
                            startTime: -1,
                            skipped: false,
                            passed: false,
                        }
                    ]
                });
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

                const diff = splitsModule.handlers[ID_HANDLER_SAVING_RESET](state, null);

                expect(diff).to.deep.equal({
                    segments: [
                        {
                            ...originalSegments[0],
                            currentTime: null,
                            hasNewOverallBest: false,
                            previousOverallBest: null,
                            startTime: -1,
                            skipped: false,
                            passed: false,
                        },
                    ],
                    previousRTATotal: newPBTime,
                    previousIGTTotal: newPBTime,
                });
            });
        });
    });
});
