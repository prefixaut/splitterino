import { expect } from 'chai';
import { v4 as uuid } from 'uuid';
import { Module } from 'vuex';

import { ELECTRON_INTERFACE_TOKEN } from '../../../src/common/interfaces/electron-interface';
import { Segment } from '../../../src/common/interfaces/segment';
import {
    getSplitsStoreModule,
    ID_MUTATION_ADD_SEGMENT,
    MUTATION_ADD_SEGMENT,
    MUTATION_CLEAR_SEGMENTS,
    ID_MUTATION_CLEAR_SEGMENTS,
    MUTATION_REMOVE_SEGMENT,
    ID_MUTATION_REMOVE_SEGMENT,
    MUTATION_SET_ALL_SEGMENTS,
    ID_MUTATION_SET_ALL_SEGMENTS,
    MUTATION_SET_SEGMENT,
    ID_MUTATION_SET_SEGMENT,
    MUTATION_SET_CURRENT,
    ID_MUTATION_SET_CURRENT,
    MUTATION_SOFT_RESET,
    ID_MUTATION_SOFT_RESET,
    MUTATION_HARD_RESET,
    ID_MUTATION_HARD_RESET,
    MUTATION_SET_CURRENT_OPEN_FILE,
    ID_MUTATION_SET_CURRENT_OPEN_FILE,
} from '../../../src/store/modules/splits.module';
import { RootState } from '../../../src/store/states/root.state';
import { SplitsState } from '../../../src/store/states/splits.state';
import { ElectronMockService } from '../../mocks/electron-mock.service';
import { createMockInjector } from '../../mocks/mocks';
import { now } from '../../../src/utils/time';

// Initialize the Dependency-Injection
const injector = createMockInjector();

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
    const module: Module<SplitsState, RootState> = getSplitsStoreModule(injector);
    // const electron = injector.get(ELECTRON_INTERFACE_TOKEN) as ElectronMockService;

    describe('mutations', () => {
        it(MUTATION_SET_CURRENT, () => {
            const newCurrent = 15;

            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: generateSegmentArray(20),
            };

            module.mutations[ID_MUTATION_SET_CURRENT](state, newCurrent);
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
                module.mutations[ID_MUTATION_SET_CURRENT](state, newCurrent);
                expect(state.current).to.equal(newCurrent);
            });
        });

        it (MUTATION_SET_CURRENT_OPEN_FILE, () => {
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [],
            };

            const newCurrentFile = 'test';
            module.mutations[ID_MUTATION_SET_CURRENT_OPEN_FILE](state, newCurrentFile);

            expect(state.currentOpenFile).to.equal(newCurrentFile);
        });

        it(MUTATION_ADD_SEGMENT, () => {
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [],
            };

            const segmentOne: Segment = {
                id: uuid(),
                name: 'test',
            };

            module.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentOne);

            expect(state.segments.length).to.equal(1);
            expect(state.segments[0].id).to.equal(segmentOne.id);

            const segmentTwo: Segment = {
                id: uuid(),
                name: 'test',
            };

            module.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentTwo);

            expect(state.segments.length).to.equal(2);
            expect(state.segments[0].id).to.equal(segmentOne.id);
            expect(state.segments[1].id).to.equal(segmentTwo.id);

            const segmentThree: Segment = {
                id: uuid(),
                name: 'test',
            };

            module.mutations[ID_MUTATION_ADD_SEGMENT](state, segmentThree);

            expect(state.segments.length).to.equal(3);
            expect(state.segments[0].id).to.equal(segmentOne.id);
            expect(state.segments[1].id).to.equal(segmentTwo.id);
            expect(state.segments[2].id).to.equal(segmentThree.id);
        });

        it(MUTATION_SET_SEGMENT, () => {
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

            module.mutations[ID_MUTATION_SET_SEGMENT](state, { index: 0, segment: newSegment });

            expect(state.segments.length).to.equal(3);
            expect(state.segments[0].id).to.equal(newSegment.id);
            expect(state.segments[1].id).to.equal('1');
            expect(state.segments[2].id).to.equal('2');
        });

        it(MUTATION_SET_ALL_SEGMENTS, () => {
            const originalSegments = generateSegmentArray(5);
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: originalSegments.slice(0),
            };

            expect(state.segments.length).to.equal(originalSegments.length);
            expect(state.segments).to.deep.eq(originalSegments);

            const newSegments = generateSegmentArray(10);

            module.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, newSegments);

            expect(state.segments.length).to.equal(newSegments.length);
            expect(state.segments).to.deep.eq(newSegments);
        });

        describe(MUTATION_REMOVE_SEGMENT, () => {
            it('should work the intended way', () => {
                const deleteIndicies = [0, 1, 2];
                const originalSegments = generateSegmentArray(deleteIndicies.length);

                deleteIndicies.forEach(deleteIndex => {
                    const state: SplitsState = {
                        current: -1,
                        currentOpenFile: null,
                        segments: originalSegments.slice(0),
                    };

                    module.mutations[ID_MUTATION_REMOVE_SEGMENT](state, deleteIndex);

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
                    module.mutations[ID_MUTATION_REMOVE_SEGMENT](state, value);
                    expect(state.segments.length).to.equal(originalSegments.length);
                    expect(state.segments).to.deep.eq(originalSegments);
                });
            });
        });

        it(MUTATION_CLEAR_SEGMENTS, () => {
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [
                    { id: 'test', name: 'test' },
                ],
            };

            module.mutations[ID_MUTATION_CLEAR_SEGMENTS](state, null);

            expect(state.segments.length).to.equal(0);
        });

        it(MUTATION_SOFT_RESET, () => {
            const originalSegments: Segment[] = generateSegmentArray(10);
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                // Create a copy
                segments: originalSegments.slice(0),
            };

            module.mutations[ID_MUTATION_SOFT_RESET](state, null);

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

        it(MUTATION_HARD_RESET, () => {
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

            module.mutations[ID_MUTATION_HARD_RESET](state, null);

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
