import { ContextMenuItem } from '../../common/context-menu-item';

export interface ContextMenuState {
    [key: string]: ContextMenuItem[];
}
