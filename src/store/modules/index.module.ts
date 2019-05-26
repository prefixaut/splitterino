import { contextMenuStoreModule } from './context-menu.module';
import { keybindingsStoreModule } from './keybindings.module';
import { settingsStoreModule } from './settings.module';
import { getSplitsStoreModule } from './splits.module';
import { timerStoreModule } from './timer.module';
import { Injector } from 'lightweight-di';

export function getSplitterinoStoreModules(injector: Injector) {
    return {
        contextMenu: contextMenuStoreModule,
        keybindings: keybindingsStoreModule,
        settings: settingsStoreModule,
        splits: getSplitsStoreModule(injector),
        timer: timerStoreModule,
    };
}
