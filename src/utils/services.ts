import { Injector } from 'lightweight-di';

import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron';
import { ElectronService } from '../services/electron.service';
import { IO_SERVICE_TOKEN, IOService } from '../services/io.service';
import { TRANSFORMER_SERVICE_TOKEN, TransformerService } from '../services/transfromer.service';
import { VALIDATOR_SERVICE_TOKEN, ValidatorService } from '../services/validator.service';

// Initialize the Dependency-Injection
export function createInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
    ]);
}
