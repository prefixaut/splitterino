import { Injector } from 'lightweight-di';

import { ELECTRON_INTERFACE_TOKEN } from '../models/electron';
import { IPC_CLIENT_TOKEN } from '../models/ipc';
import { ElectronService } from '../services/electron.service';
import { IO_SERVICE_TOKEN, IOService } from '../services/io.service';
import { IPCClient } from '../services/ipc-client.service';
import { LIVESPLIT_CORE_SERVICE_TOKEN } from '../services/livesplit-core.service';
import { TRANSFORMER_SERVICE_TOKEN, TransformerService } from '../services/transfromer.service';
import { VALIDATOR_SERVICE_TOKEN, ValidatorService } from '../services/validator.service';

// Initialize the Dependency-Injection
export async function createInjector(): Promise<Injector> {
    const { LiveSplitCoreService } = await import('./../services/livesplit-core.service');

    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: LIVESPLIT_CORE_SERVICE_TOKEN, useValue: LiveSplitCoreService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_TOKEN, useClass: IPCClient },
    ]);
}
