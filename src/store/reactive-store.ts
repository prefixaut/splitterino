import Vue, { WatchOptions } from 'vue';

import { StoreState } from '../models/store';
import { createGetterTree } from '../utils/store';
import { BaseStore } from './base-store';

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
            const originalFn = expOrFn;
            expOrFn = instance => {
                originalFn(instance.$data.$state);
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
