import { ContextMenuState } from './context-menu.state';
import { SplitsState } from './splits.state';
import { TimerState } from './timer.state';
import { SettingsState } from './settings.state';

export interface RootState {
    splitterino: {
        timer: TimerState;
        splits: SplitsState;
        contextMenu: ContextMenuState;
        settings: SettingsState;
    };
}
