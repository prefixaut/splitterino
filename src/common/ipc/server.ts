import { Observable, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Store } from 'vuex';
import { Socket, socket } from 'zeromq';

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
    PublishGlobalEventRequest,
    GlobalEventBroadcast,
    LogOnServerRequest,
    StoreStateRequest,
    StoreStateResponse,
} from '../../models/ipc';
import { RootState } from '../../models/states/root.state';
import { createObservableFromSocket } from '../../utils/ipc';
import { Logger, LogLevel } from '../../utils/logger';
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

export interface InitializeOptions {
    store: Store<RootState>;
    logLevel: LogLevel;
}
export class IPCServer {

    private publisher: Socket;
    private router: Socket;
    private pull: Socket;

    private store: Store<RootState>;
    private serverId: string = 'server';
    private logLevel: LogLevel;

    private routerMessages: Observable<[string, string, Message]>;
    private routerMessageSubscription: Subscription;

    private pullMessages: Observable<[string, string, Message]>;
    private pullMessageSubscription: Subscription;

    private isInitialized = false;

    private connectedClients: Client[] = [];
    private actionTable: { [actionName: string]: string } = {};
    private routerTable: { [message: string]: (sender: string, message: Message, respond?: boolean) => any } = {
        /* tslint:disable: no-unbound-method */
        [MessageType.REQUEST_REGISTER_CLIENT]: this.handleRegisterClient,
        [MessageType.REQUEST_UNREGISTER_CLIENT]: this.handleUnregisterClient,
        [MessageType.REQUEST_DISPATCH_ACTION]: this.handleDispatchAction,
        [MessageType.REQUEST_PUBLISH_GLOBAL_EVENT]: this.handleGlobalEventPublish,
        [MessageType.REQUEST_LOG_ON_SERVER]: this.handleLogToServer,
        [MessageType.REQUEST_STORE_STATE]: this.handleStoreFetch,
        /* tslint:enable: no-unbound-method */
    };
    private pullTable: { [message: string]: (message: Message) => any } = {
        /* tslint:disable: no-unbound-method */
        /* tslint:enable: no-unbound-method */
    };

    public async initialize(options: InitializeOptions) {
        if (this.isInitialized) {
            return;
        }

        this.store = options.store;
        this.logLevel = options.logLevel;

        this.publisher = socket('pub');
        this.publisher.bindSync(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);

        this.router = socket('router');
        this.router.bindSync(IPC_ROUTER_DEALER_ADDRESS);

        this.pull = socket('pull');
        this.pull.bindSync(IPC_PULL_PUSH_ADDRESS);

        this.routerMessages = createObservableFromSocket(this.router, this.serverId);

        this.routerMessageSubscription = this.routerMessages.subscribe(([sender, /* receiver */, message]) => {
            this.handleIncomingRouterMessage(sender, message);
        });

        this.pullMessages = createObservableFromSocket(this.pull);

        this.pullMessageSubscription = this.pullMessages.subscribe(([/* sender */, /* receiver */, message]) => {
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
            this.publisher.unbindSync(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);
            this.publisher.close();
            this.publisher = null;
        }

        if (this.router) {
            this.router.unbindSync(IPC_ROUTER_DEALER_ADDRESS);
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
            this.pull.unbindSync(IPC_PULL_PUSH_ADDRESS);
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

        this.publisher.send([null, this.serverId, JSON.stringify(message)]);

        return true;
    }

    public async sendRouterMessage(client: string, message: Message) {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTGOING',
            source: 'ROUTER',
            ipcMessage: message,
        });

        this.router.send([client, this.serverId, JSON.stringify(message)]);

        return true;
    }

    public async handleIncomingRouterMessage(sender: string, message: Message) {
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

        // Respond to the client
        await this.sendRouterMessage(sender, response);
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

    protected async handleRegisterClient(sender: string, request: RegisterClientRequest) {
        try {
            const client: Client = {
                id: request.clientId,
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
                serverId: this.serverId,
                logLevel: this.logLevel,
            };

            await this.sendRouterMessage(sender, response);
        } catch (error) {
            const response: RegisterClientResponse = {
                id: uuid(),
                respondsTo: request.id,
                type: MessageType.RESPONSE_REGISTER_CLIENT,
                successful: false,
                error: error,
            };

            await this.sendRouterMessage(sender, response);
        }
    }

    protected async handleUnregisterClient(sender: string, request: UnregisterClientRequest) {
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

        await this.sendRouterMessage(sender, response);
    }

    protected async handleDispatchAction(sender: string, request: DispatchActionReqeust) {
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

        this.sendRouterMessage(sender, response);
    }

    private async handleGlobalEventPublish(sender: string, request: PublishGlobalEventRequest) {
        const broadcast: GlobalEventBroadcast = {
            id: uuid(),
            type: MessageType.BROADCAST_GLOBAL_EVENT,
            eventName: request.eventName,
            payload: request.payload,
        };

        this.publishMessage(broadcast);
    }

    private async handleStoreFetch(sender: string, request: StoreStateRequest) {
        const response: StoreStateResponse = {
            id: uuid(),
            type: MessageType.RESPONSE_STORE_STATE,
            respondsTo: request.id,
            successful: true,
            state: this.store.state,
        };

        this.sendRouterMessage(sender, response);
    }

    private async handleLogToServer(sender: string, request: LogOnServerRequest) {
        Logger._logToHandlers(request.level, request.message);
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
