import { Injectable } from 'lightweight-di';

import { IPCClientInterface, LocalMessage } from '../../src/models/ipc';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable
export class IPCClientMockService implements IPCClientInterface {
    private readonly localMessageBus = new Subject<LocalMessage>();

    public async close() {
        // noop
    }

    public async initialize() {
        return {} as any;
    }

    public async dispatchAction() {
        // noop
    }

    public async getStoreState() {
        return {} as any;
    }

    public isInitialized() {
        return false;
    }

    public listenToDealerSocket() {
        return {} as any;
    }

    public listenToSubscriberSocket() {
        return {} as any;
    }

    public sendDealerMessage() {
        return false;
    }

    public async sendDealerRequestAwaitResponse() {
        return {} as any;
    }

    public sendPushMessage() {
        return false;
    }

    public listenForLocalMessage<T>(messageId: string): Observable<T> {
        return this.localMessageBus.pipe(
            filter(message => message.messageId === messageId),
            map(message => message.content)
        );
    }

    public sendLocalMessage(messageId: string, data?: any) {
        this.localMessageBus.next({ messageId, content: data });
    }
}
