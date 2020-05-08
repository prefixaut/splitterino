import { Inject, Injectable } from 'lightweight-di';
import { filter, map } from 'rxjs/operators';
import uuid from 'uuid/v4';

import {
    IPC_CLIENT_SERVICE_TOKEN,
    MessageType,
    StoreCreateDiffRequest,
    StoreCreateDiffResponse,
    StoreRegisterModuleRequest,
    StoreRegisterNamespaceRequest,
    StoreUnregisterNamespaceRequest,
} from '../models/ipc';
import { Commit, DiffHandler, Module, StoreState } from '../store';
import { IPCClientService } from './ipc-client.service';
import { ReceiverStoreService } from './receiver-store.service';

@Injectable
export class HandlerStoreService<S extends StoreState> extends ReceiverStoreService<S> {

    protected isRegistered = false;
    protected namespace: string;
    protected modules: {
        [name: string]: {
            [handlerName: string]: DiffHandler<any>;
        };
    } = {};

    constructor(@Inject(IPC_CLIENT_SERVICE_TOKEN) ipcClient: IPCClientService) {
        super(ipcClient);
    }

    public getNamespace() {
        return this.namespace;
    }

    public async registerNamespace(namespace: string): Promise<boolean> {
        if (this.isRegistered || namespace == null || namespace.trim().length < 1) {
            return false;
        }
        const request: StoreRegisterNamespaceRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_REGISTER_NAMESPACE,
            namespace,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_REGISTER_NAMESPACE);

        if (!response.successful) {
            return false;
        }

        this.namespace = namespace;
        this.isRegistered = true;

        return true;
    }

    public async unregisterNamespace(): Promise<boolean> {
        if (!this.isRegistered) {
            throw new Error('This client is not registered to a namespace yet!');
        }
        const request: StoreUnregisterNamespaceRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_UNREGISTER_NAMESPACE,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_UNREGISTER_NAMESPACE);

        if (!response.successful) {
            return false;
        }

        this.namespace = null;
        this.isRegistered = false;

        return true;
    }

    public async registerModule<T>(name: string, module: Module<T>): Promise<boolean> {
        if (!this.isRegistered) {
            throw new Error('This client is not registered to a namespace yet!');
        }
        if (this.modules[name] != null) {
            throw new Error(`The module "${name}" is already registered in the namespace "${this.namespace}"!`);
        }
        const state = module.initialize();
        if (state == null || typeof state !== 'object') {
            throw new Error('The module\'s initialize-function has to create a valid state object!');
        }

        const request: StoreRegisterModuleRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_REGISTER_MODULE,
            module: name,
            state: state,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_REGISTER_MODULE);

        this.modules[name] = module.handlers;

        return response.successful;
    }

    public getDiff(commit: Commit): Partial<any> {
        if (!this.isRegistered) {
            throw new Error('This client is not registered to a namespace yet!');
        }
        if (this.namespace !== commit.namespace) {
            throw new Error('The commits namespace is not identical to the currently registered namespace!');
        }
        if (this.modules[commit.module] == null || this.modules[commit.module][commit.handler] == null) {
            throw new Error(`Could not find an handler for "${commit.module}" -> "${commit.handler}"!`);
        }

        const moduleState = this.internalState[this.namespace][commit.module];
        const diff = this.modules[commit.module][commit.handler](moduleState, commit.data);

        return diff;
    }

    protected setupIpcHooks() {
        super.setupIpcHooks();

        this.ipcClient.listenToSubscriberSocket().pipe(
            map(packet => packet.message),
            filter(message => message.type === MessageType.REQUEST_STORE_CREATE_DIFF)
        ).subscribe((request: StoreCreateDiffRequest) => {
            let response: StoreCreateDiffResponse;
            try {
                const diff = this.getDiff(request.commit);
                response = {
                    id: uuid(),
                    type: MessageType.RESPONSE_STORE_CREATE_DIFF,
                    respondsTo: request.id,
                    successful: true,
                    diff: diff,
                };
            } catch (error) {
                response = {
                    id: uuid(),
                    type: MessageType.RESPONSE_STORE_CREATE_DIFF,
                    respondsTo: request.id,
                    successful: false,
                    error: error,
                };
            }
            this.ipcClient.sendDealerMessage(response);
        });
    }
}
