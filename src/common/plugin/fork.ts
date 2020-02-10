import { fork, ChildProcess } from 'child_process';
import { isDevelopment } from '../../utils/is-development';
import { join } from 'path';
import { IPCServer } from '../ipc-server';
import { first, map, timeout } from 'rxjs/operators';
import { MessageType } from '../../models/ipc';

export async function forkPluginProcess(ipcServer: IPCServer): Promise<ChildProcess | null> {
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
