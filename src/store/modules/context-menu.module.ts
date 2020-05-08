import {
    CTX_MENU_KEYBINDINGS_OPEN,
    CTX_MENU_SETTINGS_OPEN,
    CTX_MENU_SPLITS_EDIT,
    CTX_MENU_SPLITS_LOAD_FROM_FILE,
    CTX_MENU_SPLITS_SAVE_TO_FILE,
    CTX_MENU_TEMPLATES_LOAD_FROM_FILE,
    CTX_MENU_WINDOW_CLOSE,
    CTX_MENU_WINDOW_RELOAD,
} from '../../common/constants';
import { ContextMenuItem } from '../../models/context-menu-item';
import { ContextMenuState } from '../../models/states/context-menu.state';
import { Module } from '..';

export function getContextMenuStoreModule(): Module<ContextMenuState> {
    return {
        initialize() {
            return {
                def: [
                    {
                        label: 'Reload',
                        actions: [CTX_MENU_WINDOW_RELOAD],
                    },
                    {
                        label: 'Exit',
                        actions: [CTX_MENU_WINDOW_CLOSE],
                    },
                ],
                splitter: [
                    {
                        label: 'Edit Splits ...',
                        actions: [CTX_MENU_SPLITS_EDIT],
                    },
                    {
                        label: 'Load Splits ...',
                        actions: [CTX_MENU_SPLITS_LOAD_FROM_FILE],
                    },
                    {
                        label: 'Save Splits ...',
                        actions: [CTX_MENU_SPLITS_SAVE_TO_FILE],
                    },
                ],
                templates: [
                    {
                        label: 'Load Templates ...',
                        actions: [CTX_MENU_TEMPLATES_LOAD_FROM_FILE],
                    },
                ],
                settings: [
                    {
                        label: 'Settings ...',
                        actions: [CTX_MENU_SETTINGS_OPEN],
                    },
                ],
                keybindings: [
                    {
                        label: 'Keybindings ...',
                        actions: [CTX_MENU_KEYBINDINGS_OPEN],
                    },
                ],
            };
        },
        handlers: {

        }
    };
}

export function contextMenuGetter(state: ContextMenuState) {
    return (menus: string[]): ContextMenuItem[] => {
        const ctxMenu: ContextMenuItem[] = [];
        menus.forEach((el, index) => {
            if (!(el in state)) {
                throw new Error(`Menu '${el}' does not exist in state`);
            }

            ctxMenu.push(...state[el]);

            if (index < menus.length - 1) {
                ctxMenu.push({ type: 'separator' });
            }
        });

        return ctxMenu;
    };
}
