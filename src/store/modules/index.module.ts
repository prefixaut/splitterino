import { contextMenuStoreModule } from './context-menu.module';
import { splitsStoreModule } from './splits.module';
import { timerStoreModule } from './timer.module';
import { settingsStoreModule } from './settings.module';

export const splitterinoStoreModules = {
    contextMenu: contextMenuStoreModule,
    splits: splitsStoreModule,
    timer: timerStoreModule,
    settings: settingsStoreModule
};
