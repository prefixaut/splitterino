import { Injector } from 'lightweight-di';
import { Module } from 'vuex';

import { RootState } from '../../models/states/root.state';
import { getContextMenuStoreModule } from './context-menu.module';
import { getCoreStoreModule } from './core.module';
import { getGameInfoStoreModule } from './game-info.module';
import { getKeybindingsStoreModule } from './keybindings.module';
import { getMetaModule } from './meta.module';
import { getSettingsStoreModule } from './settings.module';
import { getSplitsStoreModule } from './splits.module';
import { getTimerStoreModule } from './timer.module';

export function getSplitterinoStoreModules(injector: Injector): { [key: string]: Module<any, RootState> } {
    return {
        contextMenu: getContextMenuStoreModule(),
        core: getCoreStoreModule(),
        gameInfo: getGameInfoStoreModule(),
        keybindings: getKeybindingsStoreModule(),
        settings: getSettingsStoreModule(injector),
        splits: getSplitsStoreModule(injector),
        timer: getTimerStoreModule(),
        meta: getMetaModule(),
        plugins: {
            namespaced: true,
            state: {},
        },
    };
}
