import { InjectionToken } from 'lightweight-di';
import { Observable } from 'rxjs';
import { CommitOptions, DispatchOptions, Store } from 'vuex';
import { Socket } from 'zeromq';

import { LogLevel } from '../utils/logger';
import { RootState } from './states/root.state';

export const IPC_CLIENT_TOKEN = new InjectionToken<IPCClientInterface>('ipc-client');

export interface IPCClientInterface {
    isInitialized(): boolean;
    initialize(store: Store<RootState>, clientInfo: ClientInformation): Promise<false | RegistationResult>;
    close(): Promise<void>;
    sendDealerMessage(message: Message, target?: string, quiet?: boolean): boolean;
    sendDealerRequestAwaitResponse(request: Request, responseType: MessageType, timeoutMs: number): Promise<Response>;
    sendPushMessage(message: Message): boolean;
    listenToSubscriberSocket(): Observable<IPCPacket>;
    listenToDealerSocket(): Observable<IPCPacket>;
    getStoreState(): Promise<RootState>;
    dispatchAction(actionName: string, payload?: any, options?: DispatchOptions): Promise<any>;
    listenForLocalMessage<T>(messageId: string): Observable<T>;
    sendLocalMessage(messageId: string, data?: any): void;
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
    REQUEST_REGISTER_CLIENT = 'REQUEST_REGISTER_CLIENT',
    RESPONSE_REGISTER_CLIENT = 'RESPONSE_REGISTER_CLIENT',
    REQUEST_UNREGISTER_CLIENT = 'REQUEST_UNREGISTER_CLIENT',
    RESPONSE_UNREGISTER_CLIENT = 'RESPONSE_UNREGISTER_CLIENT',
    REQUEST_STORE_STATE = 'REQUEST_STORE_STATE',
    RESPONSE_STORE_STATE = 'RESPONSE_STORE_STATE',
    REQUEST_DISPATCH_ACTION = 'REQUEST_DISPATCH_ACTION',
    RESPONSE_DISPATCH_ACTION = 'RESPONSE_DISPATCH_ACTION',
    REQUEST_DISPATCH_CLIENT_ACTION = 'REQUEST_DISPATCH_CLIENT_ACTION',
    RESPONSE_DISPATCH_CLIENT_ACTION = 'RESPONSE_DISPATCH_CLIENT_ACTION',
    REQUEST_COMMIT_MUTATION = 'REQUEST_COMMIT_MUTATION',
    REQUEST_PUBLISH_GLOBAL_EVENT = 'REQUEST_PUBLISH_GLOBAL_EVENT',
    BROADCAST_GLOBAL_EVENT = 'BROADCAST_GLOBAL_EVENT',
    BROADCAST_APP_SHUTDOWN = 'BROADCAST_APP_SHUTDOWN',
    REQUEST_LOG_ON_SERVER = 'REQUEST_LOG_ON_SERVER',
    RESPONSE_INVALID_REQUEST = 'RESPONSE_INVALID_REQUEST',
    NOTIFY_PLUGIN_PROCESS_READY = 'NOTIFY_PLUGIN_PROCESS_READY',
    NOTIFY_PLUGIN_PROCESS_DED = 'NOTIFY_PLUGIN_PROCESS_DED',
    REQUEST_PLUGIN_ACTION_DIFF = 'REQUEST_PLUGIN_ACTION_DIFF',
    RESPONSE_PLUGIN_ACTION_DIFF = 'RESPONSE_PLUGIN_ACTION_DIFF',
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
    | MessageType.REQUEST_DISPATCH_ACTION
    | MessageType.REQUEST_DISPATCH_CLIENT_ACTION
    | MessageType.REQUEST_COMMIT_MUTATION
    | MessageType.REQUEST_PUBLISH_GLOBAL_EVENT
    | MessageType.REQUEST_LOG_ON_SERVER
    | MessageType.REQUEST_PLUGIN_ACTION_DIFF
    ;
}

export interface Broadcast extends Message {
    type:
    | MessageType.BROADCAST_GLOBAL_EVENT
    | MessageType.BROADCAST_APP_SHUTDOWN
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
    | MessageType.RESPONSE_DISPATCH_ACTION
    | MessageType.RESPONSE_DISPATCH_CLIENT_ACTION
    | MessageType.RESPONSE_INVALID_REQUEST
    | MessageType.RESPONSE_PLUGIN_ACTION_DIFF
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
export interface StoreStateResponse extends Response {
    type: MessageType.RESPONSE_STORE_STATE;
    /**
     * The most recent state of the store.
     */
    state: RootState;
}

/**
 * Request to apply an action on the proper process.
 */
export interface DispatchActionReqeust extends Request {
    type: MessageType.REQUEST_DISPATCH_ACTION;
    /**
     * The action name that should be applied.
     */
    action: string;
    /**
     * Payload for the action.
     */
    payload?: any;
    /**
     * Options for dispatching the action.
     */
    options?: DispatchOptions;
}

/**
 * Response if the Server successfully applied the Action,
 * and the return value of the action.
 */
export interface DispatchActionResponse extends Response {
    type: MessageType.RESPONSE_DISPATCH_ACTION;
    /**
     * The value returned from the action after completion.
     */
    returnValue?: any;
}

/**
 * Request that an Action should be handled by a client in it's context.
 */
export interface DispatchClientActionRequest extends Request {
    type: MessageType.REQUEST_DISPATCH_CLIENT_ACTION;
    /**
     * Which client should handle this dispatch action in it's context.
     */
    clientId: string;
    /**
     * The action name that should be applied.
     */
    action: string;
    /**
     * Payload for the action.
     */
    payload?: any;
    /**
     * Options for dispatching the action.
     */
    options?: DispatchOptions;
}

/**
 * Response if the Server successfully applied the Action,
 * and the return value of the action.
 * Additionally also contains all commits the action attempted to perform.
 */
export interface DispatchClientActionResponse extends Response {
    type: MessageType.RESPONSE_DISPATCH_CLIENT_ACTION;
    /**
     * The value returned from the action after completion.
     */
    returnValue?: any;
    /**
     * The commits that the action attempted to perform.
     * These commits may not be handled by the client, but by the server.
     */
    commits?: { name: string; payload?: any; options?: CommitOptions }[];
}

/**
 * Request to apply a mutation to the store.
 */
export interface CommitMutationRequest extends Request {
    type: MessageType.REQUEST_COMMIT_MUTATION;
    /**
     * The mutation that should be applied.
     */
    mutation: string;
    /**
     * Payload for the mutation.
     */
    payload?: any;
    /**
     * Options for commiting the mutation.
     */
    options?: CommitOptions;
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

/**
 * Request sent to the Plugin to create a diff from the requested Action.
 */
export interface PluginActionDiffRequest extends Request {
    type: MessageType.REQUEST_PLUGIN_ACTION_DIFF;
        /**
     * The action name that should be applied.
     */
    action: string;
    /**
     * Payload for the action.
     */
    payload?: any;
    /**
     * Options for dispatching the action.
     */
    options?: DispatchOptions;
}

/**
 * Response with the return-value of the action and the resulted
 * changes which may be applied.
 */
export interface PluginActionDiffResponse extends Response {
    type: MessageType.RESPONSE_PLUGIN_ACTION_DIFF;
    /**
     * The value returned from the action after completion.
     */
    returnValue?: any;
    /**
     * The diff that needs to be applied to the main store.
     */
    changes?: { [key: string]: any };
}
