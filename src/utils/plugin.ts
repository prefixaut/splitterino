import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import { first, map, timeout } from 'rxjs/operators';

import { IPCServerInterface, MessageType } from '../models/ipc';
import { isDevelopment } from '../utils/is-development';

export const PLUGIN_CLIENT_ID = 'plugin-process';

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
