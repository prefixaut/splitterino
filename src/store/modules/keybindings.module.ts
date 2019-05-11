import { Module } from 'vuex';

import { KeybindingsState } from '../states/keybindings.state';

const MODULE_PATH = 'splitterino/keybindings';

const moduleState: KeybindingsState = {
    disableBindings: false,
    actions: [
        {
            id: 'core.splits.split',
            label: 'Split Segment'
        },
        {
            id: 'core.splits.skip',
            label: 'Skip Segment'
        },
        {
            id: 'core.splits.revert',
            label: 'Revert Segment'
        },
        {
            id: 'core.timer.pause',
            label: 'Pause/Unpause Timer'
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
