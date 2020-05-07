import { merge } from 'lodash';
import uuid from 'uuid/v4';

import {
    MessageType,
    StoreCommitRequest,
    StoreRegisterModuleRequest,
    StoreRegisterMouleResponse,
    StoreRegisterNamespaceRequest,
    StoreRegisterNamespaceResponse,
    StoreStateResponse,
    StoreUnregisterNamespaceRequest,
    StoreUnregisterNamespaceResponse,
} from '../models/ipc';
import { IPCClient } from '../services/ipc-client.service';
import { BaseStore, createCommit, DiffHandler, Module, StoreState } from './common';

export class ReceiverStore<S extends StoreState> extends BaseStore<S> {

    protected queue: { diff: any; monotonId: number }[] = [];
    protected isSyncing = false;

    constructor(protected ipcClient: IPCClient) {
        super({} as any);
    }

    public async commit(handler: string, data?: any): Promise<boolean> {
        const commit = createCommit(handler, data);
        const response = await this.ipcClient.sendDealerRequestAwaitResponse({
            id: uuid(),
            type: MessageType.REQUEST_STORE_COMMIT,
            commit: commit,
        } as StoreCommitRequest, MessageType.RESPONSE_STORE_COMMIT, 3_000);

        return response.successful;
    }

    public applyDiff(diff: any, monotonId: number) {
        if (monotonId <= this.monotonId) {
            return false;
        }
        let shouldQueue = false;

        if (this.isSyncing) {
            shouldQueue = true;
        } else if ((this.monotonId + 1) !== monotonId) {
            // The store has run out of sync, we have to request the complete state from the store
            shouldQueue = true;
            this.requestNewState();
        }

        if (shouldQueue) {
            this.queue.push({ diff, monotonId });

            return;
        }

        this.internalMonotonId = monotonId;
        merge(this.internalState, diff);

        return true;
    }

    public async requestNewState(): Promise<void> {
        this.isSyncing = true;

        const response = await this.ipcClient.sendDealerRequestAwaitResponse({
            id: uuid(),
            type: MessageType.REQUEST_STORE_STATE,
        }, MessageType.RESPONSE_STORE_STATE, 5_000) as StoreStateResponse;

        if (response.successful) {
            this.internalState = response.state as any;
            this.internalMonotonId = response.monotonId;

            this.queue.filter(item => item.monotonId > this.monotonId).forEach(item => {
                this.applyDiff(item.diff, item.monotonId);
            });
        }

        this.isSyncing = false;
    }
}

export class HandlerStore<S extends StoreState> extends ReceiverStore<S> {

    protected isRegistered = false;
    protected namespace: string;
    protected modules: {
        [name: string]: {
            [handlerName: string]: DiffHandler<any>;
        };
    } = {};

    public getNamespace() {
        return this.namespace;
    }

    public unregisterNamespace(): Promise<boolean> {
        if (!this.isRegistered) {
            throw new Error('This client is not registered to a namespace yet!');
        }
        const request: StoreUnregisterNamespaceRequest = {
            id: uuid(),
            type: MessageType.REQUEST_STORE_UNREGISTER_NAMESPACE,
        };
        const response: StoreUnregisterNamespaceResponse = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_UNREGISTER_NAMESPACE);

        if (!response.successful) {
            return false;
        }

        this.namespace = null;
        this.isRegistered = false;

        return true;
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
        const response: StoreRegisterNamespaceResponse = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_REGISTER_NAMESPACE);

        if (!response.successful) {
            return false;
        }

        this.namespace = namespace;
        this.isRegistered = true;

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
        const response: StoreRegisterMouleResponse = await this.ipcClient
            .sendDealerRequestAwaitResponse(request, MessageType.RESPONSE_STORE_REGISTER_MODULE);

        return response.successful;
    }

    public getDiff(commit: Commit) {

    }
}
