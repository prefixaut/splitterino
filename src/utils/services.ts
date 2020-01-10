import { Injector } from 'lightweight-di';

import { ELECTRON_INTERFACE_TOKEN } from '../models/electron';
import { ElectronService } from '../services/electron.service';
import { IO_SERVICE_TOKEN, IOService } from '../services/io.service';
import { TRANSFORMER_SERVICE_TOKEN, TransformerService } from '../services/transfromer.service';
import { VALIDATOR_SERVICE_TOKEN, ValidatorService } from '../services/validator.service';
import { IPC_CLIENT_TOKEN, IPCClient } from '../common/ipc/client';

// Initialize the Dependency-Injection
export function createInjector(ipcClient: IPCClient = null): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_TOKEN, useValue: ipcClient },
    ]);
}
