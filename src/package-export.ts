import { InjectionToken } from 'lightweight-di';

import { RuntimeEnvironment } from './common/constants';
import { IPCClientInterface } from './models/ipc';
import {
    ActionServiceInterface,
    ElectronServiceInterface,
    IOServiceInterface,
    PluginInstanceStore,
    TransformerServiceInterface,
    ValidatorServiceInterface,
} from './models/services';
import { RootState } from './models/store';

/* eslint-disable no-var*/
declare global {
    const ACTION_SERVICE_TOKEN: InjectionToken<ActionServiceInterface>;
    const ELECTRON_SERVICE_TOKEN: InjectionToken<ElectronServiceInterface>;
    const IO_SERVICE_TOKEN: InjectionToken<IOServiceInterface>;
    const IPC_CLIENT_SERVICE_TOKEN: InjectionToken<IPCClientInterface>;
    const RUNTIME_ENVIRONMENT_TOKEN: InjectionToken<RuntimeEnvironment>; // TODO: put to global
    const SPLITTERINO_VERSION_TOKEN: InjectionToken<string>;
    const STORE_SERVICE_TOKEN: InjectionToken<PluginInstanceStore<RootState>>;
    const TRANSFORMER_SERVICE_TOKEN: InjectionToken<TransformerServiceInterface>;
    const VALIDATOR_SERVICE_TOKEN: InjectionToken<ValidatorServiceInterface>;
}
/* eslint-enable no-var */

/*
 * Export store states
 */
export * from './models/states/context-menu.state';
export * from './models/states/game-info.state';
export * from './models/states/keybindings.state';
export * from './models/states/meta.state';
export * from './models/states/plugins.state';
export * from './models/states/settings.state';
export * from './models/states/splits.state';
export * from './models/states/timer.state';

/*
 * Utility models
 */
export * from './models/context-menu-item';
export * from './models/files';
export * from './models/ipc';
export * from './models/keybindings';
export * from './models/plugins';
// Only export the interfaces, as the service-tokens are available in the plugin context
export {
    ActionServiceInterface,
    ElectronServiceInterface,
    IOServiceInterface,
    StoreInterface,
    TransformerServiceInterface,
    ValidatorServiceInterface,
} from './models/services';
export * from './models/splits';
export * from './models/store';

// TODO: Add payloads i guess
