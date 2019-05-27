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
} from '../../../src/store/modules/splits.module';
import { RootState } from '../../../src/store/states/root.state';
import { SplitsState } from '../../../src/store/states/splits.state';
import { ElectronMockService } from '../../mocks/electron-mock.service';
import { createMockInjector } from '../../mocks/mocks';

// Initialize the Dependency-Injection
const injector = createMockInjector();

describe('Splits Store-Module', () => {
    const module: Module<SplitsState, RootState> = getSplitsStoreModule(injector);
    // const electron = injector.get(ELECTRON_INTERFACE_TOKEN) as ElectronMockService;

    describe('mutations', () => {
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

        it(MUTATION_REMOVE_SEGMENT, () => {
            const stateOne: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [
                    { id: '0', name: '0' },
                    { id: '1', name: '1' },
                    { id: '2', name: '2' },
                ],
            };

            module.mutations[ID_MUTATION_REMOVE_SEGMENT](stateOne, 0);

            expect(stateOne.segments.length).to.equal(2);
            expect(stateOne.segments[0].id).to.equal('1');
            expect(stateOne.segments[1].id).to.equal('2');

            const stateTwo: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [
                    { id: '0', name: '0' },
                    { id: '1', name: '1' },
                    { id: '2', name: '2' },
                ],
            };

            module.mutations[ID_MUTATION_REMOVE_SEGMENT](stateTwo, 1);

            expect(stateTwo.segments.length).to.equal(2);
            expect(stateTwo.segments[0].id).to.equal('0');
            expect(stateTwo.segments[1].id).to.equal('2');

            const stateThree: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [
                    { id: '0', name: '0' },
                    { id: '1', name: '1' },
                    { id: '2', name: '2' },
                ],
            };

            module.mutations[ID_MUTATION_REMOVE_SEGMENT](stateThree, 2);

            expect(stateThree.segments.length).to.equal(2);
            expect(stateThree.segments[0].id).to.equal('0');
            expect(stateThree.segments[1].id).to.equal('1');

            const stateFour: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [
                    { id: '0', name: '0' },
                    { id: '1', name: '1' },
                    { id: '2', name: '2' },
                ],
            };

            [
                null,
                undefined,
                'invalid',
                NaN,
                -NaN,
                Infinity,
                -Infinity,
                3,
                -1,
                {},
                [],
                true,
                false
            ].forEach(value => {
                module.mutations[ID_MUTATION_REMOVE_SEGMENT](stateFour, value);
                expect(stateFour.segments.length).to.equal(3);
                expect(stateFour.segments[0].id).to.equal('0');
                expect(stateFour.segments[1].id).to.equal('1');
                expect(stateFour.segments[2].id).to.equal('2');
            });
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

        it(MUTATION_SET_ALL_SEGMENTS, () => {
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [
                    { id: '0', name: '0' },
                    { id: '1', name: '1' },
                    { id: '2', name: '2' },
                ],
            };

            expect(state.segments.length).to.equal(3);
            expect(state.segments[0].id).to.equal('0');
            expect(state.segments[1].id).to.equal('1');
            expect(state.segments[2].id).to.equal('2');

            const newSegments = [
                { id: uuid(), name: 'test' },
                { id: uuid(), name: 'test' },
                { id: uuid(), name: 'test' },
                { id: uuid(), name: 'test' },
                { id: uuid(), name: 'test' },
            ];

            module.mutations[ID_MUTATION_SET_ALL_SEGMENTS](state, newSegments);

            expect(state.segments.length).to.equal(newSegments.length);
            newSegments.forEach((segment, index) => {
                expect(state.segments[index].id).to.equal(segment.id);
            });
        });
    });
});
