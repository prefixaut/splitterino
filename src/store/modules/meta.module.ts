import { Module, ActionContext } from 'vuex';
import { pull } from 'lodash';

import { RootState } from '../states/root.state';
import { MetaState } from '../states/meta.state';

const MODULE_PATH = 'splitterino/meta';

const ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES = 'setLastOpenedSplitsFiles';
const ID_MUTATION_ADD_OPENED_SPLITS_FILE = 'addOpenedSplitsFile';

const ID_ACTION_SET_LAST_OPENED_SPLITS_FILES = 'setLastOpenedSplitsFiles';
const ID_ACTION_ADD_OPENED_SPLITS_FILE = 'addOpenedSplitsFile';

export const MUTATION_SET_LAST_OPENED_SPLITS_FILES = `${MODULE_PATH}/${ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES}`;
export const MUTATION_ADD_OPENED_SPLITS_FILE = `${MODULE_PATH}/${ID_MUTATION_ADD_OPENED_SPLITS_FILE}`;

export const ACTION_SET_LAST_OPENED_SPLITS_FILES = `${MODULE_PATH}/${ID_ACTION_SET_LAST_OPENED_SPLITS_FILES}`;
export const ACTION_ADD_OPENED_SPLITS_FILE = `${MODULE_PATH}/${ID_ACTION_ADD_OPENED_SPLITS_FILE}`;

export function getMetaModule(): Module<MetaState, RootState> {
    return {
        namespaced: true,
        state: {
            lastOpenedSplitsFiles: []
        },
        getters: {
        },
        mutations: {
            [ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES](state: MetaState, lastOpenedSplitsFiles: string[]) {
                state.lastOpenedSplitsFiles = lastOpenedSplitsFiles;
            },
            [ID_MUTATION_ADD_OPENED_SPLITS_FILE](state: MetaState, splitsFile: string) {
                pull(state.lastOpenedSplitsFiles, splitsFile);

                state.lastOpenedSplitsFiles.unshift(splitsFile);

                if (state.lastOpenedSplitsFiles.length >= 10) {
                    state.lastOpenedSplitsFiles = state.lastOpenedSplitsFiles.slice(0, 10);
                }
            },
        },
        actions: {
            [ID_ACTION_SET_LAST_OPENED_SPLITS_FILES](
                context: ActionContext<MetaState, RootState>,
                lastOpenedSplitsFiles: string[]
            ) {
                context.commit(ID_MUTATION_SET_LAST_OPENED_SPLITS_FILES, lastOpenedSplitsFiles);
            },
            [ID_ACTION_ADD_OPENED_SPLITS_FILE](
                context: ActionContext<MetaState, RootState>,
                splitsFile: string
            ) {
                context.commit(ID_MUTATION_ADD_OPENED_SPLITS_FILE, splitsFile);
            },
        },
    };
}
