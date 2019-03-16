import { MenuItem, BrowserWindow } from 'electron';

export interface ContextMenuItem {
    label: string;
    actions?: ContextMenuItemActionFunction[];
    enabled?: boolean;
    visible?: boolean;
}

export type ContextMenuItemActionFunction = (
    menuItem?: MenuItem,
    browserWindow?: BrowserWindow,
    event?: Event
) => void;
