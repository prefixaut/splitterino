import { InjectionToken } from 'lightweight-di';

import { RootState } from '../models/states/root.state';
import { lockObject } from '../utils/store';

export interface StoreState {
    [namespace: string]: {
        [module: string]: any;
    };
}

export interface Module<S> {
    initialize(): Required<S>;
    handlers: {
        [name: string]: DiffHandler<S>;
    };
}

export type DiffHandler<S> = (state: S, data?: any) => Partial<S>;

export interface Commit {
    namespace: string;
    module: string;
    handler: string;
    data?: any;
}

export const STORE_SERVICE_TOKEN = new InjectionToken<BaseStore<RootState>>('store');

export abstract class BaseStore<S extends StoreState> {
    protected internalState: S;
    protected lockedState: S;
    protected internalMonotonousId = 0;

    public get state(): Readonly<S> {
        return this.lockedState;
    }

    public get monotonousId(): number {
        return this.internalMonotonousId;
    }

    constructor(intialState: S) {
        this.internalState = intialState;
        this.lockedState = lockObject(this.internalState);
    }

    public abstract commit(handlerOrCommit: string | Commit, data?: any): Promise<boolean>;
}
