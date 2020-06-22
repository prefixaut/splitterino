import { Injector } from 'lightweight-di';

import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    IPC_SERVER_SERVICE_TOKEN,
    RUNTIME_ENVIRONMENT_TOKEN,
    RuntimeEnvironment,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../../src/common/constants';
import { Module, RootState } from '../../src/models/store';
import { ActionService } from '../../src/services/action.service';
import { IOService } from '../../src/services/io.service';
import { IPCServerService } from '../../src/services/ipc-server.service';
import { ServerStoreService } from '../../src/services/server-store.service';
import { TransformerService } from '../../src/services/transfromer.service';
import { ValidatorService } from '../../src/services/validator.service';
import { getContextMenuStoreModule } from '../../src/store/modules/context-menu.module';
import { getGameInfoStoreModule } from '../../src/store/modules/game-info.module';
import { getKeybindingsStoreModule } from '../../src/store/modules/keybindings.module';
import { getMetaStoreModule } from '../../src/store/modules/meta.module';
import { getSettingsStoreModule } from '../../src/store/modules/settings.module';
import { getSplitsStoreModule } from '../../src/store/modules/splits.module';
import { getTimerStoreModule } from '../../src/store/modules/timer.module';
import { Logger, LogLevel } from '../../src/utils/logger';
import { ElectronMockService } from '../mocks/electron-mock.service';

let mainInjector: Injector;

before(async () => {
    mainInjector = Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionService },
        { provide: ELECTRON_SERVICE_TOKEN, useClass: ElectronMockService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_SERVICE_TOKEN, useValue: null },
        { provide: IPC_SERVER_SERVICE_TOKEN, useClass: IPCServerService },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.BACKGROUND },
        { provide: STORE_SERVICE_TOKEN, useClass: ServerStoreService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
    ]);

    Logger.initialize(mainInjector, LogLevel.DEBUG);
    await mainInjector.get(IPC_SERVER_SERVICE_TOKEN).initialize(LogLevel.DEBUG);

    const store = mainInjector.get(STORE_SERVICE_TOKEN) as ServerStoreService<RootState>;
    store.setupIpcHooks();
    const coreStoreModules: { [name: string]: Module<any> } = {
        contextMenu: getContextMenuStoreModule(),
        gameInfo: getGameInfoStoreModule(),
        keybindings: getKeybindingsStoreModule(),
        settings: getSettingsStoreModule(mainInjector),
        splits: getSplitsStoreModule(mainInjector),
        timer: getTimerStoreModule(),
        meta: getMetaStoreModule(),
    };
    for (const moduleName of Object.keys(coreStoreModules)) {
        store.registerModule('splitterino', moduleName, coreStoreModules[moduleName]);
    }
});

after(() => {
    if (mainInjector != null) {
        // Unregister the server properly
        mainInjector.get(IPC_SERVER_SERVICE_TOKEN).close();
    }
});
