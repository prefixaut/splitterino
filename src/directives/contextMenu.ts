import { VNode } from 'vue';

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
            vNode.context.$store.dispatch('overlay-host/show', {
                component: 'spl-context-menu',
                props: {
                    menus: binding.value,
                    x: e.clientX,
                    y: e.clientY
                },
                overlay: {
                    show: true,
                    closeOnClick: true
                },
                closeOnEscape: true
            });
        });
    }
};
