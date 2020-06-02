import {
    KEYBINDING_SPLITS_RESET,
    KEYBINDING_SPLITS_SKIP,
    KEYBINDING_SPLITS_SPLIT,
    KEYBINDING_SPLITS_TOGGLE_PAUSE,
    KEYBINDING_SPLITS_UNDO,
} from '../../common/constants';
import { ActionKeybinding, isActionKeybinding } from '../../models/keybindings';
import { KeybindingsState } from '../../models/states/keybindings.state';
import { Module } from '../../models/store';

const MODULE_PATH = 'splitterino/keybindings';

export const ID_HANDLER_SET_BINDINGS = 'setBindings';
export const ID_HANDLER_DISABLE_BINDINGS = 'disableBindings';

export const HANDLER_SET_BINDINGS = `${MODULE_PATH}/${ID_HANDLER_SET_BINDINGS}`;
export const HANDLER_SET_DISABLE_BINDINGS = `${MODULE_PATH}/${ID_HANDLER_DISABLE_BINDINGS}`;

export function getKeybindingsStoreModule(): Module<KeybindingsState> {
    return {
        initialize() {
            return {
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
            };
        },
        handlers: {
            [ID_HANDLER_SET_BINDINGS](state: KeybindingsState, payload: ActionKeybinding[]) {
                if (!Array.isArray(payload)) {
                    payload = [payload];
                }

                return { bindings: payload.filter(isActionKeybinding) };
            },
            [ID_HANDLER_DISABLE_BINDINGS](state: KeybindingsState, payload: boolean) {
                return { disableBindings: !!payload };
            }
        }
    };
}
