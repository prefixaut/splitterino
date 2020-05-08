import { Inject, Injectable } from 'lightweight-di';
import { merge } from 'lodash';
import { filter, map } from 'rxjs/operators';
import uuid from 'uuid/v4';

import {
    IPC_CLIENT_SERVICE_TOKEN,
    MessageType,
    StoreApplyDiffBroadcast,
    StoreCommitRequest,
    StoreStateResponse,
} from '../models/ipc';
import { RootState } from '../models/states/root.state';
import { BaseStore, Commit, StoreState } from '../store';
import { createCommit } from '../utils/store';
import { IPCClientService } from './ipc-client.service';

@Injectable
export class ReceiverStoreService<S extends StoreState> extends BaseStore<S> {

    protected queue: { diff: any; monotonId: number }[] = [];
    protected isSyncing = false;

    constructor(@Inject(IPC_CLIENT_SERVICE_TOKEN) protected ipcClient: IPCClientService) {
        super({} as any);
        this.setupIpcHooks();
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

        this.internalMonotonousId = monotonId;
        merge(this.internalState, diff);

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

            this.queue.filter(item => item.monotonId > this.monotonousId).forEach(item => {
                this.applyDiff(item.diff, item.monotonId);
            });
        }

        this.isSyncing = false;
    }

    protected setupIpcHooks() {
        this.ipcClient.listenToSubscriberSocket().pipe(
            map(packet => packet.message),
            filter(message => message.type === MessageType.BROADCAST_STORE_APPLY_DIFF)
        ).subscribe((request: StoreApplyDiffBroadcast) => {
            this.applyDiff(request.diff, request.monotonId);
        });
    }
}
