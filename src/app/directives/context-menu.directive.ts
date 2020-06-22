import { Injector } from 'lightweight-di';
import { DirectiveOptions, VNode, VNodeDirective } from 'vue';

import { ELECTRON_SERVICE_TOKEN } from '../../common/constants';
import { ContextMenuItem } from '../../models/context-menu-item';
import { contextMenuGetter } from '../../store/modules/context-menu.module';

export function getContextMenuDirective(injector: Injector): DirectiveOptions {
    return {
        bind(element: HTMLElement, binding: VNodeDirective, vNode: VNode) {
            const value = getBindingValue(binding);

            element.addEventListener('contextmenu', event => handleContextMenuEvent(event, value, vNode));
        },
        unbind(element: HTMLElement, binding: VNodeDirective, vNode: VNode) {
            const value = getBindingValue(binding);

            element.removeEventListener('contextmenu', event => handleContextMenuEvent(event, value, vNode));
        },
    };

    function getBindingValue(binding: VNodeDirective): string[] {
        if (typeof binding.value === 'string') {
            return [binding.value];
        }
        if (!Array.isArray(binding.value) || !binding.value.every(el => typeof el === 'string')) {
            throw new Error('An array with menus has to be supplied as value');
        }

        return binding.value;
    }

    function handleContextMenuEvent(event: MouseEvent, value: string[], vNode: VNode) {
        event.preventDefault();
        openContextMenu(value, vNode);
    }

    function openContextMenu(value: string[], vNode: VNode) {
        const menuItems: ContextMenuItem[] = contextMenuGetter(vNode.context.$state.splitterino.contextMenu)(value);
        const electron = injector.get(ELECTRON_SERVICE_TOKEN);
        const contextMenu = electron.createMenu(menuItems, vNode);
        contextMenu.popup({
            window: electron.getCurrentWindow(),
        });
    }
}
