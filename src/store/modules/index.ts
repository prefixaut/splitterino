import { contextMenuStoreModule } from './context-menu';
import { splitsStoreModule } from './splits';
import { timerStoreModule } from './timer';
import { settingsStoreModule } from './settings';

export const splitterinoStoreModules = {
    contextMenu: contextMenuStoreModule,
    splits: splitsStoreModule,
    timer: timerStoreModule,
    settings: settingsStoreModule
};
