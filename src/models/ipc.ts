import { InjectionToken } from 'lightweight-di';
import { Observable } from 'rxjs';
import { Socket } from 'zeromq';

import { Commit, StoreState } from '../store';
import { LogLevel } from '../utils/logger';
import { RootState } from './states/root.state';

export const IPC_CLIENT_SERVICE_TOKEN = new InjectionToken<IPCClientInterface>('ipc-client');

export const IPC_SERVER_SERVICE_TOKEN = new InjectionToken<IPCServerInterface>('ipc-server');

export interface IPCClientInterface {
    isInitialized(): boolean;
    initialize(clientInfo: ClientInformation): Promise<false | RegistationResult>;
    close(): Promise<void>;
    sendDealerMessage(message: Message, target?: string, quiet?: boolean): boolean;
    sendDealerRequestAwaitResponse(request: Request, responseType: MessageType, timeoutMs: number): Promise<Response>;
    sendPushMessage(message: Message): boolean;
    listenToSubscriberSocket(): Observable<IPCPacket>;
    listenToDealerSocket(): Observable<IPCPacket>;
    getStoreState(): Promise<RootState>;
    listenForLocalMessage<T>(messageId: string): Observable<T>;
    sendLocalMessage(messageId: string, data?: any): void;
}

export interface IPCServerInterface {
    isInitialized(): boolean;
    initialize(logLevel: LogLevel): Promise<void>;
    close(): Promise<void>;
    listenToRouterSocket(): Observable<IPCRouterPacket>;
    publishMessage(message: Message, topic?: string): Promise<boolean>;
    sendRouterMessage(identity: Buffer, targetClient: string, message: Message): Promise<boolean>;
}

export interface ClientInformation {
    name: string;
    actions?: string[];
    windowId?: number;
}

export interface RegistationResult {
    logLevel: LogLevel;
}

export interface IPCSocket extends Socket {
    type: 'dealer' | 'sub' | 'pub' | 'push' | 'pull';
}

export interface IPCRouterSocket extends Socket {
    type: 'router';
}

export interface SubscriberTable {
    [message: string]: (message: Message) => any;
}

export interface DealerTable {
    [message: string]: (receivedFrom: string, message: Message, respond?: boolean) => any;
}

export enum MessageType {
    // IPC Setup
    REQUEST_REGISTER_CLIENT = 'REQUEST_REGISTER_CLIENT',
    RESPONSE_REGISTER_CLIENT = 'RESPONSE_REGISTER_CLIENT',
    REQUEST_UNREGISTER_CLIENT = 'REQUEST_UNREGISTER_CLIENT',
    RESPONSE_UNREGISTER_CLIENT = 'RESPONSE_UNREGISTER_CLIENT',

    // Store related
    REQUEST_STORE_STATE = 'REQUEST_STORE_STATE',
    RESPONSE_STORE_STATE = 'RESPONSE_STORE_STATE',
    REQUEST_STORE_COMMIT = 'REQUEST_STORE_COMMIT',
    RESPONSE_STORE_COMMIT = 'RESPONSE_STORE_COMMIT',
    BROADCAST_STORE_APPLY_DIFF = 'BROADCAST_STORE_APPLY_DIFF',
    REQUEST_STORE_CREATE_DIFF = 'REQUEST_STORE_CREATE_DIFF',
    RESPONSE_STORE_CREATE_DIFF = 'RESPONSE_STORE_CREATE_DIFF',
    REQUEST_STORE_REGISTER_NAMESPACE = 'REQUEST_STORE_REGISTER_NAMESPACE',
    RESPONSE_STORE_REGISTER_NAMESPACE = 'RESPONSE_STORE_REGISTER_NAMESPACE',
    REQUEST_STORE_REGISTER_MODULE = 'REQUEST_STORE_REGISTER_MODULE',
    RESPONSE_STORE_REGISTER_MODULE = 'RESPONSE_STORE_REGISTER_MODULE',
    REQUEST_STORE_UNREGISTER_NAMESPACE = 'REQUEST_STORE_UNREGISTER_NAMESPACE',
    RESPONSE_STORE_UNREGISTER_NAMESPACE = 'RESPONSE_STORE_UNREGISTER_NAMESPACE',

    // General purpose
    REQUEST_PUBLISH_GLOBAL_EVENT = 'REQUEST_PUBLISH_GLOBAL_EVENT',
    BROADCAST_GLOBAL_EVENT = 'BROADCAST_GLOBAL_EVENT',
    REQUEST_LOG_ON_SERVER = 'REQUEST_LOG_ON_SERVER',
    RESPONSE_INVALID_REQUEST = 'RESPONSE_INVALID_REQUEST',
    BROADCAST_APP_SHUTDOWN = 'BROADCAST_APP_SHUTDOWN',

