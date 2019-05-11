import { remote } from 'electron';

import { closeWindow, newWindow, reloadWindow } from '../utils/electron';
import { loadSplitsFromFileToStore, saveSplitsFromStoreToFile } from '../utils/io';
import { ContextMenuItemActionFunction } from './interfaces/context-menu-item';
import { KeybindingActionFunction } from './interfaces/keybindings';

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

export function registerDefaultFunctions() {
    registerDefaultContextMenuFunctions();
    registerDefaultKeybindingFunctions();
}

function registerDefaultContextMenuFunctions() {
/*
     * Window Actions
     */
    FunctionRegistry.registerContextMenuAction('core.window.reload', reloadWindow);
    FunctionRegistry.registerContextMenuAction('core.window.close', closeWindow);

    /*
     * Split Actions
     */
    FunctionRegistry.registerContextMenuAction('core.splits.edit', () => {
        newWindow(
            {
                title: 'Splits Editor',
                parent: remote.getCurrentWindow(),
                minWidth: 440,
                minHeight: 220,
                modal: true,
            },
            '/splits-editor'
        );
    });
    FunctionRegistry.registerContextMenuAction('core.splits.load-from-file', params =>
        loadSplitsFromFileToStore(params.vNode.context)
    );
    FunctionRegistry.registerContextMenuAction('core.splits.save-to-file', params =>
        saveSplitsFromStoreToFile(params.vNode.context, null, params.browserWindow)
    );

    /*
     * Setting Actions
     */
    FunctionRegistry.registerContextMenuAction('core.settings.open', () => {
        newWindow(
            {
                title: 'Settings',
                parent: remote.getCurrentWindow(),
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
    FunctionRegistry.registerContextMenuAction('core.keybindings.open', () => {
        newWindow(
            {
                title: 'Keybindings',
                parent: remote.getCurrentWindow(),
                minWidth: 440,
                minHeight: 220,
                modal: true,
            },
            '/keybindings'
        );
    });
}

function registerDefaultKeybindingFunctions() {}
