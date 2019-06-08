import { Injector } from 'lightweight-di';

import { IOService } from '../services/io.service';
import { ACTION_PAUSE, ACTION_SKIP, ACTION_SPLIT, ACTION_UNDO, ACTION_UNPAUSE } from '../store/modules/splits.module';
import {
    CTX_MENU_KEYBINDINGS_OPEN,
    CTX_MENU_SETTINGS_OPEN,
    CTX_MENU_SPLITS_EDIT,
    CTX_MENU_SPLITS_LOAD_FROM_FILE,
    CTX_MENU_SPLITS_SAVE_TO_FILE,
    CTX_MENU_WINDOW_CLOSE,
    CTX_MENU_WINDOW_RELOAD,
    KEYBINDING_SPLITS_SKIP,
    KEYBINDING_SPLITS_SPLIT,
    KEYBINDING_SPLITS_TOGGLE_PAUSE,
    KEYBINDING_SPLITS_UNDO,
} from './constants';
import { ContextMenuItemActionFunction } from './interfaces/context-menu-item';
import { ELECTRON_INTERFACE_TOKEN } from './interfaces/electron';
import { KeybindingActionFunction } from './interfaces/keybindings';
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

export function registerDefaultContextMenuFunctions(injector: Injector) {
    const electron = injector.get(ELECTRON_INTERFACE_TOKEN);
    const io = injector.get(IOService);

    /*
     * Window Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_WINDOW_RELOAD, () => electron.reloadCurrentWindow());
    FunctionRegistry.registerContextMenuAction(CTX_MENU_WINDOW_CLOSE, () => electron.closeCurrentWindow());

    /*
     * Split Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_EDIT, () => {
        electron.newWindow(
            {
                title: 'Splits Editor',
                parent: electron.getCurrentWindow(),
                minWidth: 440,
                minHeight: 220,
                modal: true,
            },
            '/splits-editor'
        );
    });
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_LOAD_FROM_FILE, params =>
        io.loadSplitsFromFileToStore(params.vNode.context.$store)
    );
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_SAVE_TO_FILE, params =>
        io.saveSplitsFromStoreToFile(params.vNode.context.$store, null, params.browserWindow)
    );

    /*
     * Setting Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SETTINGS_OPEN, () => {
        electron.newWindow(
            {
                title: 'Settings',
                parent: electron.getCurrentWindow(),
                minWidth: 440,
                minHeight: 220,
                modal: true,
            },
            '/settings'
        );
    });

    /*
     * Keybinding Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_KEYBINDINGS_OPEN, () => {
        electron.newWindow(
            {
                title: 'Keybindings',
                parent: electron.getCurrentWindow(),
                minWidth: 440,
                minHeight: 220,
                modal: true,
            },
            '/keybindings'
        );
    });
}

export function registerDefaultKeybindingFunctions() {
    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_SPLIT, params => {
        params.store.dispatch(ACTION_SPLIT);
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_SKIP, params => {
        params.store.dispatch(ACTION_SKIP);
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_UNDO, params => {
        params.store.dispatch(ACTION_UNDO);
    });

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_TOGGLE_PAUSE, params => {
        switch (params.store.state.splitterino.timer.status) {
            case TimerStatus.RUNNING:
                params.store.dispatch(ACTION_PAUSE);
                break;
            case TimerStatus.PAUSED:
                params.store.dispatch(ACTION_UNPAUSE);
        }
    });
}
