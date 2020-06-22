import { Injector } from 'lightweight-di';
import uuid from 'uuid/v4';

import {
    ACTION_SERVICE_TOKEN,
    ELECTRON_SERVICE_TOKEN,
    IO_SERVICE_TOKEN,
    IPC_CLIENT_SERVICE_TOKEN,
    IPC_SERVER_SERVICE_TOKEN,
    RUNTIME_ENVIRONMENT_TOKEN,
    RuntimeEnvironment,
    STORE_SERVICE_TOKEN,
    TRANSFORMER_SERVICE_TOKEN,
    VALIDATOR_SERVICE_TOKEN,
} from '../src/common/constants';
import { Segment, SegmentTime } from '../src/models/splits';
import { ActionService } from '../src/services/action.service';
import { IOService } from '../src/services/io.service';
import { ReceiverStoreService } from '../src/services/receiver-store.service';
import { ServerStoreService } from '../src/services/server-store.service';
import { TransformerService } from '../src/services/transfromer.service';
import { ValidatorService } from '../src/services/validator.service';
import { now } from '../src/utils/time';
import { ActionMockService } from './mocks/action-mock.service';
import { ElectronMockService } from './mocks/electron-mock.service';
import { IPCClientMockService } from './mocks/ipc-client-mock.service';
import { StoreMockService } from './mocks/store-mock.service';

// Initialize the Dependency-Injection
export function createMockInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionMockService },
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

export function createPluginTestInjector(): Injector {
    return Injector.resolveAndCreate([
        // Overrides/custom providers
        { provide: ACTION_SERVICE_TOKEN, useClass: ActionService },
        { provide: ELECTRON_SERVICE_TOKEN, useClass: ElectronMockService },
        { provide: IO_SERVICE_TOKEN, useClass: IOService },
        { provide: IPC_CLIENT_SERVICE_TOKEN, useValue: ReceiverStoreService },
        { provide: IPC_SERVER_SERVICE_TOKEN, useValue: null },
        { provide: RUNTIME_ENVIRONMENT_TOKEN, useValue: RuntimeEnvironment.PLUGIN },
        { provide: STORE_SERVICE_TOKEN, useClass: ServerStoreService },
        { provide: TRANSFORMER_SERVICE_TOKEN, useClass: TransformerService },
        { provide: VALIDATOR_SERVICE_TOKEN, useClass: ValidatorService },
    ]);
}

export function randomInt(max: number, min: number = 1): number {
    return Math.max(min, Math.floor(Math.random() * Math.floor(max)));
}

export function wait(timeout: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), timeout);
    });
}

export function generateRandomTime(): SegmentTime {
    const rawTime = randomInt(99999, 100);
    const pauseTime = randomInt(rawTime - 1, 1);

    return {
        igt: {
            rawTime,
            pauseTime,
        },
        rta: {
            rawTime,
            pauseTime,
        }
    };
}

export function generateSegmentArray(size: number): Segment[] {
    return new Array(size).fill(null).map(() => {
        return {
            id: uuid(),
            name: 'test',
            currentTime: generateRandomTime(),
            hasNewOverallBest: true,
            overallBest: generateRandomTime(),
            passed: true,
            personalBest: generateRandomTime(),
            previousOverallBest: generateRandomTime(),
            skipped: false,
            startTime: now(),
        };
    });
}
