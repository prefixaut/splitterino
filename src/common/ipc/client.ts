import { Observable, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { DispatchOptions, Store } from 'vuex';
import { Dealer, Push, Subscriber } from 'zeromq';

import { RootState } from '../../store/states/root.state';
import { createObservableFromReadable } from '../../utils/ipc';
import { Logger } from '../../utils/logger';
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
import { filter, first } from 'rxjs/operators';

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

export class IPCClient {

    private readonly subscriberAddress = 'tcp://127.0.0.1:3730';
    private readonly dealerAddress = 'tcp://127.0.0.1:3731';
    private readonly pushAddress = 'tcp://127.0.0.1:3732';

    private subscriber: Subscriber;
    private dealer: Dealer;
    private push: Push;
    private store: Store<RootState>;

    private subscriberMessages: Observable<Message>;
    private subscriberMessageSubscription: Subscription;

    private dealerMessages: Observable<Message>;
    private dealerMessageSubscription: Subscription;

    private isInitialized = false;

    private subscriberTable: { [message: string]: (message: Message) => any } = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_COMMIT_MUTATION]: this.handleCommitMutation,
        /* tslint:enable: no-unbound-method */
    };
    private dealerTable: { [message: string]: (message: Message, respond?: boolean) => any } = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_DISPATCH_CLIENT_ACTION]: this.handleDispatchClientAction,
        /* tslint:enable: no-unbound-method */
    };

    private clientId: string;
    private clientInfo: ClientInformation;

    public async initialize(store: Store<RootState>, clientInfo: ClientInformation) {
        if (this.isInitialized) {
            return;
        }

        this.store = store;
        this.clientInfo = clientInfo;

        this.subscriber = new Subscriber();
        await this.subscriber.bind(this.subscriberAddress);

        this.subscriberMessages = createObservableFromReadable(this.subscriber);
        this.subscriberMessageSubscription = this.subscriberMessages.subscribe(message => {
            this.handleIncomingSubscriberMessage(message);
        });

        this.dealer = new Dealer();
        await this.dealer.bind(this.dealerAddress);

        this.dealerMessages = createObservableFromReadable(this.dealer);
        this.dealerMessageSubscription = this.dealerMessages.subscribe(message => {
            this.handleIncomingDealerMessage(message);
        });

        this.push = new Push();
        await this.push.bind(this.pushAddress);

        this.isInitialized = true;
    }

    public async close() {
        if (!this.isInitialized) {
            return;
        }

        this.store = null;

        if (this.subscriber) {
            await this.subscriber.unbind(this.subscriberAddress);
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
            await this.dealer.unbind(this.dealerAddress);
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
            await this.push.unbind(this.pushAddress);
            this.push.close();
            this.push = null;
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

    public async sendDealerMessage(message: Message) {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTBOUNDS',
            source: 'DEALER',
            ipcMessage: message,
        });

        return this.dealer.send(JSON.stringify(message));
    }

    public async handleIncomingDealerMessage(message: Message) {
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
            handlerFn.call(this, message, true);

            return;
        }

        const response: Response = {
            id: uuid(),
            type: MessageType.INVALID_REQUEST_RESPONSE,
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

        return this.push.send(JSON.stringify(message));
    }

    protected async handleCommitMutation(request: CommitMutationRequest) {
        this.store.commit(request.mutation, request.payload, request.options);
    }

    public async register(): Promise<boolean> {
        // Already registered, can't register again
        if (this.clientId != null) {
            return false;
        }

        const request: RegisterClientRequest = {
            id: uuid(),
            type: MessageType.REQUEST_REGISTER_CLIENT,
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

        this.clientId = response.clientId;

        return true;
    }

    public async unregister(): Promise<boolean> {
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

    protected async handleDispatchClientAction(request: DispatchClientActionRequest) {
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
