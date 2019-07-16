import { Injector } from 'lightweight-di';

import { contextMenuStoreModule } from './context-menu.module';
import { keybindingsStoreModule } from './keybindings.module';
import { getSettingsStoreModule } from './settings.module';
import { getSplitsStoreModule } from './splits.module';
import { timerStoreModule } from './timer.module';

export function getSplitterinoStoreModules(injector: Injector) {
    return {
        contextMenu: contextMenuStoreModule,
        keybindings: keybindingsStoreModule,
        settings: getSettingsStoreModule(),
        splits: getSplitsStoreModule(injector),
        timer: timerStoreModule,
    };
}
