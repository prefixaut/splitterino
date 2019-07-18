import { Injector } from 'lightweight-di';
import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron';
import { ElectronService } from '../services/electron.service';
import { IOService, IO_SERVICE_TOKEN } from '../services/io.service';
import { ValidatorService, VALIDATOR_SERVICE_TOKEN } from '../services/validator.service';

// Initialize the Dependency-Injection
export function createInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService }
    ]);
}
