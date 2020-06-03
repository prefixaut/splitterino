import { StoreInterface } from '../models/services';
import { RootState } from '../models/states/root.state';
import { Commit, Module } from '../models/store';
import { HandlerStoreService } from './handler-store.service';
import { Logger } from '../utils/logger';

export class PluginInstanceStoreService implements StoreInterface<RootState> {
    constructor(
        private store: HandlerStoreService<RootState>,
        private moduleName: string
    ) { }

    public get state() {
        return this.store.state;
    }

    public get monotonousId() {
        return this.store.monotonousId;
    }

    commit(handlerOrCommit: string | Commit, data?: any) {
        return this.store.commit(handlerOrCommit, data);
    }

    registerModule<T>(module: Module<T>): Promise<boolean> {
        Logger.info({
            msg: 'Registering Plugin module',
            plugin: this.moduleName,
        });

        return this.store.registerModule('plugins', this.moduleName, module);
    }
}
