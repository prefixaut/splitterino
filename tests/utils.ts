import { Injector } from 'lightweight-di';
import { Action, Commit, Dispatch } from 'vuex';

import { ELECTRON_INTERFACE_TOKEN } from '../src/models/electron';
import { IPC_CLIENT_TOKEN } from '../src/models/ipc';
import { IO_SERVICE_TOKEN, IOService } from '../src/services/io.service';
import { TRANSFORMER_SERVICE_TOKEN, TransformerService } from '../src/services/transfromer.service';
import { VALIDATOR_SERVICE_TOKEN, ValidatorService } from '../src/services/validator.service';
import { ElectronMockService } from './mocks/electron-mock.service';
import { IPCClientMockService } from './mocks/ipc-client-mock.service';

// Initialize the Dependency-Injection
export function createMockInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronMockService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_TOKEN, useClass: IPCClientMockService },
    ]);
}

export interface MockedTransmission {
    type: string;
    payload?: any;
}

export interface MockedActionContextState<S, R> {
    state: S;
    getters?: any;
    rootState?: R;
    rootGetters?: any;
}

export interface MockedActionContext<S, R> extends MockedActionContextState<S, R> {
    commit: Commit;
    dispatch: Dispatch;
}

export type MockedAction<S, R> = (context: MockedActionContext<S, R>, payload?: any) => Promise<any>;

export interface ActionTestResult {
    commits: MockedTransmission[];
    dispatches: MockedTransmission[];
    returnValue: any;
}

export async function testAction<S, R>(
    action: Action<S, R>,
    context: MockedActionContextState<S, R>,
    payload?: any,
): Promise<ActionTestResult> {
    const commits: MockedTransmission[] = [];
    const dispatches: MockedTransmission[] = [];

    // mock commit
    const commit = (commitType: string, commitPayload?: any) => {
        commits.push({
            type: commitType,
            payload: commitPayload
        });
    };

    // mock dispatch
    const dispatch = (dispatchType: string, dispatchPayload?: any) => {
        dispatches.push({
            type: dispatchType,
            payload: dispatchPayload
        });

        return Promise.resolve();
    };

    // call the action with mocked store and arguments
    const returnValue = await (action as MockedAction<S, R>)({
        ...context,
        commit,
        dispatch,
    }, payload);

    return {
        commits,
        dispatches,
        returnValue: returnValue,
    };
}

export function randomInt(max: number, min: number = 1): number {
    return Math.max(min, Math.floor(Math.random() * Math.floor(max)));
}

export function wait(timeout: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), timeout);
    });
}
