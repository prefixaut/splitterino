import { Module } from 'vuex';

import {
    CTX_MENU_KEYBINDINGS_OPEN,
    CTX_MENU_SETTINGS_OPEN,
    CTX_MENU_SPLITS_EDIT,
    CTX_MENU_SPLITS_LOAD_FROM_FILE,
    CTX_MENU_SPLITS_SAVE_TO_FILE,
    CTX_MENU_WINDOW_CLOSE,
    CTX_MENU_WINDOW_RELOAD,
} from '../../common/constants';
import { ContextMenuState } from '../states/context-menu.state';
import { RootState } from '../states/root.state';

const MODULE_PATH = 'splitterino/contextMenu';

const ID_GETTER_MENUES = 'ctxMenu';

export const GETTER_MENUES = `${MODULE_PATH}/${ID_GETTER_MENUES}`;

const moduleState: ContextMenuState = {
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

const getters = {
    [ID_GETTER_MENUES](state) {
        return (menus: string[]): Object[] => {
            const ctxMenu: Object[] = [];
            menus.forEach((el: string) => {
                if (!(el in state)) {
                    throw new Error(`Menu '${el}' does not exist in state`);
                }
                ctxMenu.push(...state[el]);
            });

            return ctxMenu;
        };
    },
};

const mutations = {};

const actions = {};

export const contextMenuStoreModule: Module<ContextMenuState, RootState> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions,
};
