import { Observable } from 'rxjs';
import { Readable } from 'zeromq';

import { Message } from '../models/ipc';

export function createObservableFromReadable(
    readable: Readable,
    target?: string
): Observable<[string, string, Message]> {
    return new Observable<[string, string, Message]>(subscriber => {
        let isClosed = false;

        function waitForNext() {
            readable.receive()
                .then(data => {
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
                        waitForNext();
                    } catch (err) {
                        subscriber.error(err);
                    }
                }).catch(err => {
                    subscriber.error(err);
                });
        }
        waitForNext();

        return () => {
            isClosed = true;
        };
    });
}
