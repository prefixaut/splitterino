import { Inject, Injectable } from 'lightweight-di';
import { merge } from 'lodash';
import { filter, first, map, timeout } from 'rxjs/operators';
import uuid from 'uuid/v4';

import {
    IPC_SERVER_SERVICE_TOKEN,
    MessageType,
    StoreApplyDiffBroadcast,
    StoreCommitRequest,
    StoreCommitResponse,
    StoreCreateDiffRequest,
    StoreCreateDiffResponse,
    StoreStateResponse,
} from '../models/ipc';
import { BaseStore, Commit, DiffHandler, Module, StoreState } from '../store';
import { Logger } from '../utils/logger';
import { createCommit } from '../utils/store';
import { IPCServerService } from './ipc-server.service';

interface Client {
    id: string;
    namespace: string;
}

interface LocalCommit {
    id: string;
    commit: Commit;
}

@Injectable
export class ServerStoreService<S extends StoreState> extends BaseStore<S> {

    private locks: { [module: string]: string } = {};
    private clients: Client[] = [];
    private modules: {
        [namespace: string]: {
            [module: string]: {
                [handler: string]: DiffHandler<any>;
            };
        };
    } = {};
    private queue: LocalCommit[] = [];
    private isUpdatingQueue = false;
    private resolveTable: {
        [id: string]: {
            resolve: (value: boolean) => void;
            reject: (error?: any) => void;
        };
    } = {};

    constructor(@Inject(IPC_SERVER_SERVICE_TOKEN) private ipcServer: IPCServerService) {
        super({} as S);
    }

    public commit(handler: string | Commit, data?: any): Promise<boolean> {
        const commit = typeof handler === 'string' ? createCommit(handler, data) : handler;
        const local: LocalCommit = {
            id: uuid(),
            commit,
        };

        return new Promise<boolean>((resolve, reject) => {
            this.resolveTable[local.id] = { resolve, reject };
            this.queue.push(local);
            this.updateQueue();
        });
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

        this.internalState[namespace][name] = state;
        this.modules[namespace][name] = module.handlers || {};

        // Publish the initial state of the module
        this.publishDiff({ [namespace]: { [name]: state } });
    }

    public unregisterModule(namespace: string, name: string) {
        if (this.state[namespace] == null || this.state[namespace][name] == null) {
            return false;
        }

        // Delete the module
        this.internalState[namespace][name] = null;
        delete this.modules[namespace][name];

        // Delete the namespace if it isn't used anymore
        if (Object.keys(this.modules[namespace]).length < 1) {
            delete this.modules[namespace];
        }

        this.publishDiff({ [namespace]: { [name]: null } });
    }

    private updateQueue() {
        if (this.isUpdatingQueue) {
            return;
        }

        this.isUpdatingQueue = true;
        let hasExternal = false;

        this.queue = this.queue.filter(local => {
            const { id, commit } = local;
            const lockName = this.getLockName(commit);

            // See if the module is currently locked. If it is, then the commit will be queued
            if (this.locks[lockName] == null) {
                return true;
            }

            const handlerFn = this.getHandler(commit);

            if (typeof handlerFn === 'function') {
                try {
                    const successful = this.commitLocally(commit, handlerFn);
                    this.resolveTable[id].resolve(successful);
                    delete this.resolveTable[id];
                } catch (error) {
                    this.resolveTable[id].reject(error);
                    delete this.resolveTable[id];
                }

                return false;
            }

            const foundClient = this.clients.find(client => client.namespace === commit.namespace);
            if (foundClient != null) {
                this.commitExternally(commit, foundClient).then(successful => {
                    this.resolveTable[id].resolve(successful);
                    delete this.resolveTable[id];
                }, error => {
                    this.resolveTable[id].reject(error);
                    delete this.resolveTable[id];
                });
                hasExternal = true;

                return false;
            }

            Logger.warn({
                msg: 'Could not find any possible handler for the commit',
                commit,
            });

            this.resolveTable[id].reject(new Error('Could not find any possible handler for the commit'));
            delete this.resolveTable[id];

            return false;
        });

        this.isUpdatingQueue = false;

        // The queue isn't finished yet, therefore go through it again
        if (this.queue.length > 0 && !hasExternal) {
            this.updateQueue();
        }
    }

    private commitLocally(commit: Commit, handlerFn: DiffHandler<any>): boolean {
        const lockName = this.getLockName(commit);

        // Lock the module
        this.locks[lockName] = 'server';

        // Get the state of the module
        const moduleState = this.state[commit.namespace][commit.module];

        let successful = false;

        try {
            // Execute the handler to get the diff
            const diff = handlerFn(moduleState, commit.data);
            // Apply the created diff to the local state
            this.applyDiff(diff);
            // Publish the diff to the clients
            this.publishDiff(diff);
            successful = true;
        } catch (error) {
            Logger.error({
                msg: 'The handler function threw an error',
                commit,
                error,
            });
        }

        this.internalMonotonousId++;

        // Unlock the module
        this.locks[lockName] = null;

        return successful;
    }

    private async commitExternally(commit: Commit, client: Client): Promise<boolean> {
        const lockName = this.getLockName(commit);

        // Lock the module
        this.locks[lockName] = client.id;

        let successful = false;

        try {
            successful = await new Promise((resolve, reject) => {
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
                        // Increase the monoton-id
                        this.internalMonotonousId++;
                        resolve(true);
                    }
                }, () => {
                    resolve(false);
                });

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

        return successful;
    }

    private applyDiff(diff: any): void {
        merge(this.state, diff);
    }

    private publishDiff(diff: any): void {
        const message: StoreApplyDiffBroadcast = {
            id: uuid(),
            type: MessageType.BROADCAST_STORE_APPLY_DIFF,
            diff,
            monotonId: this.internalMonotonousId,
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

    protected setupIpcHooks() {
        this.ipcServer.listenToRouterSocket().pipe(
            filter(packet => packet.message.type === MessageType.REQUEST_STORE_STATE)
        ).subscribe(packet => {
            const { identity, sender, message } = packet;
            const response: StoreStateResponse<S> = {
                id: uuid(),
                type: MessageType.RESPONSE_STORE_STATE,
                respondsTo: message.id,
                successful: true,
                state: this.internalState,
                monotonId: this.internalMonotonousId,
            };

            this.ipcServer.sendRouterMessage(identity, sender, response);
        });

        this.ipcServer.listenToRouterSocket().pipe(
            filter(packet => packet.message.type === MessageType.REQUEST_STORE_COMMIT)
        ).subscribe(packet => {
            (async () => {
                const { identity, sender } = packet;
                const request = packet.message as StoreCommitRequest;
                let response: StoreCommitResponse;

                try {
                    const result = await this.commit(request.commit);
                    if (!result) {
                        throw new Error('The commit coult not be executed!');
                    }
                    response = {
                        id: uuid(),
                        type: MessageType.RESPONSE_STORE_COMMIT,
                        respondsTo: request.id,
                        successful: true,
                    };
                } catch (error) {
                    response = {
                        id: uuid(),
                        type: MessageType.RESPONSE_STORE_COMMIT,
                        respondsTo: request.id,
                        successful: false,
                        error: error,
                    };
                }

                this.ipcServer.sendRouterMessage(identity, sender, response);
            })();
        });
    }
}
