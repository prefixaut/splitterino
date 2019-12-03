import { Observable, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Store } from 'vuex';
import { Publisher, Pull, Router } from 'zeromq';

import {
    DispatchActionReqeust,
    DispatchActionResponse,
    Message,
    MessageType,
    RegisterClientRequest,
    RegisterClientResponse,
    Response,
    UnregisterClientRequest,
    UnregisterClientResponse,
} from '../../models/ipc';
import { RootState } from '../../models/states/root.state';
import { createObservableFromReadable } from '../../utils/ipc';
import { Logger } from '../../utils/logger';
import { IPC_PUBLISHER_SUBSCRIBER_ADDRESS, IPC_PULL_PUSH_ADDRESS, IPC_ROUTER_DEALER_ADDRESS } from '../constants';

/**
 * Internal representation of a IPC Client.
 */
interface Client {
    /**
     * Name of the client.
     */
    name: string;
    /**
     * The UUID of the client.
     */
    id: string;
    /**
     * All actions that the client may handle in it's context.
     */
    actions: string[];
}

export class IPCServer {

    private publisher: Publisher;
    private router: Router;
    private pull: Pull;
    private store: Store<RootState>;

    private routerMessages: Observable<Message>;
    private routerMessageSubscription: Subscription;

    private pullMessages: Observable<Message>;
    private pullMessageSubscription: Subscription;

    private isInitialized = false;