    // Plugin API
    NOTIFY_PLUGIN_PROCESS_READY = 'NOTIFY_PLUGIN_PROCESS_READY',
    NOTIFY_PLUGIN_PROCESS_DED = 'NOTIFY_PLUGIN_PROCESS_DED',
}

export interface IPCPacket {
    receiver: string;
    sender: string;
    message: Message;
}

export interface IPCRouterPacket extends IPCPacket {
    identity: Buffer;
}

/**
 * A basic Message which is being sent via IPC.
 */
export interface Message {
    /**
     * UUID of the Message. Used to identify individual messages.
     */
    id: string;
    /**
     * The Type of the Message.
     * Messages are generally categorized as Requests and Responses.
     */
    type: MessageType;
}

export interface ResponseError {
    message: string;
}

/**
 * A basic Request which is being sent via IPC.
 */
export interface Request extends Message {
    type:
    | MessageType.REQUEST_REGISTER_CLIENT
    | MessageType.REQUEST_UNREGISTER_CLIENT
    | MessageType.REQUEST_STORE_STATE
    | MessageType.REQUEST_STORE_COMMIT
    | MessageType.REQUEST_STORE_CREATE_DIFF
    | MessageType.REQUEST_STORE_REGISTER_NAMESPACE
    | MessageType.REQUEST_STORE_REGISTER_MODULE
    | MessageType.REQUEST_STORE_UNREGISTER_NAMESPACE
    | MessageType.REQUEST_PUBLISH_GLOBAL_EVENT
    | MessageType.REQUEST_LOG_ON_SERVER
    ;
}

export interface Broadcast extends Message {
    type:
    | MessageType.BROADCAST_GLOBAL_EVENT
    | MessageType.BROADCAST_APP_SHUTDOWN
    | MessageType.BROADCAST_STORE_APPLY_DIFF
    ;
}

export interface Notification extends Message {
    type:
    | MessageType.NOTIFY_PLUGIN_PROCESS_READY
    | MessageType.NOTIFY_PLUGIN_PROCESS_DED
    ;
}

/**
 * A basic Response to a Request which is being sent via IPC.
 */
export interface Response extends Message {
    type:
    | MessageType.RESPONSE_REGISTER_CLIENT
    | MessageType.RESPONSE_UNREGISTER_CLIENT
    | MessageType.RESPONSE_STORE_STATE
    | MessageType.RESPONSE_STORE_COMMIT
    | MessageType.RESPONSE_STORE_CREATE_DIFF
    | MessageType.RESPONSE_STORE_REGISTER_NAMESPACE
    | MessageType.RESPONSE_STORE_REGISTER_MODULE
    | MessageType.RESPONSE_STORE_UNREGISTER_NAMESPACE
    | MessageType.RESPONSE_INVALID_REQUEST
    ;
    /**
     * The Message ID that this Response is responding to.
     */
    respondsTo: string;
    /**
     * If the initial Request was processed successfully.
     */
    successful: boolean;
    /**
     * The Error why the request couldn't be processed.
     */
    error?: ResponseError;
}

/**
 * Internal message structure for local message bus in single process
 */
export interface LocalMessage {
    messageId: string;
    content: any;
}

/**
 * Request to register a Client to the Server.
 */
export interface RegisterClientRequest extends Request {
    type: MessageType.REQUEST_REGISTER_CLIENT;
    /**
     * The id of the client, usually a UUID
     */
    clientId: string;
    /**
     * Name of the client.
     */
    name: string;
    /**
     * The window ID of the client (if it is a render process)
     */
    windowId?: number;
    /**
     * Actions this client may handle in it's context.
     */
    actions?: string[];
}

/**
 * Response if the Server successfully registered the client.
 */
export interface RegisterClientResponse extends Response {
    type: MessageType.RESPONSE_REGISTER_CLIENT;
    /**
     * The ID of the Server
     */
    serverId?: string;
    /**
     * The log-level to use for loggers
     */
    logLevel?: LogLevel;
}

/**
 * Request to unregister a client from the Server.
 */
export interface UnregisterClientRequest extends Request {
    type: MessageType.REQUEST_UNREGISTER_CLIENT;
    /**
     * The client that should get unregistered.
     */
    clientId: string;
}

/**
 * Response if the Server successfully unregistered the client.
 */
export interface UnregisterClientResponse extends Response {
    type: MessageType.RESPONSE_UNREGISTER_CLIENT;
}

/**
 * Request to get the most recent version of the state.
 */
