import { Injector } from 'lightweight-di';

import { getContextMenuStoreModule } from './context-menu.module';
import { getGameInfoStoreModule } from './game-info.module';
import { getKeybindingsStoreModule } from './keybindings.module';
import { getSettingsStoreModule } from './settings.module';
import { getSplitsStoreModule } from './splits.module';
import { getTimerStoreModule } from './timer.module';
import { getMetaModule } from './meta.module';

export function getSplitterinoStoreModules(injector: Injector) {
    return {
        contextMenu: getContextMenuStoreModule(),
        gameInfo: getGameInfoStoreModule(),
        keybindings: getKeybindingsStoreModule(),
        settings: getSettingsStoreModule(),
        splits: getSplitsStoreModule(injector),
        timer: getTimerStoreModule(),
        meta: getMetaModule()
    };
}
