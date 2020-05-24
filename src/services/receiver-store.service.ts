import { Inject, Injectable } from 'lightweight-di';
import { merge } from 'lodash';
import { filter, map } from 'rxjs/operators';
import uuid from 'uuid/v4';

import { MessageType, StoreApplyDiffBroadcast, StoreCommitRequest, StoreStateResponse } from '../models/ipc';
import { IPC_CLIENT_SERVICE_TOKEN } from '../models/services';
import { RootState } from '../models/states/root.state';
import { Commit, ReactiveStore, StoreState } from '../store';
import { createCommit, defineGetterProperty } from '../utils/store';
import { IPCClientService } from './ipc-client.service';

@Injectable
export class ReceiverStoreService<S extends StoreState> extends ReactiveStore<S> {

    protected queue: { diff: any; monotonId: number }[] = [];
    protected isSyncing = false;

    constructor(@Inject(IPC_CLIENT_SERVICE_TOKEN) protected ipcClient: IPCClientService) {
        super({} as any);
    }

    public async commit(handler: string | Commit, data?: any): Promise<boolean> {
        const commit = typeof handler === 'string' ? createCommit(handler, data) : handler;
        const response = await this.ipcClient.sendDealerRequestAwaitResponse({
            id: uuid(),
            type: MessageType.REQUEST_STORE_COMMIT,
            commit: commit,
        } as StoreCommitRequest, MessageType.RESPONSE_STORE_COMMIT, 3_000);

        if (!response.successful) {
            throw response.error;
        }

        return true;
    }

    public applyDiff(diff: any, monotonId: number) {
        if (monotonId <= this.monotonousId) {
            return false;
        }
        let shouldQueue = false;

        if (this.isSyncing) {
            shouldQueue = true;
        } else if ((this.monotonousId + 1) !== monotonId) {
            // The store has run out of sync, we have to request the complete state from the store
            shouldQueue = true;
            this.requestNewState();
        }

        if (shouldQueue) {
            this.queue.push({ diff, monotonId });

            return;
        }

        this.isCommitting = true;
        this.internalMonotonousId = monotonId;

        // Check if the diff creates a new namespace or deletes one
        const existingNamespaces = Object.keys(this.internalState);

        // If a new namespace has been created, we need to create a new lock
        // as it's based on the namespace keys
        Object.keys(diff).filter(
            namespace => !existingNamespaces.includes(namespace) || diff[namespace] == null
        ).forEach(namespace => {
            if (diff[namespace] == null) {
                // Delete the namespace when asked to
                delete this.getterInstance[namespace];
            } else {
                // Create the new namespace entry in the getter
                defineGetterProperty(
                    this.internalState,
                    this.getterInstance.$data.$state,
                    namespace,
                    () => this.isCommitting,
                );
            }
        });

        Object.entries(merge({}, this.getterInstance, diff)).forEach(([key, value]) => {
            this.getterInstance.$set(this.getterInstance.$data.$state, key, value);
        });

        this.isCommitting = false;

        return true;
    }

    public async requestNewState(): Promise<void> {
        this.isSyncing = true;

        const response = await this.ipcClient.sendDealerRequestAwaitResponse({
            id: uuid(),
            type: MessageType.REQUEST_STORE_STATE,
        }, MessageType.RESPONSE_STORE_STATE, 5_000) as StoreStateResponse<RootState>;

        if (response.successful) {
            this.internalState = response.state as any;
            this.internalMonotonousId = response.monotonId;
            this.replaceGetterInstance(this.internalState);

            this.queue.filter(item => item.monotonId > this.monotonousId).forEach(item => {
                this.applyDiff(item.diff, item.monotonId);
            });
        }

        this.isSyncing = false;
    }

    public setupIpcHooks() {
        this.ipcClient.listenToSubscriberSocket().pipe(
            map(packet => packet.message),
            filter(message => message.type === MessageType.BROADCAST_STORE_APPLY_DIFF)
        ).subscribe((request: StoreApplyDiffBroadcast) => {
            this.applyDiff(request.diff, request.monotonId);
        });
    }
}
