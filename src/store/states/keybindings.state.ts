import { KeybindingDescriptor, ActionKeybinding } from '../../common/interfaces/keybindings';

export interface KeybindingsState {
    /** If the bindings should be disabled */
    disableBindings: boolean;
    /** Available actions which can be triggered */
    actions: KeybindingDescriptor[];
    /** The actual keybindings to actions */
    bindings: ActionKeybinding[];
}
