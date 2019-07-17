import { Injector } from 'lightweight-di';

import { getContextMenuStoreModule } from './context-menu.module';
import { getKeybindingsStoreModule } from './keybindings.module';
import { getSettingsStoreModule } from './settings.module';
import { getSplitsStoreModule } from './splits.module';
import { getTimerStoreModule } from './timer.module';

export function getSplitterinoStoreModules(injector: Injector) {
    return {
        contextMenu: getContextMenuStoreModule(),
        keybindings: getKeybindingsStoreModule(),
        settings: getSettingsStoreModule(),
        splits: getSplitsStoreModule(injector),
        timer: getTimerStoreModule(),
    };
}
