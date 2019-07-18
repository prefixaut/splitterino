import { Injector } from 'lightweight-di';
import { IO_SERVICE_TOKEN } from '../services/io.service';
import { ACTION_PAUSE, ACTION_RESET, ACTION_SKIP, ACTION_SPLIT, ACTION_START, ACTION_UNDO, ACTION_UNPAUSE } from '../store/modules/splits.module';
import { RootState } from '../store/states/root.state';
import { CTX_MENU_KEYBINDINGS_OPEN, CTX_MENU_SETTINGS_OPEN, CTX_MENU_SPLITS_EDIT, CTX_MENU_SPLITS_LOAD_FROM_FILE, CTX_MENU_SPLITS_SAVE_TO_FILE, CTX_MENU_WINDOW_CLOSE, CTX_MENU_WINDOW_RELOAD, KEYBINDING_SPLITS_RESET, KEYBINDING_SPLITS_SKIP, KEYBINDING_SPLITS_SPLIT, KEYBINDING_SPLITS_TOGGLE_PAUSE, KEYBINDING_SPLITS_UNDO } from './constants';
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

// TODO: Defaults for new windows
export function registerDefaultContextMenuFunctions(injector: Injector) {
    const electron = injector.get(ELECTRON_INTERFACE_TOKEN);
    const io = injector.get(IO_SERVICE_TOKEN);

    /*
     * Window Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_WINDOW_RELOAD, () => electron.reloadCurrentWindow());
    FunctionRegistry.registerContextMenuAction(CTX_MENU_WINDOW_CLOSE, () => electron.closeCurrentWindow());

    /*
     * Split Actions
     */
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_EDIT, async params => {
        const store = params.vNode.context.$store;
        const state: RootState = store.state;
        const status = state.splitterino.timer.status;

        if (status === TimerStatus.FINISHED) {
            // Finish the run when attempting to edit the splits
            await store.dispatch(ACTION_SPLIT);
        } else if (status !== TimerStatus.STOPPED) {
            electron.showMessageDialog(electron.getCurrentWindow(), {
                title: 'Editing not allowed',
                message: 'You can not edit the Splits while there is a run going!',
                type: 'error',
            });

            return;
        }

        electron.newWindow(
            {
                title: 'Splits Editor',
                parent: electron.getCurrentWindow(),
                modal: true,
                minimizable: false
            },
            '/splits-editor'
        );
    });
    FunctionRegistry.registerContextMenuAction(CTX_MENU_SPLITS_LOAD_FROM_FILE, params => {
        if ((params.vNode.context.$store.state as RootState).splitterino.meta.lastOpenedSplitsFiles.length === 0) {
            io.loadSplitsFromFileToStore(params.vNode.context.$store);
        } else {
            electron.newWindow(
                {
                    title: 'Open Splits File',
                    parent: electron.getCurrentWindow(),
                    resizable: false,
                    width: 440,
                    height: 250,
                    modal: true,
                    minimizable: false
                },
                '/open-splits'
            );
        }
    });
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
                width: 650,
                height: 310,
                modal: true,
                minimizable: false
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
                width: 650,
                height: 310,
                modal: true,
                minimizable: false
            },
            '/keybindings'
        );
    });
}

export function registerDefaultKeybindingFunctions() {
    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_SPLIT, params => {
        // The same action has to start the timer as well
        switch (params.store.state.splitterino.timer.status) {
            case TimerStatus.STOPPED:
                params.store.dispatch(ACTION_START);
                break;
            default:
                params.store.dispatch(ACTION_SPLIT);
        }
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

    FunctionRegistry.registerKeybindingAction(KEYBINDING_SPLITS_RESET, params => {
        params.store.dispatch(ACTION_RESET, {
            windowId: params.injector.get(ELECTRON_INTERFACE_TOKEN).getCurrentWindow().id,
        });
    });
}
