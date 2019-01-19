import { ContextMenuState } from './context-menu';
import { SplitsState } from './splits';
import { TimerState } from './timer';
import { SettingsState } from './settings';

export interface RootState {
    splitterino: {
        timer: TimerState;
        splits: SplitsState;
        contextMenu: ContextMenuState;
        settings: SettingsState;
    };
}
