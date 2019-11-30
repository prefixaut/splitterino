import { Observable, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Store } from 'vuex';
import { Publisher, Subscriber } from 'zeromq';

import { RootState } from '../../store/states/root.state';
import { Logger } from '../../utils/logger';
import {
    APIVersion,
    ApplyActionReqeust,
    ApplyActionResponse,
    GetAvailableVersionsResponse,
    Message,
    MessageType,
    RegisterClientRequest,
    RegisterClientResponse,
    Response,
    UnregisterClientRequest,
    UnregisterClientResponse,
} from '../interfaces/ipc';

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

export class IPCServer {
    private address = 'tcp://127.0.0.1:3730';
    private clients: Client[] = [];
    private actionTable: { [actionName: string]: string };

    private sender: Publisher;
    private listener: Observable<Message>;

    private rxSubscription: Subscription;

    constructor(private store: Store<RootState>) { }

    public async initialize(): Promise<Subscription> {
        this.sender = new Publisher();
        await this.sender.bind(this.address);

        this.listener = new Observable<Message>(rxSubscriber => {
            const zmqSubscriber = new Subscriber();
            let timeoutHandle;
            zmqSubscriber.connect(this.address);

            async function waitForNext() {
                const data = await zmqSubscriber.receive();
                timeoutHandle = setTimeout(() => waitForNext(), 10);
                rxSubscriber.next(JSON.parse(data.toString()));
            }
            timeoutHandle = setTimeout(() => waitForNext(), 10);

            return async () => {
                clearTimeout(timeoutHandle);
                await zmqSubscriber.unbind(this.address);
                zmqSubscriber.close();
            };
        });

        this.rxSubscription = this.listener.subscribe(message => this.handleMessage(message));

        return this.rxSubscription;
    }

    private sendMessage(message: Message) {
        Logger.debug({
            msg: 'Sending IPC Message',
            ipcMessage: message,
        });

        this.sender.send(JSON.stringify(message));
    }

    private async handleMessage(message: Message) {
        Logger.debug({
            msg: 'Received IPC Message',
            ipcMessage: message,
        });

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

                this.clients.push(client);
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
                const index = this.clients.findIndex(client => client.id === req.clientId);
                if (index > -1) {
                    this.clients.splice(index, 1);

                    // Repopulate the actions
                    this.actionTable = {};
                    this.clients.forEach(client => {
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

            case MessageType.REQUEST_APPLY_ACTION: {
                const req = message as ApplyActionReqeust;

                // Check if a client should handle the request.
                if (this.actionTable[req.action]) {
                    // TODO: Send a request to the client to perform the action in it's process
                    // The client then may send back a response with all commits that should
                    // be performed, and the actions return value.
                    // The mutations are then applied here in the main thread and synced to the
                    // clients via regular means.
                    // The action returnValue is returned as a response to this request.
                    break;
                }

                let response: ApplyActionResponse;
                try {
                    const dispatchResult = await this.store.dispatch(req.action, req.payload, req.options);
                    response = {
                        id: uuid(),
                        type: MessageType.RESPONSE_APPLY_ACTION,
                        successful: true,
                        respondsTo: req.id,
                        returnValue: dispatchResult,
                    };
                } catch (error) {
                    response = {
                        id: uuid(),
                        type: MessageType.RESPONSE_APPLY_ACTION,
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
}
