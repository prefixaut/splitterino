import { ContextMenuItem } from '../../common/interfaces/context-menu-item';

export interface ContextMenuState {
    [key: string]: ContextMenuItem[];
}
