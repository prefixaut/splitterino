import { StoreInterface } from '../models/services';
import { createGetterTree } from '../utils/store';

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

export abstract class BaseStore<S extends StoreState> implements StoreInterface<S> {
    protected internalState: S;
    protected getterState: S;
    protected internalMonotonousId = 0;

    public get state(): Readonly<S> {
        return this.getterState;
    }

    public get monotonousId(): number {
        return this.internalMonotonousId;
    }

    constructor(intialState: S) {
        this.internalState = intialState;
        this.getterState = createGetterTree(this.internalState);
    }

    public abstract commit(handlerOrCommit: string | Commit, data?: any): Promise<boolean>;
}
