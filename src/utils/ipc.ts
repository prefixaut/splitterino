import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { Socket } from 'zeromq';
import { IPCPacket } from '../models/ipc';

// TODO: Fix use of filterAdditionalHeaders
/**
 * Creates a shared (multicast + refCount) observable for given socket
 * @param socket Socket to wrap in observable
 * @param target Only listen to messages for given target
 * @param filterAdditionalHeaders Set to true if router socket
 */
export function createSharedObservableFromSocket(
    socket: Socket,
    target?: string,
    filterAdditionalHeaders: boolean = false
): Observable<IPCPacket> {
    const messageListener = new Observable<IPCPacket>(subscriber => {
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
            socket.removeListener('message', messageHandler);
        };
    });

    // Return shared (multicast + refCount) observable
    // Will automatically unsubscribe from main observable (messageListener)
    // when there every subscriber has unsubscribed. This preserves teardown logic
    return messageListener.pipe(share());
}
