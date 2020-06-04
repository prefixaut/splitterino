import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { Readable, Socket } from 'zeromq';
import { SocketType } from 'zeromq/lib/native';

import { IPCPacket, IPCRouterPacket } from '../models/ipc';

/**
 * Creates a shared (multicast + refCount) observable for given socket
 * @param socket Socket to wrap in observable
 * @param target Only listen to messages for given target
 */
export function createSharedObservableFromSocket<T extends IPCPacket | IPCRouterPacket>(
    socket: Readable & Socket,
    target?: string
): Observable<T> {
    const messageListener = new Observable<T>(subscriber => {
        let isClosed = false;

        function messageHandler(...data: Buffer[]) {
            // Discard the data and don't do anything any more
            if (isClosed) {
                return;
            }

            // Shift is fast than splice and makes more sense
            // eslint-disable-next-line id-blacklist
            const identity = socket.type === SocketType.Router ? data.shift() : undefined;
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
                } as any as T);
            } catch (err) {
                subscriber.error(err);
            }
        }

        function receiveNextMessage() {
            socket.receive().then(message => {
                if (isClosed) {
                    return;
                }
                messageHandler(...message);
                receiveNextMessage();
            });
        }
        receiveNextMessage();

        return () => {
            isClosed = true;
        };
    });

    // Return shared (multicast + refCount) observable
    // Will automatically unsubscribe from main observable (messageListener)
    // when there every subscriber has unsubscribed. This preserves teardown logic
    return messageListener.pipe(share());
}
