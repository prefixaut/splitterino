import { expect } from 'chai';
import { v4 as uuid } from 'uuid';
import { Store } from 'vuex';

import { Segment } from '../../../src/common/interfaces/segment';
import { config as storeConfig, patchBackgroundDispatch } from '../../../src/store';
import { ID_MUTATION_ADD_SEGMENT, MUTATION_ADD_SEGMENT, splitsStoreModule } from '../../../src/store/modules/splits.module';
import { RootState } from '../../../src/store/states/root.state';
import { SplitsState } from '../../../src/store/states/splits.state';

const store = patchBackgroundDispatch(new Store<RootState>({
    ...storeConfig,
}));

describe('Splits Store-Module', () => {
    describe('mutations', () => {
        it(MUTATION_ADD_SEGMENT, () => {
            const state: SplitsState = {
                current: -1,
                currentOpenFile: null,
                segments: [],
            };

            const segment: Segment = {
                id: uuid(),
                name: 'test',
            };

            splitsStoreModule.mutations[ID_MUTATION_ADD_SEGMENT](state, segment);

            expect(state.segments.length).to.equal(1);
            expect(state.segments[0].id).to.equal(segment.id);
        });
    });
});
