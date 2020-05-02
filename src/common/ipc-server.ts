import { Observable, Subscription } from 'rxjs';
import { first, map, timeout } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Store } from 'vuex';
import { socket } from 'zeromq';

import {
    DispatchActionReqeust,
    DispatchActionResponse,
    GlobalEventBroadcast,
    IPCPacket,
    IPCRouterPacket,
    IPCRouterSocket,
    IPCSocket,
    LogOnServerRequest,
    Message,
    MessageType,
    PluginActionDiffRequest,
    PluginActionDiffResponse,
    PublishGlobalEventRequest,
    RegisterClientRequest,
    RegisterClientResponse,
    Response,
    StoreStateRequest,
    StoreStateResponse,
    UnregisterClientRequest,
    UnregisterClientResponse,
} from '../models/ipc';
import { RootState } from '../models/states/root.state';
import { MUTATION_APPLY_DIFF } from '../store/modules/core.module';
import { createSharedObservableFromSocket } from '../utils/ipc';
import { Logger, LogLevel } from '../utils/logger';
import { getModuleActionAndMutationNames } from '../utils/store';
import {
    IPC_PUBLISHER_SUBSCRIBER_ADDRESS,
    IPC_PULL_PUSH_ADDRESS,
    IPC_ROUTER_DEALER_ADDRESS,
    IPC_SERVER_NAME,
} from './constants';

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

type RouterFn = (identity: Buffer, receivedFrom: string, message: Message, respond?: boolean) => any;

export interface InitializeOptions {
    store: Store<RootState>;
    logLevel: LogLevel;
}
export class IPCServer {

    private publisher: IPCSocket;
    private router: IPCRouterSocket;
    private pull: IPCSocket;

    private store: Store<RootState>;
    private logLevel: LogLevel;

    private routerMessages: Observable<IPCRouterPacket>;
    private routerMessageSubscription: Subscription;

    private pullMessages: Observable<IPCPacket>;
    private pullMessageSubscription: Subscription;

    private initialized = false;

    private connectedClients: Client[] = [];
    private actionTable: { [actionName: string]: string } = {};
    private routerTable: { [message: string]: RouterFn } = {
        /* eslint-disable @typescript-eslint/unbound-method,no-invalid-this */
        [MessageType.REQUEST_REGISTER_CLIENT]: this.handleRegisterClient,
        [MessageType.REQUEST_UNREGISTER_CLIENT]: this.handleUnregisterClient,
        [MessageType.REQUEST_DISPATCH_ACTION]: this.handleDispatchAction,
        [MessageType.REQUEST_PUBLISH_GLOBAL_EVENT]: this.handleGlobalEventPublish,
        [MessageType.REQUEST_LOG_ON_SERVER]: this.handleLogToServer,
        [MessageType.REQUEST_STORE_STATE]: this.handleStoreFetch,
        /* eslint-enable @typescript-eslint/unbound-method,no-invalid-this */
    };
    private pullTable: { [message: string]: (message: Message) => any } = {
        /* eslint-disable @typescript-eslint/unbound-method,no-invalid-this */
        /* eslint-enable @typescript-eslint/unbound-method,no-invalid-this */
    };

    public isInitialized() {
        return this.initialized;
    }

    public initialize(options: InitializeOptions): Promise<void> {
        if (this.initialized) {
            return Promise.resolve();
        }

        this.store = options.store;
        this.logLevel = options.logLevel;

        // Safe type assertion since type is missing in official typings
        this.publisher = socket('pub') as IPCSocket;
        this.publisher.bindSync(IPC_PUBLISHER_SUBSCRIBER_ADDRESS);

        this.router = socket('router') as IPCRouterSocket;
        this.router.bindSync(IPC_ROUTER_DEALER_ADDRESS);

        this.pull = socket('pull') as IPCSocket;
        this.pull.bindSync(IPC_PULL_PUSH_ADDRESS);

        this.routerMessages = createSharedObservableFromSocket(this.router, IPC_SERVER_NAME);

        this.routerMessageSubscription = this.routerMessages.subscribe(packet => {
            this.handleIncomingRouterMessage(packet.identity, packet.sender, packet.message);
        });

        this.pullMessages = createSharedObservableFromSocket(this.pull);

        this.pullMessageSubscription = this.pullMessages.subscribe(packet => {
            this.handleIncomingPullMessage(packet.message);
        });

        this.initialized = true;

        return Promise.resolve();
    }

    public close(): Promise<void> {
        if (!this.initialized) {
            return Promise.resolve();
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

        this.initialized = false;

        return Promise.resolve();
    }

    public listenToRouterSocket() {
        return this.routerMessages;
    }

    public publishMessage(message: Message): Promise<boolean> {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTBOUND',
            socket: 'PUBLISHER',
            ipcMessage: message,
        });

        this.publisher.send(['', IPC_SERVER_NAME, JSON.stringify(message)]);

