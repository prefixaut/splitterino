import { ChildProcess, fork } from 'child_process';
import { Injector } from 'lightweight-di';
import { join } from 'path';
import { first, map, timeout } from 'rxjs/operators';

import { RUNTIME_ENVIRONMENT_TOKEN, SPLITTERINO_VERSION_TOKEN } from '../common/constants';
import { IPCServerInterface, MessageType } from '../models/ipc';
import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../models/services';
import { RootState } from '../models/store';
import { HandlerStoreService } from '../services/handler-store.service';
import { PluginInstanceStoreService } from '../services/plugin-instance-store.service';
import { isDevelopment } from '../utils/is-development';

export async function forkPluginProcess(ipcServer: IPCServerInterface): Promise<ChildProcess | null> {
    return new Promise<ChildProcess | null>((resolve, reject) => {
        let process = null;

        ipcServer.listenToRouterSocket().pipe(
            map(packet => packet.message),
            first(message => message.type === MessageType.NOTIFY_PLUGIN_PROCESS_READY),
            timeout(30_000)
        ).subscribe(() => {
            resolve(process);
        }, () => {
            reject(null);
        });

        const processPath = isDevelopment() ? 'dist_electron/plugin-process.js' : join(__dirname, 'plugin/process.js');
        process = fork(processPath);
    });
}

export function createPluginInstanceInjector(parentInjector: Injector, pluginName: string): Injector {
    return Injector.resolveAndCreate([
        ...[
            ACTION_SERVICE_TOKEN,
            ELECTRON_SERVICE_TOKEN,
            IO_SERVICE_TOKEN,
            IPC_CLIENT_SERVICE_TOKEN,
            RUNTIME_ENVIRONMENT_TOKEN,
            TRANSFORMER_SERVICE_TOKEN,
            VALIDATOR_SERVICE_TOKEN,
            SPLITTERINO_VERSION_TOKEN,
        ].map(token => {
            return {
                provide: token, useValue: parentInjector.get(token),
            };
        }),
        {
            provide: STORE_SERVICE_TOKEN,
            useValue: new PluginInstanceStoreService(
                parentInjector.get(STORE_SERVICE_TOKEN) as HandlerStoreService<RootState>,
                pluginName
            ),
        },
    ]);
}
