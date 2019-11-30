import { DispatchOptions } from 'vuex';

export enum MessageType {
    REQUEST_GET_AVAILABLE_VERSIONS = 'REQUEST_GET_AVAILABLE_VERSIONS',
    RESPONSE_GET_AVAILABLE_VERSIONS = 'RESPONSE_GET_AVAILABLE_VERSIONS',
    REQUEST_REGISTER_CLIENT = 'REQUEST_REGISTER_CLIENT',
    RESPONSE_REGISTER_CLIENT = 'RESPONSE_REGISTER_CLIENT',
    REQUEST_UNREGISTER_CLIENT = 'REQUEST_UNREGISTER_CLIENT',
    RESPONSE_UNREGISTER_CLIENT = 'RESPONSE_UNREGISTER_CLIENT',
    REQUEST_USE_VERSION = 'REQUEST_USE_VERSION',
    RESPONSE_USE_VERSION = 'RESPONSE_USE_VERSION',
    REQUEST_APPLY_ACTION = 'REQUEST_APPLY_ACTION',
    RESPONSE_APPLY_ACTION = 'RESPONSE_APPLY_ACTION',
    REQUEST_APPLY_MUTATION = 'REQUEST_APPLY_MUTATION',
    INVALID_REQUEST_RESPONSE = 'INVALID_REQUEST_RESPONSE',
}

/**
 * All Versions that Clients/Server can use.
 */
export enum APIVersion {
    V1 = 'V1',
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
    | MessageType.REQUEST_GET_AVAILABLE_VERSIONS
    | MessageType.REQUEST_REGISTER_CLIENT
    | MessageType.REQUEST_UNREGISTER_CLIENT
    | MessageType.REQUEST_USE_VERSION
    | MessageType.REQUEST_APPLY_ACTION
    | MessageType.REQUEST_APPLY_MUTATION
    ;
}

/**
 * A basic Response to a Request which is being sent via IPC.
 */
export interface Response extends Message {
    type:
    | MessageType.RESPONSE_GET_AVAILABLE_VERSIONS
    | MessageType.RESPONSE_REGISTER_CLIENT
    | MessageType.RESPONSE_UNREGISTER_CLIENT
    | MessageType.RESPONSE_USE_VERSION
    | MessageType.RESPONSE_APPLY_ACTION
    | MessageType.INVALID_REQUEST_RESPONSE
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
 * Request to get all available Versions from the Server.
 */
export interface GetAvailableVersionsRequest extends Request {
    type: MessageType.REQUEST_GET_AVAILABLE_VERSIONS;
}

/**
 * Response for a `REQUEST_GET_AVAILABLE_VERSIONS`.
 * Contains the available versions of the API.
 */
export interface GetAvailableVersionsResponse extends Response {
    type: MessageType.RESPONSE_GET_AVAILABLE_VERSIONS;
    /**
     * A list of available Version IDs that the Server accepts.
     */
    versions: APIVersion[];
}

/**
 * Request to register a Client to the Server.
 */
export interface RegisterClientRequest extends Request {
    type: MessageType.REQUEST_REGISTER_CLIENT;
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
 * Response for a `REQUEST_REGISTER_CLIENT`.
 * If the Server successfully registered the client.
 */
export interface RegisterClientResponse extends Response {
    type: MessageType.RESPONSE_REGISTER_CLIENT;
    /**
     * A UUID which represents the registered client's ID.
     * The client can discard all client-specific requests
     * when the ID does not match.
     */
    clientId?: string;
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
 * Response for a `REQUEST_UNREGISTER_CLIENT`.
 * If the Server successfully unregistered the client.
 */
export interface UnregisterClientResponse extends Response {
    type: MessageType.RESPONSE_UNREGISTER_CLIENT;
}

/**
 * Request to use a specific API Version when interacting with the server.
 */
export interface UseVersionRequest extends Request {
    type: MessageType.REQUEST_USE_VERSION;
    /**
     * The Version the Client wants to use
     */
    version: APIVersion;
    /**
     * The client's ID.
     */
    clientId: string;
}

/**
 * Response for a `REQUEST_USE_VERSION`.
 * If the Server agrees on using the requested API Version.
 */
export interface UseVersionResponse extends Response {
    type: MessageType.RESPONSE_USE_VERSION;
}

/**
 * Request to apply an action on the proper process.
 */
export interface ApplyActionReqeust extends Request {
    type: MessageType.REQUEST_APPLY_ACTION;
    /**
     * The action name that should be applied.
     */
    action: string;
    /**
     * Payload for the action.
     */
    payload?: any;
    options?: DispatchOptions;
}

/**
 * Response for a `REQUEST_APPLY_ACTION`.
 * If the Server successfully applied the Action,
 * and the return value of the action.
 */
export interface ApplyActionResponse extends Response {
    type: MessageType.RESPONSE_APPLY_ACTION;
    returnValue?: any;
}

/**
 * Request to apply a mutation to the store.
 */
export interface ApplyMutationRequest extends Request {
    type: MessageType.REQUEST_APPLY_MUTATION;
    /**
     * The mutation that should be applied.
     */
    mutation: string;
    /**
     * Payload for the mutation.
     */
    payload?: any;
}
