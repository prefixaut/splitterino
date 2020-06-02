import { StoreInterface } from '../models/services';
import { Commit, StoreListener, StoreState } from '../models/store';
import { createGetterTree } from '../utils/store';

export abstract class BaseStore<S extends StoreState> implements StoreInterface<S> {

    protected internalState: S;
    protected getterState: S;
    protected isCommitting = false;
    protected internalMonotonousId = 0;
    protected listeners: StoreListener<S>[] = [];

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

    public onCommit(listener: StoreListener<S>) {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    public offCommit(listener: StoreListener<S>) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    protected triggerCommit(commit: Commit) {
        this.listeners.forEach(listener => {
            try {
                listener(commit, this.state);
            } catch {
                // Ignore errors from listeners
            }
        });
    }
}