import { Injector } from 'lightweight-di';

import { ELECTRON_INTERFACE_TOKEN } from '../models/electron';
import { IPC_CLIENT_TOKEN } from '../models/ipc';
import { ElectronService } from '../services/electron.service';
import { IO_SERVICE_TOKEN, IOService } from '../services/io.service';
import { IPCClient } from '../services/ipc-client.service';
import { TRANSFORMER_SERVICE_TOKEN, TransformerService } from '../services/transfromer.service';
import { VALIDATOR_SERVICE_TOKEN, ValidatorService } from '../services/validator.service';
import { RUNTIME_ENVIRONMENT_TOKEN } from '../common/constants';

export enum RuntimeEnvironment {
    BACKGROUND,
    RENDERER,
    PLUGIN
}

// Initialize the Dependency-Injection
export function createBackgroundInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_TOKEN, useClass: IPCClient },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.BACKGROUND },
    ]);
}

export function createRendererInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_TOKEN, useClass: IPCClient },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.RENDERER },
    ]);
}

// Initialize the Dependency-Injection
export function createPluginInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: IPC_CLIENT_TOKEN, useClass: IPCClient },
        { provide: ELECTRON_INTERFACE_TOKEN, useValue: null },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.PLUGIN },
    ]);
}
