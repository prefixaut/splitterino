import { Injectable } from 'lightweight-di';

import { StoreInterface } from '../../src/models/services';
import { RootState } from '../../src/models/states/root.state';
import { Commit } from '../../src/store';
import { createCommit } from '../../src/utils/store';

@Injectable
export class StoreMockService implements StoreInterface<RootState> {
    public history: Commit[] = [];

    public state: RootState = {} as RootState;

    public get monotonousId() {
        return 0;
    }

    public commit(handlerOrCommit: string | Commit, data?: any): Promise<boolean> {
        if (typeof handlerOrCommit === 'string') {
            this.history.push(createCommit(handlerOrCommit, data));
        } else {
            this.history.push(handlerOrCommit);
        }

        return Promise.resolve(true);
    }
}
