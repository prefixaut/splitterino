import { ActionContext, Module } from 'vuex';

import {
    KEYBINDING_SPLITS_RESET,
    KEYBINDING_SPLITS_SKIP,
    KEYBINDING_SPLITS_SPLIT,
    KEYBINDING_SPLITS_TOGGLE_PAUSE,
    KEYBINDING_SPLITS_UNDO,
} from '../../common/constants';
import { ActionKeybinding, isActionKeybinding } from '../../common/interfaces/keybindings';
import { KeybindingsState } from '../states/keybindings.state';
import { RootState } from '../states/root.state';

const MODULE_PATH = 'splitterino/keybindings';

const ID_MUTATION_SET_BINDINGS = 'setBindings';
const ID_MUTATION_DISABLE_BINDINGS = 'disableBindings';

const ID_ACTION_SET_BINDINGS = 'setBindings';
const ID_ACTION_DISABLE_BINDINGS = 'disableBindings';

export const MUTATION_SET_BINDINGS = `${MODULE_PATH}/${ID_MUTATION_SET_BINDINGS}`;
export const MUTATION_SET_DISABLE_BINDINGS = `${MODULE_PATH}/${ID_MUTATION_DISABLE_BINDINGS}`;

export const ACTION_SET_BINDINGS = `${MODULE_PATH}/${ID_ACTION_SET_BINDINGS}`;
export const ACTION_DISABLE_BINDINGS = `${MODULE_PATH}/${ID_ACTION_DISABLE_BINDINGS}`;

export function getKeybindingsStoreModule(): Module<KeybindingsState, RootState> {
    return {
        namespaced: true,
        state: {
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
                {
                    id: KEYBINDING_SPLITS_RESET,
                    label: 'Reset Splits',
                }
            ],
            bindings: [],
        },
        getters: {},
        mutations: {
            [ID_MUTATION_SET_BINDINGS](state: KeybindingsState, payload: ActionKeybinding[]) {
                if (!Array.isArray(payload)) {
                    payload = [payload];
                }

                state.bindings = payload.filter(isActionKeybinding);
            },
            [ID_MUTATION_DISABLE_BINDINGS](state: KeybindingsState, payload: boolean) {
                state.disableBindings = !!payload;
            }
        },
        actions: {
            [ID_ACTION_SET_BINDINGS](context: ActionContext<KeybindingsState, RootState>, payload: ActionKeybinding[]) {
                context.commit(ID_MUTATION_SET_BINDINGS, payload);

                return Promise.resolve(true);
            },
            [ID_ACTION_DISABLE_BINDINGS](context: ActionContext<KeybindingsState, RootState>, payload: boolean) {
                context.commit(ID_MUTATION_DISABLE_BINDINGS, payload);

                return Promise.resolve(true);
            }
        },
    };
}
