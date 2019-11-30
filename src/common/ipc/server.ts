import { v4 as uuid } from 'uuid';
import { Store } from 'vuex';

import { RootState } from '../../store/states/root.state';
import {
    APIVersion,
    DispatchActionReqeust,
    DispatchActionResponse,
    GetAvailableVersionsResponse,
    Message,
    MessageType,
    RegisterClientRequest,
    RegisterClientResponse,
    Response,
    UnregisterClientRequest,
    UnregisterClientResponse,
    DispatchClientActionRequest,
    DispatchClientActionResponse,
} from '../interfaces/ipc';
import { IPCHandler } from './handler';

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
     * The API Version to use when communicating with the client.
     */
    apiVersion: APIVersion;
    /**
     * All actions that the client may handle in it's context.
     */
    actions: string[];
}

export class IPCServer extends IPCHandler {

    private connectedClients: Client[] = [];
    private actionTable: { [actionName: string]: string };

    constructor(protected store: Store<RootState>) {
        super();
    }

    public async handleIncomingMessage(message: Message) {
        switch (message.type) {
            case MessageType.REQUEST_GET_AVAILABLE_VERSIONS: {
                const response: GetAvailableVersionsResponse = {
                    id: uuid(),
                    type: MessageType.RESPONSE_GET_AVAILABLE_VERSIONS,
                    respondsTo: message.id,
                    successful: true,
                    versions: [APIVersion.V1],
                };
                this.sendMessage(response);
                break;
            }

            case MessageType.REQUEST_REGISTER_CLIENT: {
                const req = message as RegisterClientRequest;
                const client: Client = {
                    id: uuid(),
                    name: req.name,
                    apiVersion: APIVersion.V1,
                    actions: req.actions || [],
                };

                this.connectedClients.push(client);
                client.actions.forEach(actionName => {
                    this.actionTable[actionName] = client.id;
                });

                const response: RegisterClientResponse = {
                    id: uuid(),
                    type: MessageType.RESPONSE_REGISTER_CLIENT,
                    successful: true,
                    respondsTo: req.id,
                    clientId: client.id,
                };
                this.sendMessage(response);
                break;
            }

            case MessageType.REQUEST_UNREGISTER_CLIENT: {
                const req = message as UnregisterClientRequest;
                const index = this.connectedClients.findIndex(client => client.id === req.clientId);
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
                    respondsTo: req.id,
                    successful: index > -1,
                };
                this.sendMessage(response);
                break;
            }

            case MessageType.REQUEST_DISPATCH_ACTION: {
                const req = message as DispatchActionReqeust;

                // Check if a client should handle the request.
                if (this.actionTable[req.action]) {
                    // TODO: Send a request to the client to perform the action in it's process
                    // The client then may send back a response with all commits that should
                    // be performed, and the actions return value.
                    // The mutations are then applied here in the main thread and synced to the
                    // clients via regular means.
                    // The action returnValue is returned as a response to this request.
                    // this.forwardDispatchToClient(req);
                    break;
                }

                let response: DispatchActionResponse;
                try {
                    const dispatchResult = await this.store.dispatch(req.action, req.payload, req.options);
                    response = {
                        id: uuid(),
                        type: MessageType.RESPONSE_DISPATCH_ACTION,
                        successful: true,
                        respondsTo: req.id,
                        returnValue: dispatchResult,
                    };
                } catch (error) {
                    response = {
                        id: uuid(),
                        type: MessageType.RESPONSE_DISPATCH_ACTION,
                        successful: false,
                        respondsTo: req.id,
                        error: error,
                    };
                }
                this.sendMessage(response);
                break;
            }

            default: {
                const response: Response = {
                    id: uuid(),
                    type: MessageType.INVALID_REQUEST_RESPONSE,
                    respondsTo: message.id,
                    successful: false,
                    error: {
                        message: `The received Request Type "${message.type}" could not be processed by the server!`,
                    }
                };
                this.sendMessage(response);
            }
        }
    }

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
}
