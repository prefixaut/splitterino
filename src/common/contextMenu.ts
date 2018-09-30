import { remote } from 'electron';
import { VNode } from 'vue';

export const ctxMenuDirective = {
    bind: (el, binding, vNode: VNode) => {
        if (
            !(binding.value instanceof Object) ||
            !('menu' in binding.value) ||
            !(typeof binding.value.menu == 'string')
        ) {
            throw new Error(
                "The argument 'menu' of type String has to be supplied"
            );
        }
        // convert to boolean
        binding.value.default = !!binding.value.default;
        el.addEventListener('contextmenu', () => {
            vNode.context.$store.dispatch('overlay-host/show', {
                component: 'spl-context-menu',
                props: binding.value,
                overlay: {
                    show: true,
                    closeOnClick: true
                },
                closeOnEscape: true
            });
        });
    }
};

export function reloadWindow() {
    location.reload();
}

export function closeWindow() {
    remote.getCurrentWindow().close();
}
