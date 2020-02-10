import { Injector } from 'lightweight-di';

import { IPC_CLIENT_TOKEN } from '../../models/ipc';
import { IPCClient } from '../../services/ipc-client.service';
import { ELECTRON_INTERFACE_TOKEN } from '../../models/electron';
import { ValidatorService, VALIDATOR_SERVICE_TOKEN } from '../../services/validator.service';

// Initialize the Dependency-Injection
export function createPluginInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: IPC_CLIENT_TOKEN, useClass: IPCClient },
        { provide: ELECTRON_INTERFACE_TOKEN, useValue: {} },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService }
    ]);
}