    private connectedClients: Client[] = [];
    private actionTable: { [actionName: string]: string } = {};
    private routerTable: { [message: string]: (message: Message, respond?: boolean) => any } = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_REGISTER_CLIENT]: this.handleRegisterClient,
        [MessageType.REQUEST_UNREGISTER_CLIENT]: this.handleUnregisterClient,
        [MessageType.REQUEST_DISPATCH_ACTION]: this.handleDispatchAction,
        /* tslint:enable: no-unbound-method */
    };
    private pullTable: { [message: string]: (message: Message) => any } = {
        /* tslint:disable: no-unbound-method */
        /* tslint:enable: no-unbound-method */
    };

    public async initialize(store: Store<RootState>) {
        if (this.isInitialized) {
            return;
        }

        this.store = store;

        this.publisher = new Publisher();
        await this.publisher.bind(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);

        this.router = new Router();
        await this.router.bind(IPC_ROUTER_DEALER_ADDRESS);

        this.pull = new Pull();
        await this.pull.bind(IPC_PULL_PUSH_ADDRESS);

        this.routerMessages = createObservableFromReadable(this.router);

        this.routerMessageSubscription = this.routerMessages.subscribe(message => {
            this.handleIncomingRouterMessage(message);
        });

        this.pullMessages = createObservableFromReadable(this.pull);

        this.pullMessageSubscription = this.pullMessages.subscribe(message => {
            this.handleIncomingPullMessage(message);
        });

        this.isInitialized = true;
    }

    public async close() {
        if (!this.isInitialized) {
            return;
        }

        this.store = null;

        if (this.publisher) {
            await this.publisher.unbind(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);
            this.publisher.close();
            this.publisher = null;
        }

        if (this.router) {
            await this.router.unbind(IPC_ROUTER_DEALER_ADDRESS);
            this.router.close();
            this.router = null;
        }

        if (this.routerMessages) {
            this.routerMessages = null;
        }

        if (this.routerMessageSubscription) {
            this.routerMessageSubscription.unsubscribe();
            this.routerMessageSubscription = null;
        }

        if (this.pull) {
            await this.pull.unbind(IPC_PULL_PUSH_ADDRESS);
            this.pull.close();
            this.pull = null;
        }

        if (this.pullMessages) {
            this.pullMessages = null;
        }

        if (this.pullMessageSubscription) {
            this.pullMessageSubscription.unsubscribe();
            this.pullMessageSubscription = null;
        }

        this.isInitialized = false;
    }

    public async publishMessage(message: Message) {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTGOING',
            source: 'PUBLISHER',
            ipcMessage: message,
        });

        return this.publisher.send(JSON.stringify(message));
    }

    public async sendRouterMessage(message: Message) {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTGOING',
            source: 'ROUTER',
            ipcMessage: message,
        });

        return this.router.send(JSON.stringify(message));
    }

    public async handleIncomingRouterMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INCOMING',
            source: 'ROUTER',
            ipcMessage: message,
        });

        // The message is an response to a previously sent request
        // These are handled seperately.
        if (typeof (message as any).respondsTo === 'string') {
            return;
        }

        const handlerFn = this.routerTable[message.type];

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

        await this.sendRouterMessage(response);
    }

    public async handleIncomingPullMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INCOMING',
            source: 'PULL',
            ipcMessage: message,
        });

        const handlerFn = this.pullTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, message, false);

            return;
        }

        // As the server only pulls messages without responding, no response needed here.
    }

    protected async handleRegisterClient(request: RegisterClientRequest) {
        const client: Client = {
            id: uuid(),
            name: request.name,
            actions: request.actions || [],
        };

        this.connectedClients.push(client);
        client.actions.forEach(actionName => {
            this.actionTable[actionName] = client.id;
        });

        const response: RegisterClientResponse = {
            id: uuid(),
            type: MessageType.RESPONSE_REGISTER_CLIENT,
            successful: true,
            respondsTo: request.id,
            clientId: client.id,
        };

        await this.sendRouterMessage(response);
    }

    protected async handleUnregisterClient(request: UnregisterClientRequest) {
        const index = this.connectedClients.findIndex(client => client.id === request.clientId);
        if (index > -1) {
            this.connectedClients.splice(index, 1);

            // Repopulate the actions
            this.actionTable = {};
            this.connectedClients.forEach(client => {
                client.actions.forEach(actionName => {
                    this.actionTable[actionName] = client.id;
                });
            });
        }

        const response: UnregisterClientResponse = {
            id: uuid(),
            type: MessageType.RESPONSE_UNREGISTER_CLIENT,
            respondsTo: request.id,
            successful: index > -1,
        };

        await this.sendRouterMessage(response);
    }

    protected async handleDispatchAction(request: DispatchActionReqeust) {
        // Check if a client should handle the request.
        // if (this.actionTable[request.action]) {
        // TODO: Send a request to the client to perform the action in it's process
        // The client then may send back a response with all commits that should
        // be performed, and the actions return value.
        // The mutations are then applied here in the main thread and synced to the
        // clients via regular means.
        // The action returnValue is returned as a response to this request.
        // this.forwardDispatchToClient(req);
        return;
        // }

        let response: DispatchActionResponse;

        try {
            const dispatchResult = await this.store.dispatch(request.action, request.payload, request.options);
            response = {
                id: uuid(),
                type: MessageType.RESPONSE_DISPATCH_ACTION,
                successful: true,
                respondsTo: request.id,
                returnValue: dispatchResult,
            };
        } catch (error) {
            response = {
                id: uuid(),
                type: MessageType.RESPONSE_DISPATCH_ACTION,
                successful: false,
                respondsTo: request.id,
                error: error,
            };
        }

        this.sendRouterMessage(response);
    }

    /*
    private async forwardDispatchToClient(initialReqeust: DispatchActionReqeust) {
        const clientIdToFind = this.actionTable[initialReqeust.action];
        // Loading the client to maybe check for the API Version in the future
        const client = this.connectedClients.find(aClient => aClient.id === clientIdToFind);

        const request: DispatchClientActionRequest = {
            id: uuid(),
            type: MessageType.REQUEST_DISPATCH_CLIENT_ACTION,
            clientId: client.id,
            action: initialReqeust.action,
            payload: initialReqeust.payload,
            options: initialReqeust.options,
        };

        const response = await this.sendRequestAwaitResponse(
            request,
            MessageType.RESPONSE_DISPATCH_CLIENT_ACTION,
        ) as DispatchClientActionResponse;

        if (response.successful) {
            (response.commits || []).forEach(commit => {
                this.store.commit(commit.name, commit.payload, commit.options);
            });
        }

        const responseToIntialRequest: DispatchActionResponse = {
            id: uuid(),
            type: MessageType.RESPONSE_DISPATCH_ACTION,
            respondsTo: initialReqeust.id,
            successful: response.successful,
            error: response.error,
            returnValue: response.returnValue,
        };

        this.sendMessage(responseToIntialRequest);
    }
    */
}
