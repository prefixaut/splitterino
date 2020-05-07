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

export function createCommit(handler: string, data?: any): Commit {
    const parts = handler.split('/');
    const commit: Commit = {
        handler: parts.pop(),
        module: parts.pop(),
        namespace: parts.join('/'),
        data: data,
    };

    return commit;
}

export class BaseStore<S extends StoreState> {
    protected internalState: S;
    protected lockedState: S;
    protected internalMonotonId = 0;

    public get state(): Readonly<S> {
        return this.lockedState;
    }

    public get monotonId(): number {
        return this.internalMonotonId;
    }

    constructor(intialState: S) {
        this.internalState = intialState;
        this.lockedState = lockObject(this.internalState);
    }
}