        return Promise.resolve(true);
    }

    public sendRouterMessage(identity: Buffer, targetClient: string, message: Message): Promise<boolean> {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTBOUND',
            socket: 'ROUTER',
            destination: targetClient,
            ipcMessage: message.type !== MessageType.RESPONSE_STORE_STATE ? message : { ...message, state: null },
        });

        this.router.send([identity, targetClient, IPC_SERVER_NAME, JSON.stringify(message)]);

        return Promise.resolve(true);
    }

    protected async handleRegisterClient(identity: Buffer, receivedFrom: string, request: RegisterClientRequest) {
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
                serverId: IPC_SERVER_NAME,
                logLevel: this.logLevel,
            };

            await this.sendRouterMessage(identity, receivedFrom, response);
        } catch (error) {
            const response: RegisterClientResponse = {
                id: uuid(),
                respondsTo: request.id,
                type: MessageType.RESPONSE_REGISTER_CLIENT,
                successful: false,
                error: error,
            };

            await this.sendRouterMessage(identity, receivedFrom, response);
        }
    }

    protected async handleUnregisterClient(identity: Buffer, receivedFrom: string, request: UnregisterClientRequest) {
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

        await this.sendRouterMessage(identity, receivedFrom, response);
    }

    public sendPluginActionDiffRequest(request: PluginActionDiffRequest): Promise<any> {
        return new Promise((resolve, reject) => {
            // Setup a listener for the response
            this.listenToRouterSocket().pipe(
                map(packet => packet.message),
                first(message => message.type === MessageType.RESPONSE_PLUGIN_ACTION_DIFF
                    && (message as Response).respondsTo === request.id),
                timeout(3_000),
            ).subscribe((response: PluginActionDiffResponse) => {
                if (response.successful) {
                    // Forward the changes as a Mutation to the root
                    this.store.commit(MUTATION_APPLY_DIFF, response.changes);
                    resolve(response.returnValue);
                } else {
                    reject(response.error);
                }
            }, error => {
                reject(error);
            });

            // Send the request to the plugin-process
            this.publishMessage(request).then(successul => {
                if (!successul) {
                    throw new Error('Could not send the router message!');
                }
            }).catch(reject);
        });
    }

    protected async handleDispatchAction(identity: Buffer, receivedFrom: string, request: DispatchActionReqeust) {
        // Check if a client should handle the request.
        const names = getModuleActionAndMutationNames(this.store);
        let response: DispatchActionResponse;

        try {
            let dispatchResult: any;
            if (!this.actionTable[request.action] && !names.actions.includes(request.action)) {
                dispatchResult = await this.sendPluginActionDiffRequest({
                    id: uuid(),
                    type: MessageType.REQUEST_PLUGIN_ACTION_DIFF,
                    action: request.action,
                    payload: request.payload,
                    options: request.options,
                });
            } else {
                dispatchResult = await this.store.dispatch(request.action, request.payload, request.options);
            }

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

        this.sendRouterMessage(identity, receivedFrom, response);
    }

    private async handleIncomingRouterMessage(identity: Buffer, receivedFrom: string, message: Message) {
        if (message.type !== MessageType.REQUEST_LOG_ON_SERVER) {
            Logger.debug({
                msg: 'Received IPC Message',
                direction: 'INBOUND',
                socket: 'ROUTER',
                ipcMessage: message,
            });
        }

        if (message.type.startsWith('NOTIFY')) {
            // Drop message on notify since it's one shot
            return;
        }

        // The message is an response to a previously sent request
        // These are handled seperately.
        if (typeof (message as any).respondsTo === 'string') {
            return;
        }

        const handlerFn = this.routerTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, identity, receivedFrom, message, true);

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
        await this.sendRouterMessage(identity, receivedFrom, response);
    }

    private handleIncomingPullMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            direction: 'INBOUND',
            socket: 'PULL',
            ipcMessage: message,
        });

        const handlerFn = this.pullTable[message.type];

        if (typeof handlerFn === 'function') {
            handlerFn.call(this, message, false);

            return;
        }

        // As the server only pulls messages without responding, no response needed here.
    }

    private handleGlobalEventPublish(i: never, r: never, request: PublishGlobalEventRequest) {
        const broadcast: GlobalEventBroadcast = {
            id: uuid(),
            type: MessageType.BROADCAST_GLOBAL_EVENT,
            eventName: request.eventName,
            payload: request.payload,
        };

        this.publishMessage(broadcast);
    }

    private handleStoreFetch(identity: Buffer, receivedFrom: string, request: StoreStateRequest) {
        const response: StoreStateResponse = {
            id: uuid(),
            type: MessageType.RESPONSE_STORE_STATE,
            respondsTo: request.id,
            successful: true,
            state: this.store.state,
        };

        this.sendRouterMessage(identity, receivedFrom, response);
    }

    private handleLogToServer(i: never, r: never, request: LogOnServerRequest) {
        // eslint-disable-next-line no-underscore-dangle
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
