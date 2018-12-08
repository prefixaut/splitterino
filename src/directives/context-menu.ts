import { remote } from 'electron';
import { VNode } from 'vue';

import { ContextMenuItem } from '../common/context-menu-item';

export const contextMenuDirective = {
    bind(value, binding, vNode: VNode) {
        if (typeof binding.value === 'string') {
            binding.value = [binding.value];
        } else if (
            !Array.isArray(binding.value) ||
            !binding.value.every(el => typeof el === 'string')
        ) {
            throw new Error('An array with menus has to be supplied as value');
        }

        value.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();

            const menus: ContextMenuItem[] = vNode.context.$store.getters[
                'splitterino/contextMenu/ctxMenu'
            ](binding.value);
            const contextMenu = new remote.Menu();

            menus.forEach((menu: any) => {
                if ('actions' in menu) {
                    const actions = menu.actions;
                    delete menu.actions;
                    menu.click = () => {
                        actions.forEach(action => {
                            if (typeof action === 'function') {
                                action();
                            }
                        });
                    };
                }
                menu.append(new remote.MenuItem(menu));
            });

            contextMenu.popup({
                window: remote.getCurrentWindow()
            });
        });
    }
};
