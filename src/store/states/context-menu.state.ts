import { ContextMenuItem } from '../../models/context-menu-item';

export interface ContextMenuState {
    [key: string]: ContextMenuItem[];
}
