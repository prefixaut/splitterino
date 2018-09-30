import { reloadWindow, closeWindow } from '../../common/contextMenu';

const state = {
    def: [
        {
            text: 'Reload',
            actions: [reloadWindow]
        },
        {
            text: 'Exit',
            actions: [closeWindow]
        }
    ],
    splitter: [
        {
            text: 'Edit Splits',
            actions: []
        }
    ]
};

const getters = {
    ctxMenu(state) {
        return (menus: string[]): Object[] => {
            console.log(menus);
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
