import { Inject, Injectable } from 'lightweight-di';
import { filter, map } from 'rxjs/operators';
import uuid from 'uuid/v4';

import {
    MessageType,
    StoreCreateDiffRequest,
    StoreCreateDiffResponse,
    StoreRegisterModuleRequest,
    StoreRegisterNamespaceRequest,
    StoreUnregisterModuleRequest,
    StoreUnregisterNamespaceRequest,
} from '../models/ipc';
import { IPC_CLIENT_SERVICE_TOKEN } from '../models/services';
import { Commit, DiffHandler, Module, StoreState } from '../store';
import { IPCClientService } from './ipc-client.service';
import { ReceiverStoreService } from './receiver-store.service';

@Injectable
export class HandlerStoreService<S extends StoreState> extends ReceiverStoreService<S> {

    protected modules: {
        [namespace: string]: {
            [name: string]: {
                [handlerName: string]: DiffHandler<any>;
            };
        };
    } = {};

    constructor(@Inject(IPC_CLIENT_SERVICE_TOKEN) ipcClient: IPCClientService) {
        super(ipcClient);
    }

    public getNamespaces() {
        return Object.keys(this.modules);
    }

    public async registerNamespace(namespace: string): Promise<boolean> {
        if (namespace == null || this.modules[namespace] != null) {
            return false;
        }
        const request: StoreRegisterNamespaceRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_REGISTER_NAMESPACE,
            namespace,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_REGISTER_NAMESPACE, 3_000);

        if (response.successful) {
            this.modules[namespace] = {};
        }

        return response.successful;
    }

    public async unregisterNamespace(namespace: string): Promise<boolean> {
        if (this.modules[namespace] == null) {
            throw new Error('The namespace is not registered yet!');
        }
        const request: StoreUnregisterNamespaceRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_UNREGISTER_NAMESPACE,
            namespace: namespace,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_UNREGISTER_NAMESPACE);

        if (response.successful) {
            delete this.modules[namespace];
        }

        return response.successful;
    }

    public async registerModule<T>(namespace: string, name: string, module: Module<T>): Promise<boolean> {
        if (this.modules[namespace] == null) {
            throw new Error(`This client has not been registered the namespace "${namespace}" yet!`);
        }
        if (this.modules[namespace][name] != null) {
            throw new Error(`The module "${name}" is already registered in the namespace "${namespace}"!`);
        }
        const state = module.initialize();
        if (state == null || typeof state !== 'object') {
            throw new Error('The module\'s initialize-function has to create a valid state object!');
        }

        const request: StoreRegisterModuleRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_REGISTER_MODULE,
            namespace: namespace,
            module: name,
            state: state,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_REGISTER_MODULE);

        if (response.successful) {
            this.modules[namespace][name] = module.handlers;
        }

        return response.successful;
    }

    public async unregisterModule(namespace: string, name: string): Promise<boolean> {
        if (this.modules[namespace] == null) {
            throw new Error(`This client has not been registered the namespace "${namespace}" yet!`);
        }
        if (this.modules[namespace][name] == null) {
            throw new Error(`The module "${name}" is not registered in the namespace "${namespace}" yet!`);
        }

        const request: StoreUnregisterModuleRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_UNREGISTER_MODULE,
            namespace: namespace,
            module: name,
        };
        const response = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_UNREGISTER_MODULE);

        if (response.successful) {
            delete this.modules[namespace];
        }

        return response.successful;
    }

    public getDiff(commit: Commit): Partial<any> {
        if (this.modules[commit.namespace] == null) {
            throw new Error('The commits namespace is not identical to the currently registered namespace!');
        }
        if (
            this.modules[commit.namespace][commit.module] == null
            || this.modules[commit.namespace][commit.module][commit.handler] == null
        ) {
            throw new Error(`Could not find an handler for "${commit.module}" -> "${commit.handler}"!`);
        }

        const moduleState = this.state[commit.namespace][commit.module];
        const handlerFn = this.modules[commit.namespace][commit.module][commit.handler];
        const diff = handlerFn(moduleState, commit.data);

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
