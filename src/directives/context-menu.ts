import { MenuItemConstructorOptions, remote } from 'electron';
import { DirectiveOptions, VNode, VNodeDirective } from 'vue';

import { ContextMenuItem } from '../common/context-menu-item';

export const contextMenuDirective: DirectiveOptions = {
    bind(element: HTMLElement, binding: VNodeDirective, vNode: VNode) {
        const value = getBindingValue(binding);

        element.addEventListener(
            'contextmenu',
            event => handleContextMenuEvent(event, value, vNode)
        );
    },
    unbind(element: HTMLElement, binding: VNodeDirective, vNode: VNode) {
        const value = getBindingValue(binding);

        element.removeEventListener(
            'contextmenu',
            event => handleContextMenuEvent(event, value, vNode)
        );
    }
};

function getBindingValue(binding: VNodeDirective): string[] {
    if (typeof binding.value === 'string') {
        return [binding.value];
    }
    if (
        !Array.isArray(binding.value) ||
        !binding.value.every(el => typeof el === 'string')
    ) {
        throw new Error('An array with menus has to be supplied as value');
    }

    return binding.value;
}

function handleContextMenuEvent(
    event: MouseEvent,
    value: string[],
    vNode: VNode
) {
    event.preventDefault();
    openContextMenu(value, vNode);
}

function openContextMenu(value: string[], vNode: VNode) {
    const menus: ContextMenuItem[] = vNode.context.$store.getters[
        'splitterino/contextMenu/ctxMenu'
    ](value);
    const contextMenu = new remote.Menu();

    menus.forEach(menu => {
        const options = prepareMenuItemOptions(menu);
        contextMenu.append(new remote.MenuItem(options));
    });

    contextMenu.popup({
        window: remote.getCurrentWindow()
    });
}

function prepareMenuItemOptions(menuItem: ContextMenuItem):
    MenuItemConstructorOptions {
    const options: MenuItemConstructorOptions = {
        label: menuItem.label,
        enabled: menuItem.enabled,
        visible: menuItem.visible,
    };

    if (Array.isArray(menuItem.actions)) {
        options.click = (
            electronMenuItem,
            browserWindow,
            event
        ) => {
            menuItem.actions
                .filter(action => typeof action === 'function')
                .forEach(action => action(
                    electronMenuItem, browserWindow, event
                ));
        };
    }

    return menuItem;
}
