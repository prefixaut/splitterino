import { ContextMenuItem } from '../../common/context-menu-item';

export interface ContextMenu {
    [key: string]: ContextMenuItem[];
}
