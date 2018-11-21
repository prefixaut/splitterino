import { SplitsState } from './splits';
import { TimerState } from './timer';
import { ContextMenu } from './context-menu';

export interface RootState {
    splitterino: {
        timer: TimerState;
        splits: SplitsState;
        contextMenu: ContextMenu;
    };
}
