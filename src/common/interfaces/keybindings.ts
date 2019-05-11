/**
 * Interface to provide an easy and consistent way to store and
 * interact with keybindings.
 */
export interface Keybinding {
    /**
     * The build acclerator that electron is using for the binding.
     * @see https://electronjs.org/docs/api/accelerator
     */
    accelerator: string;
    /**
     * The actual keys that were used to build the accelerator.
     * used to display the keys/keybinding to the user more nicely.
     */
    keys: string[];
    /**
     * If the keybinding should work globally or only when
     * splitterino is an active/focused window.
     */
    global: boolean;
}

export interface KeybindingAction {
    id: string;
    label: string;
}

export interface ActionKeybinding extends Keybinding {
    action: string;
}
