import { ContextMenuState } from './context-menu.state';
import { SplitsState } from './splits.state';
import { TimerState } from './timer.state';
import { SettingsState } from './settings.state';
import { KeybindingsState } from './keybindings.state';
import { MetaState } from './meta.state';

export interface RootState {
    splitterino: {
        contextMenu: ContextMenuState;
        keybindings: KeybindingsState;
        settings: SettingsState;
        splits: SplitsState;
        timer: TimerState;
        meta: MetaState;
    };
}
