import { ContextMenuState } from './context-menu.state';
import { GameInfoState } from './game-info.state';
import { KeybindingsState } from './keybindings.state';
import { SettingsState } from './settings.state';
import { SplitsState } from './splits.state';
import { TimerState } from './timer.state';
import { MetaState } from './meta.state';

export interface RootState {
    splitterino: {
        contextMenu: ContextMenuState;
        gameInfo: GameInfoState;
        keybindings: KeybindingsState;
        settings: SettingsState;
        splits: SplitsState;
        timer: TimerState;
        meta: MetaState;
    };
}
