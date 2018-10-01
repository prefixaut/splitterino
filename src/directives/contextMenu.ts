import { VNode } from 'vue';
import { remote } from 'electron';

export default {
    bind: (el, binding, vNode: VNode) => {
        if (typeof binding.value === 'string') {
            binding.value = [binding.value];
        } else if (
            !Array.isArray(binding.value) ||
            !binding.value.every(el => typeof el === 'string')
        ) {
            throw new Error('An array with menus has to be supplied as value');
        }
        el.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            const menus: any[] = vNode.context.$store.getters[
                'splitterino/contextMenu/ctxMenu'
            ](binding.value);
            const menu = new remote.Menu();
            menus.forEach((el: any) => {
                if ('actions' in el) {
                    const actions = el.actions;
                    delete el.actions;
                    el.click = function() {
                        actions.forEach(el => {
                            if (typeof el === 'function') {
                                el();
                            }
                        });
                    };
                }
                menu.append(new remote.MenuItem(el));
            });
            menu.popup({
                window: remote.getCurrentWindow()
            });
        });
    }
};
