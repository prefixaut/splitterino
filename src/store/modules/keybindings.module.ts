import { Module } from 'vuex';

import { KeybindingsState } from '../states/keybindings.state';
import { KEYBINDING_SPLITS_SPLIT, KEYBINDING_SPLITS_SKIP, KEYBINDING_SPLITS_UNDO, KEYBINDING_SPLITS_TOGGLE_PAUSE } from '../../common/constants';

const MODULE_PATH = 'splitterino/keybindings';

const moduleState: KeybindingsState = {
    disableBindings: false,
    actions: [
        {
            id: KEYBINDING_SPLITS_SPLIT,
            label: 'Split Segment'
        },
        {
            id: KEYBINDING_SPLITS_SKIP,
            label: 'Skip Segment'
        },
        {
            id: KEYBINDING_SPLITS_UNDO,
            label: 'Undo Segment'
        },
        {
            id: KEYBINDING_SPLITS_TOGGLE_PAUSE,
            label: 'Pause/Unpause'
        },
    ],
    bindings: [],
};

const getters = {};

const mutations = {};

const actions = {};

export const keybindingsStoreModule: Module<KeybindingsState, any> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions,
};
