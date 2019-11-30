import { v4 as uuid } from 'uuid';
import { DispatchOptions, Store } from 'vuex';

import { RootState } from '../../store/states/root.state';
import {
    CommitMutationRequest,
    Message,
    MessageType,
    RegisterClientRequest,
    RegisterClientResponse,
    UnregisterClientRequest,
    UnregisterClientResponse,
    DispatchActionReqeust,
    DispatchActionResponse,
    StoreStateRequest,
    StoreStateResponse,
    DispatchClientActionRequest,
} from '../interfaces/ipc';
import { IPCHandler } from './handler';

export class ClientNotRegisteredError extends Error {
    constructor(message?: string) {
        super(message || 'The client has not yet been registered, and therefore can not send the request!');
    }
}

export class IPCClient extends IPCHandler {

    private clientId: string;
    private name: string;
    private store: Store<RootState>;

    private actions: string[] = [];
    private windowId: number;

    constructor(options: { name: string; actions?: string[]; windowId?: number }) {
        super();
        const { name, actions, windowId } = options;
        this.name = name;
        this.actions = actions || [];
        this.windowId = windowId;
    }

    public isRegistered() {
        return this.clientId != null;
    }

    public setStore(store: Store<RootState>) {
        this.store = store;
    }

    public async register(): Promise<boolean> {
        if (this.isRegistered()) {
            // Already registered, can't register again
            return false;
        }

        const request: RegisterClientRequest = {
            id: uuid(),
            type: MessageType.REQUEST_REGISTER_CLIENT,
            name: this.name,
            actions: this.actions,
            windowId: this.windowId,
        };

        const response = await this.sendRequestAwaitResponse(
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
        if (!this.isRegistered()) {
            // Already unregistered, can't register again
            return false;
        }

        const request: UnregisterClientRequest = {
            id: uuid(),
            type: MessageType.REQUEST_UNREGISTER_CLIENT,
            clientId: this.clientId,
        };

        const response = await this.sendRequestAwaitResponse(
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

        const response = await this.sendRequestAwaitResponse(
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
        if (!this.isRegistered()) {
            throw new ClientNotRegisteredError();
        }

        const request: DispatchActionReqeust = {
            id: uuid(),
            type: MessageType.REQUEST_DISPATCH_ACTION,
            action: actionName,
            payload: payload,
            options: options,
        };
        const response = await this.sendRequestAwaitResponse(
            request,
            MessageType.RESPONSE_DISPATCH_ACTION
        ) as DispatchActionResponse;

        if (!response.successful) {
            throw new Error(response.error.message);
        }

        return response.returnValue;
    }

    public async handleIncomingMessage(message: Message) {
        switch (message.type) {
            case MessageType.REQUEST_COMMIT_MUTATION: {
                const request = message as CommitMutationRequest;
                this.store.commit(request.mutation, request.payload, request.options);
                break;
            }

            case MessageType.REQUEST_DISPATCH_CLIENT_ACTION: {
                const request = message as DispatchClientActionRequest;
                // Not a request for us
                if (request.clientId !== this.clientId) {
                    break;
                }

                // TODO: Find a way on how to call the actions with a patched
                // action-context, so commits are not actually executed.
                // Seems currently impossible, as only wrapped action-handlers
                // are getting saved in the store.

                break;
            }

            default:
            // TODO: Handle erronous messages
        }
    }
}
