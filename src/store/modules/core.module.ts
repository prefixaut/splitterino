import { Module } from 'vuex';

import { RootState } from '../../models/states/root.state';
import { CoreState } from '../../models/states/core.state';

const MODULE_PATH = 'splitterino/core';

export const ID_MUTATION_APPLY_DIFF = 'applyDiff';
export const MUTATION_APPLY_DIFF = `${MODULE_PATH}/${ID_MUTATION_APPLY_DIFF}`;

export function getCoreStoreModule(): Module<CoreState, RootState> {
    return {
        namespaced: true,
        mutations: {
            [ID_MUTATION_APPLY_DIFF](state: RootState, diff: any) {
                // TODO: Apply diff
            }
        }
    }
}
