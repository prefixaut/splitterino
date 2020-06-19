import { PLUGINS_NAMESPACE_NAME } from '../common/constants';
import { StoreInterface } from '../models/services';
import { Commit, Module, RootState } from '../models/store';
import { Logger } from '../utils/logger';
import { HandlerStoreService } from './handler-store.service';

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

        return this.store.registerModule(PLUGINS_NAMESPACE_NAME, this.moduleName, module);
    }
}
