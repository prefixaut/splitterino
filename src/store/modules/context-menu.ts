import { remote } from 'electron';
import { Module } from 'vuex';

import { closeWindow, reloadWindow } from '../../common/context-menu';
import { newWindow } from '../../utils/new-window';
import { ContextMenuState } from '../states/context-menu';

const moduleState: ContextMenuState = {
    def: [
        {
            label: 'Reload',
            actions: [reloadWindow]
        },
        {
            label: 'Exit',
            actions: [closeWindow]
        },
    ],
    splitter: [
        {
            label: 'Edit Splits ...',
            actions: [
                () => {
                    newWindow(
                        {
                            title: 'Splits Editor',
                            parent: remote.getCurrentWindow(),
                            minWidth: 440,
                            minHeight: 220,
                        },
                        '/splits-editor'
                    );
                }
            ]
        }
    ]
};

const getters = {
    ctxMenu(state) {
        return (menus: string[]): Object[] => {
            const ctxMenu: Object[] = [];
            menus.forEach((el: string) => {
                if (!(el in state)) {
                    throw new Error(`Menu '${el} does not exist in state'`);
                }
                ctxMenu.push(...state[el]);
            });

            return ctxMenu;
        };
    }
};

const mutations = {};

const actions = {};

export const contextMenuStoreModule: Module<ContextMenuState, any> = {
    namespaced: true,
    state: moduleState,
    getters,
    mutations,
    actions
};
