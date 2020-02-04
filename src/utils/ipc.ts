import { Observable } from 'rxjs';
import { Socket } from 'zeromq';

import { Message } from '../models/ipc';

export function createObservableFromSocket(
    socket: Socket,
    target?: string
): Observable<[string, string, Message]> {
    return new Observable<[string, string, Message]>(subscriber => {
        let isClosed = false;

        function messageHandler(_: never, ...data: Buffer[]) {
            // Discard the data and don't do anything any more
            if (isClosed) {
                return;
            }

            const [sender, receiver, msg] = data.map(d => d.toString());
            if (target != null && receiver.toString() !== target) {
                // Drop the message, this is not the target
                return;
            }

            try {
                subscriber.next([sender.toString(), receiver.toString(), JSON.parse(msg.toString())]);
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

export function resolveOrTimeout<T>(promise: Promise<T>, timeout: number = 1000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        let hasResolved = false;

        setTimeout(() => {
            if (!hasResolved) {
                reject(new Error(`Timeout of ${timeout}ms reached!`));
            }
        }, timeout);

        promise.then(value => {
            hasResolved = true;
            resolve(value);
        }).catch(error => {
            hasResolved = true;
            reject(error);
        });
    });
}
