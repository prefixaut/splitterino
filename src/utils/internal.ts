import { Injector } from 'lightweight-di';

import {
    CONTEXT_MENU_MODULE_NAME,
    GAME_INFO_MODULE_NAME,
    KEYBINDINGS_MODULE_NAME,
    META_MODULE_NAME,
    PLUGINS_MODULE_NAME,
    SETTINGS_MODULE_NAME,
    SPLITS_MODULE_NAME,
    TIMER_MODULE_NAME,
} from '../common/constants';
import { SplitterinoModules } from '../models/store';
import { getContextMenuStoreModule } from '../store/modules/context-menu.module';
import { getGameInfoStoreModule } from '../store/modules/game-info.module';
import { getKeybindingsStoreModule } from '../store/modules/keybindings.module';
import { getMetaStoreModule } from '../store/modules/meta.module';
import { getPluginStoreModule } from '../store/modules/plugins.module';
import { getSettingsStoreModule } from '../store/modules/settings.module';
import { getSplitsStoreModule } from '../store/modules/splits.module';
import { getTimerStoreModule } from '../store/modules/timer.module';

export function isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
}

export function getSplitterinoModules(injector: Injector): SplitterinoModules {
    return {
        [CONTEXT_MENU_MODULE_NAME]: getContextMenuStoreModule(),
        [GAME_INFO_MODULE_NAME]: getGameInfoStoreModule(),
        [KEYBINDINGS_MODULE_NAME]: getKeybindingsStoreModule(),
        [META_MODULE_NAME]: getMetaStoreModule(),
        [PLUGINS_MODULE_NAME]: getPluginStoreModule(injector),
        [SETTINGS_MODULE_NAME]: getSettingsStoreModule(),
        [SPLITS_MODULE_NAME]: getSplitsStoreModule(injector),
        [TIMER_MODULE_NAME]: getTimerStoreModule(),
    };
}