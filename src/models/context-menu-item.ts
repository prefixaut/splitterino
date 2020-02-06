import { MenuItem, BrowserWindow } from 'electron';
import { VNode } from 'vue';

export interface ContextMenuItem {
    label?: string;
    actions?: string[];
    enabled?: boolean;
    visible?: boolean;
    type?: 'normal' | 'separator';
}

export interface ContextMenuItemActionFunctionParameters {
    vNode: VNode;
    menuItem: MenuItem;
    browserWindow: BrowserWindow;
    event: Event;
}

export type ContextMenuItemActionFunction = (params: ContextMenuItemActionFunctionParameters) => void;
