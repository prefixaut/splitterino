import { Injector } from 'lightweight-di';

import { ELECTRON_INTERFACE_TOKEN } from '../../src/common/interfaces/electron-interface';
import { IOService } from '../../src/services/io.service';
import { ElectronMockService } from './electron-mock.service';

// Initialize the Dependency-Injection
export function createMockInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronMockService },

        // Simple providers
        IOService,
    ]);
}
