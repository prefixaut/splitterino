import { Injector } from 'lightweight-di';

import { ELECTRON_INTERFACE_TOKEN } from '../common/interfaces/electron-interface';
import { ElectronService } from '../services/electron.service';
import { IOService } from '../services/io.service';

// Initialize the Dependency-Injection
export function createInjector(): Injector {
    return Injector.resolveAndCreate([
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronService },
        IOService,
    ]);
}
