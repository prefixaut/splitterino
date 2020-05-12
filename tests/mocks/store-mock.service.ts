import { Injectable } from 'lightweight-di';

import { StoreInterface } from '../../src/models/services';
import { RootState } from '../../src/models/states/root.state';
import { Commit } from '../../src/store';

@Injectable
export class StoreMockService implements StoreInterface<RootState> {
    public get state() {
        return null;
    }

    public get monotonousId() {
        return 0;
    }

    public commit(handlerOrCommit: string | Commit, data?: any): Promise<boolean> {
        return Promise.resolve(false);
    }
}
