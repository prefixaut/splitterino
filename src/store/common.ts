export interface Module<S> {
    initialize(): S;
    handlers: {
        [name: string]: DiffHandler<S>;
    };
}

export type DiffHandler<S> = (state: S, data?: any) => any;

export interface Commit {
    namespace: string;
    module: string;
    handler: string;
    data?: any;
}
