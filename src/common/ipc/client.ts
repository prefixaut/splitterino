import { InjectionToken } from 'lightweight-di';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { DispatchOptions, Store } from 'vuex';
import { Socket, socket } from 'zeromq';

import {
    CommitMutationRequest,
    DispatchActionReqeust,
    DispatchActionResponse,
    DispatchClientActionRequest,
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
} from '../../models/ipc';
import { RootState } from '../../models/states/root.state';
import { createObservableFromSocket } from '../../utils/ipc';
import { Logger, LogLevel } from '../../utils/logger';
import { IPC_PUBLISHER_SUBSCRIBER_ADDRESS, IPC_PULL_PUSH_ADDRESS, IPC_ROUTER_DEALER_ADDRESS } from '../constants';

export class ClientNotRegisteredError extends Error {
    constructor(message?: string) {
        super(message || 'The client has not yet been registered, and therefore can not send the request!');
    }
}

export interface ClientInformation {
    name: string;
    actions?: string[];
    windowId?: number;
}

export interface RegistationResult {
    logLevel: LogLevel;
}

export const IPC_CLIENT_SERVICE_TOKEN = new InjectionToken<IPCClient>('ipc-client');

export class IPCClient {

    private subscriber: Socket;
    private dealer: Socket;
    private push: Socket;
    private store: Store<RootState>;

    private subscriberMessages: Observable<[string, string, Message]>;
    private subscriberMessageSubscription: Subscription;

    private dealerMessages: Observable<[string, string, Message]>;
    private dealerMessageSubscription: Subscription;

    private isInitialized = false;

    private subscriberTable: { [message: string]: (message: Message) => any } = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_COMMIT_MUTATION]: this.handleCommitMutation,
        /* tslint:enable: no-unbound-method */
    };
    private dealerTable: { [message: string]: (sender: string, message: Message, respond?: boolean) => any } = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_DISPATCH_CLIENT_ACTION]: this.handleDispatchClientAction,
        /* tslint:enable: no-unbound-method */
    };

    private clientId: string;
    private serverId: string;
    private clientInfo: ClientInformation;

    public async initialize(
        store: Store<RootState>,
        clientInfo: ClientInformation
    ): Promise<false | RegistationResult> {
        // Close everything first
        await this.close();

        if (this.isInitialized) {
            return false;
        }

        this.store = store;
        this.clientInfo = clientInfo;
        this.clientId = uuid();

        this.subscriber = socket('sub');
        this.subscriber.bindSync(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);

        this.subscriberMessages = createObservableFromSocket(this.subscriber);
        this.subscriberMessageSubscription = this.subscriberMessages.subscribe(
            ([/* sender */, /* receiver */, message]) => {
                this.handleIncomingSubscriberMessage(message);
            });

        this.dealer = socket('dealer');
        this.dealer.bindSync(IPC_ROUTER_DEALER_ADDRESS);

        this.dealerMessages = createObservableFromSocket(this.dealer, this.clientId);
        this.dealerMessageSubscription = this.dealerMessages.subscribe(([sender, /* receiver */, message]) => {
            this.handleIncomingDealerMessage(sender, message);
        });

        this.push = socket('push');
        this.push.bindSync(IPC_PULL_PUSH_ADDRESS);

        try {
            const response = await this.register();
            this.isInitialized = true;

            return response;
        } catch (error) {
            Logger.error(error);

            return false;
        }
    }

    public async close() {
        if (!this.isInitialized) {
            return;
        }

        this.store = null;

        if (this.subscriber) {
            this.subscriber.unbindSync(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);
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
            this.dealer.unbindSync(IPC_ROUTER_DEALER_ADDRESS);
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
            this.push.unbindSync(IPC_PULL_PUSH_ADDRESS);
            this.push.close();
            this.push = null;
        }

        try {
            await this.unregister();
        } catch (error) {
            Logger.error(error);
        }

        this.isInitialized = false;
    }

    public async handleIncomingSubscriberMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INBOUNDS',
            source: 'SUBSCRIBER',
            ipcMessage: message,
        });

        const handlerFn = this.subscriberTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, message, true);

            return;
        }
    }

    public async sendDealerMessage(message: Message, target?: string) {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTBOUNDS',
            source: 'DEALER',
            ipcMessage: message,
        });

        this.dealer.send([target || this.serverId, this.clientId, JSON.stringify(message)]);

        return true;
    }

    public async handleIncomingDealerMessage(sender: string, message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INBOUNDS',
            source: 'DEALER',
            ipcMessage: message,
        });

        // The message is an response to a previously sent request
        // These are handled seperately.
        if (typeof (message as any).respondsTo === 'string') {
            return;
        }

        const handlerFn = this.dealerTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, sender, message, true);

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

        await this.sendDealerMessage(response);
    }

    public async sendDealerRequestAwaitResponse(
        request: Request,
        responseType: MessageType
    ): Promise<Response> {
        this.sendDealerMessage(request);

        const response = await this.dealerMessages.pipe(
            map(([/* sender */, /* reveiver */, message]) => message),
            filter(message => {
                return message.type === responseType && (message as Response).respondsTo === request.id;
            }),
            first()
        ).toPromise() as Response;

        if (!response.successful) {
            throw new Error(response.error.message);
        }

        return response;
    }

    public async sendPushMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'OUTBOUNDS',
            source: 'PUSH',
            ipcMessage: message,
        });

        this.push.send([this.serverId, this.clientId, JSON.stringify(message)]);

        return true;
    }

    public listenToSubscriberSocket() {
        return createObservableFromSocket(this.subscriber);
    }

    public listenToDealerSocket() {
        return createObservableFromSocket(this.dealer);
    }

    protected async handleCommitMutation(request: CommitMutationRequest) {
        this.store.commit(request.mutation, request.payload, request.options);
    }

    protected async register(): Promise<false | RegistationResult> {
        // Already registered, can't register again
        if (this.clientId != null) {
            return false;
        }

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

        this.serverId = response.serverId;

        return {
            logLevel: response.logLevel,
        };
    }

    protected async unregister(): Promise<boolean> {
        if (this.clientId == null) {
            // Already unregistered, can't register again
            return false;
        }

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
            MessageType.RESPONSE_STORE_STATE
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

    protected async handleDispatchClientAction(sender: string, request: DispatchClientActionRequest) {
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
}
