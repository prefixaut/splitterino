import { Observable } from 'rxjs';
import { Socket } from 'zeromq';

import { IPCPacket } from '../models/ipc';

export function createObservableFromSocket(
    socket: Socket,
    target?: string,
    filterAdditionalHeaders: boolean = false
): Observable<IPCPacket> {
    return new Observable(subscriber => {
        let isClosed = false;

        function messageHandler(...data: Buffer[]) {
            // Discard the data and don't do anything any more
            if (isClosed) {
                return;
            }

            const [identity] = filterAdditionalHeaders ? data.splice(0, 1) : [];
            const [receiver, sender, msg] = data.map(part => part != null ? part.toString() : null);
            if (target != null && receiver != null && receiver !== target) {
                // Drop the message, this is not the target
                return;
            }

            try {
                subscriber.next({
                    identity,
                    receiver,
                    sender,
                    message: JSON.parse(msg)
                });
            } catch (err) {
                subscriber.error(err);
            }
        }

        socket.on('message', messageHandler);

        return () => {
            isClosed = true;
            socket.off('message', messageHandler);
        };
    });
}

export function resolveOrTimeout<T>(promise: Promise<T>, timeout: number = 10_000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout of ${timeout}ms reached!`));
        }, timeout);

        promise.then(value => {
            resolve(value);
        }).catch(error => {
            reject(error);
        }).finally(() => {
            clearTimeout(timer);
        });
    });
}
