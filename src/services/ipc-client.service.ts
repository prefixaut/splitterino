import { Observable, Subscription, Subject } from 'rxjs';
import { first, map, timeout, filter } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { DispatchOptions, Store } from 'vuex';
import { socket, ZMQ_IDENTITY } from 'zeromq';

import {
    CommitMutationRequest,
    DispatchActionReqeust,
    DispatchActionResponse,
    DispatchClientActionRequest,
    IPCClientInterface,
    IPCPacket,
    IPCSocket,
    Message,
    MessageType,
    RegisterClientRequest,
    RegisterClientResponse,
    Request,
    Response,
    StoreStateRequest,
    StoreStateResponse,
    UnregisterClientRequest,
    UnregisterClientResponse,
    ClientInformation,
    RegistationResult,
    LocalMessage,
    SubscriberTable,
    DealerTable,
} from '../models/ipc';
import { RootState } from '../models/states/root.state';
import { createSharedObservableFromSocket } from '../utils/ipc';
import { Logger } from '../utils/logger';
import {
    IPC_PUBLISHER_SUBSCRIBER_ADDRESS,
    IPC_PULL_PUSH_ADDRESS,
    IPC_ROUTER_DEALER_ADDRESS,
    IPC_SERVER_NAME,
} from '../common/constants';
import { Injectable } from 'lightweight-di';

export class ClientNotRegisteredError extends Error {
    constructor(message?: string) {
        super(message || 'The client has not yet been registered, and therefore can not send the request!');
    }
}

@Injectable
export class IPCClient implements IPCClientInterface {

    private subscriber: IPCSocket;
    private dealer: IPCSocket;
    private push: IPCSocket;
    private store: Store<RootState>;

    private subscriberMessages: Observable<IPCPacket>;
    private subscriberMessageSubscription: Subscription;

    private dealerMessages: Observable<IPCPacket>;
    private dealerMessageSubscription: Subscription;

    private initialized = false;

