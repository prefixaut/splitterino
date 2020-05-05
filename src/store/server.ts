import { cloneDeep, merge } from 'lodash';
import { first, map, timeout } from 'rxjs/operators';
import uuid from 'uuid/v4';

import { IPCServer } from '../common/ipc-server';
import { MessageType, StoreApplyDiffBroadcast, StoreCreateDiffRequest, StoreCreateDiffResponse } from '../models/ipc';
import { Logger } from '../utils/logger';
import { difference } from '../utils/store';
import { Commit, DiffHandler, Module } from './common';

interface Client {
    id: string;
    namespace: string;
}

interface StoreState {
    [namespace: string]: {
        [module: string]: any;
    };
}

export class ServerStore<S extends StoreState> {

    private locks: { [module: string]: string } = {};
    private clients: Client[] = [];
    private state: S;
    private modules: {
        [namespace: string]: {
            [module: string]: {
                [handler: string]: DiffHandler<any>;
            };
        };
    } = {};
    private queue: Commit[] = [];
    private monotonId = 0;

    constructor(private ipcServer: IPCServer) {
        this.state = {} as any;
    }

    public commit(handler: string, data?: any) {
        const parts = handler.split('/');
        const commit: Commit = {
            handler: parts.pop(),
            module: parts.pop(),
            namespace: parts.join('/'),
            data: data,
        };

        this.queue.push(commit);
        this.updateQueue();
    }

    public registerModule<T>(namespace: string, name: string, module: Module<T>) {
        if (this.state[namespace] == null) {
            // Hacky workaround for TypeScript#31661
            (this.state as any)[namespace] = {};
        }
        if (this.modules[namespace] == null) {
            this.modules[namespace] = {};
        }
        if (this.state[namespace][name] != null) {
            throw new Error(`The module "${name}" is already registered in the namespace "${namespace}"!`);
        }
        const state = module.initialize();
        if (state == null || typeof state !== 'object') {
            throw new Error('The module\'s initialize-function has to create a valid state object!');
        }

        this.state[namespace][name] = state;
        this.modules[namespace][name] = module.handlers || {};

        // Publish the initial state of the module
        this.publishDiff({ [namespace]: { [name]: state } });
    }

    public unregisterModule(namespace: string, name: string) {
        if (this.state[namespace] == null || this.state[namespace][name] == null) {
            return false;
        }
        const oldState = cloneDeep(this.state);

        // Delete the module
        this.state[namespace][name] = {};
        delete this.modules[namespace][name];

        // Delete the namespace if it isn't used anymore
        if (Object.keys(this.modules[namespace]).length < 1) {
            delete this.modules[namespace];
        }

        this.publishDiff(difference(oldState, this.state));
    }

    private updateQueue() {
        let hasExternal = false;

        this.queue = this.queue.filter(commit => {
            const lockName = this.getLockName(commit);

            // See if the module is currently locked. If it is, then the commit will be queued
            if (this.locks[lockName] == null) {
                return true;
            }

            const handlerFn = this.getHandler(commit);

            if (typeof handlerFn === 'function') {
                this.commitLocally(commit, handlerFn);

                return false;
            }

            const foundClient = this.clients.find(client => client.namespace === commit.namespace);
            if (foundClient != null) {
                this.commitExternally(commit, foundClient);
                hasExternal = true;

                return false;
            }

            Logger.warn({
                msg: 'Could not find any possible handler for the commit',
                commit,
            });

            return false;
        });

        // The queue isn't finished yet, therefore go through it again
        if (this.queue.length > 0 && !hasExternal) {
            this.updateQueue();
        }
    }

    private commitLocally(commit: Commit, handlerFn: DiffHandler<any>) {
        const lockName = this.getLockName(commit);

        // Lock the module
        this.locks[lockName] = 'server';

        // Get the state of the module
        const moduleState = this.state[commit.namespace][commit.module];
        try {
            // Execute the handler to get the diff
            const diff = handlerFn(moduleState, commit.data);
            // Apply the created diff to the local state
            this.applyDiff(diff);
            // Publish the diff to the clients
            this.publishDiff(diff);
        } catch (error) {
            Logger.error({
                msg: 'The handler function threw an error',
                commit,
                error,
            });
        }

        // Unlock the module
        this.locks[lockName] = null;
    }

    private async commitExternally(commit: Commit, client: Client) {
        const lockName = this.getLockName(commit);

        // Lock the module
        this.locks[lockName] = client.id;

        try {
            await new Promise((resolve, reject) => {
                const request: StoreCreateDiffRequest = {
                    id: uuid(),
                    type: MessageType.REQUEST_STORE_CREATE_DIFF,
                    commit,
                };

                this.ipcServer.listenToRouterSocket().pipe(
                    first(packet => {
                        const { message, sender } = packet;

                        return message.type === MessageType.RESPONSE_STORE_CREATE_DIFF
                            && (message as StoreCreateDiffResponse).respondsTo === request.id
                            && sender === client.id;
                    }),
                    map(packet => packet.message),
                    timeout(3_000)
                ).subscribe((message: StoreCreateDiffResponse) => {
                    if (!message.successful) {
                        reject(message.error);
                    } else {
                        // Apply the diff to the local store
                        this.applyDiff(message.diff);
                        // Publish the diff to all clients
                        this.publishDiff(message.diff);
                        resolve();
                    }
                }, reject);

                this.ipcServer.publishMessage(request).then(sent => {
                    if (!sent) {
                        throw new Error('The message could not be sent!');
                    }
                }).catch(reject);
            });
        } catch (error) {
            Logger.error({
                msg: 'Error while executing external commit',
                commit,
            });
        }

        this.locks[lockName] = null;

        this.updateQueue();
    }

    private applyDiff(diff: any): void {
        merge(this.state, diff);
    }

    private publishDiff(diff: any): void {
        const message: StoreApplyDiffBroadcast = {
            id: uuid(),
            type: MessageType.BROADCAST_STORE_APPLY_DIFF,
            diff,
            monotonId: this.monotonId++,
        };
        this.ipcServer.publishMessage(message);
    }

    private getHandler(commit: Commit): DiffHandler<any> {
        // Tring to get the corresponding handler function
        if (this.modules[commit.namespace] != null) {
            const namespace = this.modules[commit.namespace];
            if (namespace[commit.module] != null) {
                const module = namespace[commit.module];
                if (module[commit.handler] != null) {
                    return module[commit.handler];
                }
            }
        }

        return null;
    }

    private getLockName(commit: Commit): string {
        return `${commit.namespace}/${commit.module}`;
    }
}
