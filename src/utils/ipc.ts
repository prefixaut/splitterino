import { Observable } from 'rxjs';
import { Readable } from 'zeromq';

import { Message } from '../models/ipc';

export function createObservableFromReadable(readable: Readable): Observable<Message> {
    return new Observable<Message>(subscriber => {
        let isClosed = false;

        function waitForNext() {
            readable.receive()
                .then(data => {
                    // Discard the data and don't do anything any more
                    if (isClosed) {
                        return;
                    }

                    try {
                        subscriber.next(JSON.parse(data.toString()));
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
