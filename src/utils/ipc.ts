import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { IPCPacket, IPCSocket, IPCRouterSocket, IPCRouterPacket } from '../models/ipc';

export function createSharedObservableFromSocket<T extends IPCSocket>(
    socket: IPCSocket,
    target?: string
): Observable<IPCPacket>;

export function createSharedObservableFromSocket<T extends IPCRouterSocket>(
    socket: IPCRouterSocket,
    target?: string
): Observable<IPCRouterPacket>;

/**
 * Creates a shared (multicast + refCount) observable for given socket
 * @param socket Socket to wrap in observable
 * @param target Only listen to messages for given target
 */
export function createSharedObservableFromSocket<T extends IPCPacket | IPCRouterPacket>(
    socket: IPCSocket | IPCRouterSocket,
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
            const identity = socket.type === 'router' ? data.shift() : undefined;
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
