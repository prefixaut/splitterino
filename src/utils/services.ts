import { Injector } from 'lightweight-di';

import { RUNTIME_ENVIRONMENT_TOKEN, RuntimeEnvironment, SPLITTERINO_VERSION_TOKEN, SPLITTERINO_VERSION } from '../common/constants';
import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    IPC_SERVER_SERVICE_TOKEN,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../models/services';
import { ActionService } from '../services/action.service';
import { ElectronService } from '../services/electron.service';
import { HandlerStoreService } from '../services/handler-store.service';
import { IOService } from '../services/io.service';
import { IPCClientService } from '../services/ipc-client.service';
import { IPCServerService } from '../services/ipc-server.service';
import { ReceiverStoreService } from '../services/receiver-store.service';
import { ServerStoreService } from '../services/server-store.service';
import { TransformerService } from '../services/transfromer.service';
import { ValidatorService } from '../services/validator.service';

// Initialize the Dependency-Injection
export function createBackgroundInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionService },
        { provide: ELECTRON_SERVICE_TOKEN, useClass: ElectronService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_SERVICE_TOKEN, useValue: null },
        { provide: IPC_SERVER_SERVICE_TOKEN, useClass: IPCServerService },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.BACKGROUND },
        { provide: STORE_SERVICE_TOKEN, useClass: ServerStoreService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
    ]);
}

export function createRendererInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionService },
        { provide: ELECTRON_SERVICE_TOKEN, useClass: ElectronService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_SERVICE_TOKEN, useClass: IPCClientService },
        { provide: IPC_SERVER_SERVICE_TOKEN, useValue: null },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.RENDERER },
        { provide: STORE_SERVICE_TOKEN, useClass: ReceiverStoreService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
    ]);
}

// Initialize the Dependency-Injection
export function createPluginInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionService },
        { provide: ELECTRON_SERVICE_TOKEN, useValue: null },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_SERVICE_TOKEN, useClass: IPCClientService },
        { provide: IPC_SERVER_SERVICE_TOKEN, useValue: null },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.PLUGIN },
        { provide: SPLITTERINO_VERSION_TOKEN, useValue: SPLITTERINO_VERSION },
        { provide: STORE_SERVICE_TOKEN, useClass: HandlerStoreService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
    ]);
}
