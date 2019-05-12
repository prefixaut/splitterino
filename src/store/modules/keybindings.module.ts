import { Module, ActionContext } from 'vuex';

import { KeybindingsState } from '../states/keybindings.state';
import { KEYBINDING_SPLITS_SPLIT, KEYBINDING_SPLITS_SKIP, KEYBINDING_SPLITS_UNDO, KEYBINDING_SPLITS_TOGGLE_PAUSE } from '../../common/constants';
import { ActionKeybinding } from '../../common/interfaces/keybindings';
import { RootState } from '../states/root.state';

const MODULE_PATH = 'splitterino/keybindings';

const ID_MUTATION_SET_BINDINGS = 'setBindings';

const ID_ACTION_SET_BINDINGS = 'setBindings';

export const MUTATION_SET_BINDINGS = `${MODULE_PATH}/${ID_MUTATION_SET_BINDINGS}`;

export const ACTION_SET_BINDINGS = `${MODULE_PATH}/${ID_ACTION_SET_BINDINGS}`;

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

const mutations = {
    [ID_MUTATION_SET_BINDINGS](state: KeybindingsState, payload: ActionKeybinding[]) {
        console.log('mutation', payload);
        if (!Array.isArray(payload)) {
            return;
        }

        state.bindings = payload;
    }
};

const actions = {
    [ID_ACTION_SET_BINDINGS](context: ActionContext<KeybindingsState, RootState>, payload: ActionKeybinding[]) {
        console.log('action', payload);
        if (!Array.isArray(payload)) {
            return false;
        }

        context.commit(ID_MUTATION_SET_BINDINGS, payload);

        return true;
    }
};

export const keybindingsStoreModule: Module<KeybindingsState, any> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions,
};