export interface StoreStateRequest extends Request {
    type: MessageType.REQUEST_STORE_STATE;
}

/**
 * Response which contains the most recent state of the store.
 */
export interface StoreStateResponse<S extends StoreState> extends Response {
    type: MessageType.RESPONSE_STORE_STATE;
    /**
     * The most recent state of the store.
     */
    state: S;
    /**
     * The monoton-id of the current state
     */
    monotonId: number;
}

/**
 * Request to perform an commit in the store
 */
export interface StoreCommitRequest extends Request {
    type: MessageType.REQUEST_STORE_COMMIT;
    /**
     * The Commit to execute
     */
    commit: Commit;
}

/**
 * Response to return the result of the commit
 */
export interface StoreCommitResponse extends Response {
    type: MessageType.RESPONSE_STORE_COMMIT;
}

/**
 * Request to create a diff from a commit
 */
export interface StoreCreateDiffRequest extends Request {
    type: MessageType.REQUEST_STORE_CREATE_DIFF;
    /**
     * The commit that the client should create a diff for
     */
    commit: Commit;
}

/**
 * Response with the created diff
 */
export interface StoreCreateDiffResponse extends Response {
    type: MessageType.RESPONSE_STORE_CREATE_DIFF;
    /**
     * The created diff
     */
    diff?: any;
}

/**
 * A broadcast to all clients to apply the specified diff to the store
 */
export interface StoreApplyDiffBroadcast extends Broadcast {
    type: MessageType.BROADCAST_STORE_APPLY_DIFF;
    /**
     * The diff that needs to be applied
     */
    diff: any;
    /**
     * The monoton id to keep the commits in order
     */
    monotonId: number;
}

/**
 * Request to register a namespace to the client
 */
export interface StoreRegisterNamespaceRequest extends Request {
    type: MessageType.REQUEST_STORE_REGISTER_NAMESPACE;
    /**
     * The namespace the client should handle
     */
    namespace: string;
}

/**
 * Response for registering a namespace as a client
 */
export interface StoreRegisterNamespaceResponse extends Response {
    type: MessageType.RESPONSE_STORE_REGISTER_NAMESPACE;
}

/**
 * Request to register a module on the server
 */
export interface StoreRegisterModuleRequest extends Request {
    type: MessageType.REQUEST_STORE_REGISTER_MODULE;
    /**
     * The module name the client wants to register
     */
    module: string;
    /**
     * The initial state of the module
     */
    state: any;
}

/**
 * Response to register a module on the server
 */
export interface StoreRegisterMouleResponse extends Response {
    type: MessageType.RESPONSE_STORE_REGISTER_MODULE;
}

/**
 * Request to unregister the client from the namespace
 */
export interface StoreUnregisterNamespaceRequest extends Request {
    type: MessageType.REQUEST_STORE_UNREGISTER_NAMESPACE;
}

/**
 * Response for unregistering a client from the namespace
 */
export interface StoreUnregisterNamespaceResponse extends Response {
    type: MessageType.RESPONSE_STORE_UNREGISTER_NAMESPACE;
}

/**
 * Request to broadcast a global-event to all clients.
 */
export interface PublishGlobalEventRequest extends Request {
    type: MessageType.REQUEST_PUBLISH_GLOBAL_EVENT;
    /**
     * The name of the event which is being published
     */
    eventName: string;
    /**
     * The payload that goes along with the event
     */
    payload?: any;
}

/**
 * A broadcast for global events.
 */
export interface GlobalEventBroadcast extends Broadcast {
    type: MessageType.BROADCAST_GLOBAL_EVENT;
    /**
     * The name of the event which is being published
     */
    eventName: string;
    /**
     * The payload that goes along with the event
     */
    payload?: any;
}

/**
 * Request to log a message on the server (into the file-stream)
 */
export interface LogOnServerRequest extends Request {
    type: MessageType.REQUEST_LOG_ON_SERVER;
    /**
     * The Loglevel to use when logging the message
     */
    level: LogLevel;
    /**
     * The message that should be logged
     */
    message: object;
}

/**
 * Notify main process that plugin process is ready
 */
export interface PluginProcessReadyNotification extends Notification {
    type: MessageType.NOTIFY_PLUGIN_PROCESS_READY;
}

/**
 * Notify main process that plugin process is ded
 */
export interface PluginProcessDedNotification extends Notification {
    type: MessageType.NOTIFY_PLUGIN_PROCESS_DED;
}

/**
 * Broadcast a shutdown event
 */
export interface AppShutdownBroadcast extends Broadcast {
    type: MessageType.BROADCAST_APP_SHUTDOWN;
}