    private readonly subscriberTable: SubscriberTable = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_COMMIT_MUTATION]: this.handleCommitMutation,
        /* tslint:enable: no-unbound-method */
    };
    private readonly dealerTable: DealerTable = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_DISPATCH_CLIENT_ACTION]: this.handleDispatchClientAction,
        /* tslint:enable: no-unbound-method */
    };

    private clientId: string;
    private clientInfo: ClientInformation;
    private readonly localMessageBus = new Subject<LocalMessage>();

    public isInitialized() {
        return this.initialized;
    }

    public async initialize(
        store: Store<RootState>,
        clientInfo: ClientInformation
    ): Promise<false | RegistationResult> {
        // Close everything first
        await this.close();

        if (this.initialized) {
            return false;
        }

        this.store = store;
        this.clientInfo = clientInfo;
        this.clientId = uuid();

        // Safe type assertion since type is missing in official typings
        this.subscriber = socket('sub') as IPCSocket;
        this.subscriber.connect(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);
        this.subscriber.subscribe('');

        this.subscriberMessages = createSharedObservableFromSocket(this.subscriber);
        this.subscriberMessageSubscription = this.subscriberMessages.subscribe(packet => {
            this.handleIncomingSubscriberMessage(packet.message);
        });

        this.dealer = socket('dealer') as IPCSocket;
        this.dealer.connect(IPC_ROUTER_DEALER_ADDRESS);
        // Set identity to clientid
        this.dealer.setsockopt(ZMQ_IDENTITY, Buffer.from(this.clientId));

        this.dealerMessages = createSharedObservableFromSocket(this.dealer, this.clientId);
        this.dealerMessageSubscription = this.dealerMessages.subscribe(packet => {
            this.handleIncomingDealerMessage(packet.sender, packet.message);
        });

        this.push = socket('push') as IPCSocket;
        this.push.connect(IPC_PULL_PUSH_ADDRESS);

        try {
            const response = await this.register();
            this.initialized = true;

            return response;
        } catch (error) {
            Logger.error(error);

            return false;
        }
    }

    public async close() {
        if (!this.initialized) {
            return;
        }

        this.store = null;

        if (this.subscriber) {
            this.subscriber.disconnect(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);
            this.subscriber.close();
            this.subscriber = null;
        }

        if (this.subscriberMessages) {
            this.subscriberMessages = null;
        }

        if (this.subscriberMessageSubscription) {
            this.subscriberMessageSubscription.unsubscribe();
            this.subscriberMessageSubscription = null;
        }

        if (this.dealer) {
            this.dealer.disconnect(IPC_ROUTER_DEALER_ADDRESS);
            this.dealer.close();
            this.dealer = null;
        }

        if (this.dealerMessages) {
            this.dealerMessages = null;
        }

        if (this.dealerMessageSubscription) {
            this.dealerMessageSubscription.unsubscribe();
            this.dealerMessageSubscription = null;
        }

        if (this.push) {
            this.push.disconnect(IPC_PULL_PUSH_ADDRESS);
            this.push.close();
            this.push = null;
        }

        try {
            await this.unregister();
        } catch (error) {
            Logger.error(error);
        }

        this.initialized = false;
    }

    private handleIncomingSubscriberMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INBOUND',
            socket: 'SUBSCRIBER',
            ipcMessage: message,
        });

        const handlerFn = this.subscriberTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, message, true);

            return;
        }
    }

    public sendDealerMessage(message: Message, target?: string, quiet: boolean = false) {
        if (!quiet) {
            Logger.debug({
                msg: 'Sending IPC Message',
                direction: 'OUTBOUND',
                socket: 'DEALER',
                target: target || IPC_SERVER_NAME,
                ipcMessage: message,
            });
        }

        if (this.dealer != null) {
            this.dealer.send([target || IPC_SERVER_NAME, this.clientId, JSON.stringify(message)]);

            return true;
        } else {
            return false;
        }
    }

    private handleIncomingDealerMessage(receivedFrom: string, message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INBOUND',
            socket: 'DEALER',
            ipcMessage: message.type !== MessageType.RESPONSE_STORE_STATE ? message : { ...message, state: null },
        });

        // The message is an response to a previously sent request
        // These are handled seperately.
        if (typeof (message as any).respondsTo === 'string') {
            return;
        }

        const handlerFn = this.dealerTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, receivedFrom, message, true);

            return;
        }

        const response: Response = {
            id: uuid(),
            type: MessageType.RESPONSE_INVALID_REQUEST,
            respondsTo: message.id,
            successful: false,
            error: {
                message: `The received Request Type "${message.type}" could not be processed by the server!`,
            }
        };

        this.sendDealerMessage(response);
    }

    public sendDealerRequestAwaitResponse(
        request: Request,
        responseType: MessageType,
        timeoutMs: number = 1000
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const sub = this.dealerMessages.pipe(
                map(packet => packet.message),
                first(message => {
                    return message.type === responseType && (message as Response).respondsTo === request.id;
                }),
                timeout(timeoutMs)
            ).subscribe((response: Response) => {
                if (!response.successful) {
                    reject(response.error.message);
                } else {
                    resolve(response);
                }
            }, err => reject(err));

            const didSend = this.sendDealerMessage(request);
            if (!didSend) {
                sub.unsubscribe();
                reject(new Error('Dealer could not send the request!'));

                return;
            }
        });
    }

    public sendPushMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'OUTBOUND',
            socket: 'PUSH',
            ipcMessage: message,
        });

        if (this.push != null) {
            this.push.send([IPC_SERVER_NAME, this.clientId, JSON.stringify(message)]);

            return true;
        } else {
            return false;
        }
    }

    public listenToSubscriberSocket() {
        return this.subscriberMessages;
    }

    public listenToDealerSocket() {
        return this.dealerMessages;
    }

    private handleCommitMutation(request: CommitMutationRequest) {
        this.store.commit(request.mutation, request.payload, request.options);
    }

    private async register(): Promise<false | RegistationResult> {
        const request: RegisterClientRequest = {
            id: uuid(),
            type: MessageType.REQUEST_REGISTER_CLIENT,
            clientId: this.clientId,
            name: this.clientInfo.name,
            actions: this.clientInfo.actions,
            windowId: this.clientInfo.windowId,
        };

        const response = await this.sendDealerRequestAwaitResponse(
            request,
            MessageType.RESPONSE_REGISTER_CLIENT
        ) as RegisterClientResponse;

        if (!response.successful) {
            throw new Error(response.error.message);
        }

        return {
            logLevel: response.logLevel,
        };
    }

    private async unregister(): Promise<boolean> {
        const request: UnregisterClientRequest = {
            id: uuid(),
            type: MessageType.REQUEST_UNREGISTER_CLIENT,
            clientId: this.clientId,
        };

        const response = await this.sendDealerRequestAwaitResponse(
            request,
            MessageType.RESPONSE_UNREGISTER_CLIENT
        ) as UnregisterClientResponse;

        if (!response.successful) {
            throw new Error(response.error.message);
        }

        this.clientId = null;

        return true;
    }

    public async getStoreState(): Promise<RootState> {
        const request: StoreStateRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_STATE,
        };

        const response = await this.sendDealerRequestAwaitResponse(
            request,
            MessageType.RESPONSE_STORE_STATE,
            10_000
        ) as StoreStateResponse;

        if (!response.successful) {
            throw new Error(response.error.message);
        }

        return response.state;
    }

    public async dispatchAction(
        actionName: string,
        payload?: any,
        options?: DispatchOptions
    ): Promise<any> {
        if (this.clientId == null) {
            throw new ClientNotRegisteredError();
        }

        const request: DispatchActionReqeust = {
            id: uuid(),
            type: MessageType.REQUEST_DISPATCH_ACTION,
            action: actionName,
            payload: payload,
            options: options,
        };
        const response = await this.sendDealerRequestAwaitResponse(
            request,
            MessageType.RESPONSE_DISPATCH_ACTION
        ) as DispatchActionResponse;

        if (!response.successful) {
            throw new Error(response.error.message);
        }

        return response.returnValue;
    }

    private async handleDispatchClientAction(sender: string, request: DispatchClientActionRequest) {
        // Not a request for us
        if (request.clientId !== this.clientId) {
            return;
        }

        // TODO: Find a way on how to call the actions with a patched
        // action-context, so commits are not actually executed.
        // Seems currently impossible, as only wrapped action-handlers
        // are getting saved in the store.

        return;
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