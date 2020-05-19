import { Injectable } from 'lightweight-di';
import { Observable, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { socket } from 'zeromq';

import {
    IPC_PUBLISHER_SUBSCRIBER_ADDRESS,
    IPC_PULL_PUSH_ADDRESS,
    IPC_ROUTER_DEALER_ADDRESS,
    IPC_SERVER_NAME,
} from '../common/constants';
import {
    GlobalEventBroadcast,
    IPCPacket,
    IPCRouterPacket,
    IPCRouterSocket,
    IPCServerInterface,
    IPCSocket,
    LogOnServerRequest,
    Message,
    MessageType,
    PublishGlobalEventRequest,
    RegisterClientRequest,
    RegisterClientResponse,
    UnregisterClientRequest,
    UnregisterClientResponse,
} from '../models/ipc';
import { createSharedObservableFromSocket } from '../utils/ipc';
import { Logger, LogLevel } from '../utils/logger';

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

@Injectable
export class IPCServerService implements IPCServerInterface {

    private publisher: IPCSocket;
    private router: IPCRouterSocket;
    private pull: IPCSocket;

    private logLevel: LogLevel;

    private routerMessages: Observable<IPCRouterPacket>;
    private routerMessageSubscription: Subscription;

    private pullMessages: Observable<IPCPacket>;
    private pullMessageSubscription: Subscription;

    private initialized = false;

    private connectedClients: Client[] = [];
    private routerTable: { [message: string]: RouterFn } = {
        /* eslint-disable @typescript-eslint/unbound-method,no-invalid-this */
        [MessageType.REQUEST_REGISTER_CLIENT]: this.handleRegisterClient,
        [MessageType.REQUEST_UNREGISTER_CLIENT]: this.handleUnregisterClient,
        [MessageType.REQUEST_PUBLISH_GLOBAL_EVENT]: this.handleGlobalEventPublish,
        [MessageType.REQUEST_LOG_ON_SERVER]: this.handleLogToServer,
        /* eslint-enable @typescript-eslint/unbound-method,no-invalid-this */
    };
    private pullTable: { [message: string]: (message: Message) => any } = {
        /* eslint-disable @typescript-eslint/unbound-method,no-invalid-this */
        /* eslint-enable @typescript-eslint/unbound-method,no-invalid-this */
    };

    public isInitialized() {
        return this.initialized;
    }

    public initialize(logLevel: LogLevel): Promise<void> {
        if (this.initialized) {
            return Promise.resolve();
        }

        this.logLevel = logLevel;

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

    public publishMessage(message: Message, topic: string = ''): Promise<boolean> {
        Logger.debug({
            msg: 'Sending IPC Message',
            direction: 'OUTBOUND',
            socket: 'PUBLISHER',
            ipcMessage: message,
        });

        this.publisher.send([topic, IPC_SERVER_NAME, JSON.stringify(message)]);

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
        }

        const response: UnregisterClientResponse = {
            id: uuid(),
            type: MessageType.RESPONSE_UNREGISTER_CLIENT,
            respondsTo: request.id,
            successful: index > -1,
        };

        await this.sendRouterMessage(identity, receivedFrom, response);
    }

    private handleIncomingRouterMessage(identity: Buffer, receivedFrom: string, message: Message) {
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

        // Ignore messages which couldn't be handled internally
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

    private handleLogToServer(i: never, r: never, request: LogOnServerRequest) {
        // eslint-disable-next-line no-underscore-dangle
        Logger._logToHandlers(request.level, request.message);
    }
}
