import { closeWindow, reloadWindow } from '../../common/context-menu';

const state = {
    def: [
        {
            label: 'Reload',
            actions: [reloadWindow]
        },
        {
            label: 'Exit',
            actions: [closeWindow]
        }
    ],
    splitter: [
        {
            label: 'Edit Splits',
            actions: []
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

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
};
