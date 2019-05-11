import { KeybindingAction, ActionKeybinding } from '../../common/interfaces/keybindings';

export interface KeybindingsState {
    /** If the bindings should be disabled */
    disableBindings: boolean;
    /** Available actions which can be triggered */
    actions: KeybindingAction[];
    /** The actual keybindings to actions */
    bindings: ActionKeybinding[];
}
