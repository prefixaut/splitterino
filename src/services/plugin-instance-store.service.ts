import { PLUGINS_NAMESPACE_NAME } from '../common/constants';
import { PluginInstanceStore } from '../models/services';
import { Commit, Module, RootState, StoreListener } from '../models/store';
import { Logger } from '../utils/logger';
import { HandlerStoreService } from './handler-store.service';

export class PluginInstanceStoreService<T> implements PluginInstanceStore<T> {
    protected listeners: StoreListener<RootState>[] = [];

    constructor(
        private store: HandlerStoreService<RootState>,
        private moduleName: string
    ) { }

    public get state() {
        return this.store.state;
    }

    public get moduleState(): T {
        return this.store.state[PLUGINS_NAMESPACE_NAME][this.moduleName];
    }

    public get monotonousId() {
        return this.store.monotonousId;
    }

    commit(handlerOrCommit: string | Commit, data?: any) {
        return this.store.commit(handlerOrCommit, data);
    }

    registerModule(module: Module<T>): Promise<boolean> {
        Logger.info({
            msg: 'Registering Plugin module',
            plugin: this.moduleName,
        });

        return this.store.registerModule(PLUGINS_NAMESPACE_NAME, this.moduleName, module);
    }

    unregisterModule(): Promise<boolean> {
        Logger.info({
            msg: 'Unregistering Plugin module',
            plugin: this.moduleName,
        });

        return this.store.unregisterModule(PLUGINS_NAMESPACE_NAME, this.moduleName);
    }

    public onCommit(listener: StoreListener<RootState>) {
        this.store.onCommit(listener);
    }

    public offCommit(listener: StoreListener<RootState>) {
        this.store.offCommit(listener);
    }
}
