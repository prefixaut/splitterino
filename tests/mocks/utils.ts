import { Injector } from 'lightweight-di';
import { Action, Commit, Dispatch } from 'vuex';

import { ELECTRON_INTERFACE_TOKEN } from '../../src/common/interfaces/electron-interface';
import { IOService } from '../../src/services/io.service';
import { ElectronMockService } from './electron-mock.service';

// Initialize the Dependency-Injection
export function createMockInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ELECTRON_INTERFACE_TOKEN, useClass: ElectronMockService },

        // Simple providers
        IOService,
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

export async function testAction<S, R>(
    action: Action<S, R>,
    context: MockedActionContextState<S, R>,
    payload?: any,
) {
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
    const response = await (action as MockedAction<S, R>)({
        ...context,
        commit,
        dispatch,
    }, payload);

    return {
        commits,
        dispatches,
        response,
    };
}
