import { reloadWindow, closeWindow } from '../../common/contextMenu';

const state = {
    default: [
        {
            text: 'Reload',
            actions: [reloadWindow]
        },
        {
            text: 'Exit',
            actions: [closeWindow]
        }
    ],
    splitter: {}
};

const mutations = {};

const actions = {};

export default {
    namespaced: true,
    state,
    mutations,
    actions
};
