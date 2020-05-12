import { Injector } from 'lightweight-di';
import { Action, Commit, Dispatch } from 'vuex';

import { RUNTIME_ENVIRONMENT_TOKEN, RuntimeEnvironment } from '../src/common/constants';
import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    IPC_SERVER_SERVICE_TOKEN,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../src/models/services';
import { ActionService } from '../src/services/action.service';
import { IOService } from '../src/services/io.service';
import { TransformerService } from '../src/services/transfromer.service';
import { ValidatorService } from '../src/services/validator.service';
import { ElectronMockService } from './mocks/electron-mock.service';
import { IPCClientMockService } from './mocks/ipc-client-mock.service';
import { StoreMockService } from './mocks/store-mock.service';

// Initialize the Dependency-Injection
export function createMockInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionService },
        { provide: ELECTRON_SERVICE_TOKEN, useClass: ElectronMockService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_SERVICE_TOKEN, useClass: IPCClientMockService },
        { provide: IPC_SERVER_SERVICE_TOKEN, useValue: null },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.BACKGROUND },
        { provide: STORE_SERVICE_TOKEN, useClass: StoreMockService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
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
