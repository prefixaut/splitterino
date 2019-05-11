import { contextMenuStoreModule } from './context-menu.module';
import { keybindingsStoreModule } from './keybindings.module';
import { settingsStoreModule } from './settings.module';
import { splitsStoreModule } from './splits.module';
import { timerStoreModule } from './timer.module';

export const splitterinoStoreModules = {
    contextMenu: contextMenuStoreModule,
    keybindings: keybindingsStoreModule,
    settings: settingsStoreModule,
    splits: splitsStoreModule,
    timer: timerStoreModule,
};
