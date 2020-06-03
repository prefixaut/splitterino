import { Injector } from 'lightweight-di';

import { ContextMenuItemActionFunction } from '../models/context-menu-item';
import { KeybindingActionFunction } from '../models/keybindings';
import { ACTION_SERVICE_TOKEN, ELECTRON_SERVICE_TOKEN, IO_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from '../models/services';
import {
    openKeybindgsEditor,
    openLoadSplits,
    openLoadTemplate,
    openSettingsEditor,
    openSplitsEditor,
} from '../utils/windows';
import {
    CTX_MENU_KEYBINDINGS_OPEN,
    CTX_MENU_SETTINGS_OPEN,
    CTX_MENU_SPLITS_EDIT,
    CTX_MENU_SPLITS_LOAD_FROM_FILE,
    CTX_MENU_SPLITS_SAVE_TO_FILE,
    CTX_MENU_TEMPLATES_LOAD_FROM_FILE,
    CTX_MENU_WINDOW_CLOSE,
    CTX_MENU_WINDOW_RELOAD,
    KEYBINDING_SPLITS_RESET,
    KEYBINDING_SPLITS_SKIP,
    KEYBINDING_SPLITS_SPLIT,
    KEYBINDING_SPLITS_TOGGLE_PAUSE,
    KEYBINDING_SPLITS_UNDO,
} from './constants';
import { TimerStatus } from './timer-status';

export abstract class FunctionRegistry {
    private static contextMenuStore: { [key: string]: ContextMenuItemActionFunction } = {};
    private static keybindingsStore: { [key: string]: KeybindingActionFunction } = {};

    public static registerContextMenuAction(id: string, action: ContextMenuItemActionFunction) {
        this.contextMenuStore[id] = action;
    }

    public static registerKeybindingAction(action: string, fn: KeybindingActionFunction) {
        this.keybindingsStore[action] = fn;
    }

    public static getContextMenuAction(id: string): ContextMenuItemActionFunction {
        return this.contextMenuStore[id];
    }

    public static getKeybindingAction(action: string): KeybindingActionFunction {
        return this.keybindingsStore[action];
    }

    public static unregisterConextMenuAction(id: string) {
        if (typeof this.contextMenuStore[id] === 'function') {
            delete this.contextMenuStore[id];
        }
    }

    public static unregisterKeybindingAction(action: string) {
        if (typeof this.keybindingsStore[action] === 'function') {
            delete this.keybindingsStore[action];
        }
    }
}

// TODO: Defaults for new windows
export function registerDefaultContextMenuFunctions(injector: Injector) {
    const electron = injector.get(ELECTRON_SERVICE_TOKEN);
    const io = injector.get(IO_SERVICE_TOKEN);

    /*
     * Window Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_WINDOW_RELOAD, () => electron.reloadCurrentWindow());
    FunctionRegistry.registerContextMenuAction(CTX_MENU_WINDOW_CLOSE, () => electron.closeCurrentWindow());

    /*
     * Split Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_EDIT, () => {
        openSplitsEditor(injector);
    });
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_LOAD_FROM_FILE, () => {
        openLoadSplits(injector);
    });
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_SAVE_TO_FILE, params => {
        io.saveSplitsFromStoreToFile(null, params.browserWindow);
    });

    /*
     * Setting Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SETTINGS_OPEN, () => {
        openSettingsEditor(electron);
    });

    /*
     * Keybinding Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_KEYBINDINGS_OPEN, () => {
        openKeybindgsEditor(electron);
    });

    /*
     * Open Template File
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_TEMPLATES_LOAD_FROM_FILE, () => {
        openLoadTemplate(injector);
    });
}

export function registerDefaultKeybindingFunctions(injector: Injector) {
    const store = injector.get(STORE_SERVICE_TOKEN);
    const actions = injector.get(ACTION_SERVICE_TOKEN);
    const electron = injector.get(ELECTRON_SERVICE_TOKEN);

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_SPLIT, () => {
        // The same action has to start the timer as well
        switch (store.state.splitterino.timer.status) {
            case TimerStatus.STOPPED:
                actions.startTimer();
                break;
            default:
                actions.splitTimer();
        }
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_SKIP, () => {
        actions.skipSplit();
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_UNDO, () => {
        actions.revertSplit();
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_TOGGLE_PAUSE, () => {
        switch (store.state.splitterino.timer.status) {
            case TimerStatus.RUNNING:
                actions.pauseTimer();
                break;
            case TimerStatus.PAUSED:
                actions.unpauseTimer();
        }
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_RESET, () => {
        actions.resetTimer(electron.getCurrentWindow().id);
    });
}
