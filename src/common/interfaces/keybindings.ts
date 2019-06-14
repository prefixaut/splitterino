import { Store } from 'vuex';

import { RootState } from '../../store/states/root.state';
import { Injector } from 'lightweight-di';

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

/**
 * Descriptor for an Action that can be triggered.
 */
export interface KeybindingDescriptor {
    id: string;
    label: string;
}

/**
 * Extension of the regular Keybinding which binds to an Action.
 */
export interface ActionKeybinding extends Keybinding {
    /**
     * The ID of the Action the Keybinding is triggering.
     *
     * @see KeybindingDescriptor#id
     */
    action: string;
}

export function isActionKeybinding(value: any): value is ActionKeybinding {
    if (value == null || typeof value !== 'object') {
        return false;
    }

    return typeof value.accelerator === 'string' && Array.isArray(value.keys) && typeof value.action === 'string';
}

export interface KeybindingActionFunctionParameters {
    store: Store<RootState>;
    injector: Injector;
}

export type KeybindingActionFunction = (params: KeybindingActionFunctionParameters) => void;
