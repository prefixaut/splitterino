export interface StoreState {
    [namespace: string]: {
        [module: string]: any;
    };
}

export interface DiffHandlerTree {
    [namespace: string]: {
        [module: string]: {
            [handler: string]: DiffHandler<unknown>;
        };
    };
}

export interface Module<S> {
    initialize(): Required<S>;
    handlers: {
        [name: string]: DiffHandler<S>;
    };
}

export type DiffHandler<S> = (state: S, data?: any) => Partial<S>;
export type StoreListener<S> = (commit: Commit, state: S) => void;

export interface Commit {
    namespace: string;
    module: string;
    handler: string;
    data?: any;
}
