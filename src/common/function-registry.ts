import { remote } from 'electron';

import { closeWindow, newWindow, reloadWindow } from '../utils/electron';
import { loadSplitsFromFileToStore, saveSplitsFromStoreToFile } from '../utils/io';
import { ContextMenuItemActionFunction } from './interfaces/context-menu-item';

export abstract class FunctionRegistry {
    private static contextMenuStore: { [key: string]: ContextMenuItemActionFunction } = {};

    public static registerContextMenuAction(name: string, action: ContextMenuItemActionFunction) {
        this.contextMenuStore[name] = action;
    }

    public static getContextMenuAction(name: string): ContextMenuItemActionFunction {
        return this.contextMenuStore[name];
    }

    public static unregisterConextMenuAction(name: string) {
        if (typeof this.contextMenuStore[name] === 'function') {
            delete this.contextMenuStore[name];
        }
    }
}

export function registerDefaultFunctions() {
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
            },
            '/splits-editor'
        );
    });
    FunctionRegistry.registerContextMenuAction('core.splits.load-from-file', params =>
        loadSplitsFromFileToStore(params.vNode.context.$store)
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
            },
            '/settings'
        );
    });
}
