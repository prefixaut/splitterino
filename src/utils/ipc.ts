import { Observable } from 'rxjs';
import { Socket } from 'zeromq';

import { Message } from '../models/ipc';

export function createObservableFromSocket(
    socket: Socket,
    target?: string
): Observable<[string, string, Message]> {
    return new Observable<[string, string, Message]>(subscriber => {
        let isClosed = false;

        function messageHandler(data: [string, string, Message]) {
            // Discard the data and don't do anything any more
            if (isClosed) {
                return;
            }

            const [sender, receiver, msg] = data;
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
