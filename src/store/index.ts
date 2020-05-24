import Vue, { WatchOptions } from 'vue';

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
    protected isCommitting = false;
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

export abstract class ReactiveStore<S extends StoreState> extends BaseStore<S> {

    protected getterInstance: Vue;

    public get state(): Readonly<S> {
        return this.getterInstance.$data.$state;
    }

    constructor(intialState: S) {
        super(intialState);
        this.replaceGetterInstance(intialState);
    }

    public watch(
        expOrFn: string | Function,
        callback: (n: any, o: any) => void,
        options?: WatchOptions
    ): () => void {
        // Wrap it to the instance
        if (typeof expOrFn === 'string') {
            expOrFn = `$state.${expOrFn}`;
        } else if (typeof expOrFn === 'function') {
            expOrFn = instance => {
                (expOrFn as Function)(instance.$state);
            };
        }

        return this.getterInstance.$watch(expOrFn as any, callback, options);
    }

    protected replaceGetterInstance(state: S) {
        // Creating a reactive getter state
        this.getterInstance = new Vue({
            data: {
                $state: createGetterTree(state, state, () => this.isCommitting),
            }
        });
    }
}
