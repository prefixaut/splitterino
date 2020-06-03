/* eslint-disable no-unused-expressions,id-blacklist */
import { expect } from 'chai';
import { merge } from 'lodash';

import { TimerStatus } from '../../../src/common/timer-status';
import { ACTION_SERVICE_TOKEN, STORE_SERVICE_TOKEN } from '../../../src/models/services';
import { Region, Segment } from '../../../src/models/splits';
import { RootState } from '../../../src/models/states/root.state';
import { getContextMenuStoreModule } from '../../../src/store/modules/context-menu.module';
import { getGameInfoStoreModule } from '../../../src/store/modules/game-info.module';
import { getKeybindingsStoreModule } from '../../../src/store/modules/keybindings.module';
import { getMetaStoreModule, HANDLER_ADD_OPENED_SPLITS_FILE } from '../../../src/store/modules/meta.module';
import { getSettingsStoreModule } from '../../../src/store/modules/settings.module';
import {
    getSplitsStoreModule,
    HANDLER_SET_CURRENT,
    HANDLER_SET_PREVIOUS_IGT_TIME,
    HANDLER_SET_PREVIOUS_RTA_TIME,
    HANDLER_SET_SEGMENT,
} from '../../../src/store/modules/splits.module';
import { getTimerStoreModule, HANDLER_SET_STATUS } from '../../../src/store/modules/timer.module';
import { createCommit } from '../../../src/utils/store';
import { getTotalTime, now } from '../../../src/utils/time';
import { ActionMockService } from '../../mocks/action-mock.service';
import { StoreMockService } from '../../mocks/store-mock.service';
import { createMockInjector, generateSegmentArray, randomInt } from '../../utils';

describe('Action-Service', () => {
    const injector = createMockInjector();
    const service = injector.get(ACTION_SERVICE_TOKEN) as ActionMockService;
    const store = injector.get(STORE_SERVICE_TOKEN) as StoreMockService;

    beforeEach(() => {
        store.history = [];
        service.callStack = [];

        // Resetting the entire state to a clean one
        const newState = {
            splitterino: {},
        } as RootState;

        Object.entries({
            contextMenu: getContextMenuStoreModule(),
            gameInfo: getGameInfoStoreModule(),
            keybindings: getKeybindingsStoreModule(),
            settings: getSettingsStoreModule(injector),
            splits: getSplitsStoreModule(injector),
            timer: getTimerStoreModule(),
            meta: getMetaStoreModule(),
        }).forEach(([moduleName, storeModule]) => {
            newState.splitterino[moduleName] = storeModule.initialize();
        });

        store.state = newState;
    });

    describe('addOpenedSplitsFile', () => {
        it('should call the commit with the proper values', async () => {
            const path = '/home/testuser/whatever/super-mario-64.splits';
            const meta = {
                category: '70 stars',
                name: 'super-mario-64',
                platform: 'n64',
                region: Region.NTSC_JPN,
            };
            store.state.splitterino.gameInfo = {
                ...store.state.splitterino.gameInfo,
                ...meta,
            };

            await service.addOpenedSplitsFile(path);

            expect(store.history).to.deep.equal([
                createCommit(HANDLER_ADD_OPENED_SPLITS_FILE, {
                    path,
                    category: meta.category,
                    gameName: meta.name,
                    platform: meta.platform,
                    region: meta.region,
                }),
            ]);
            expect(service.callStack).to.be.have.lengthOf(1);
        });
    });

    describe('startTimer', () => {
        it('should not start the timer when it is not stopped yet', async () => {
            const statuses = [
                TimerStatus.FINISHED,
                TimerStatus.PAUSED,
                TimerStatus.RUNNING,
                TimerStatus.RUNNING_IGT_PAUSE,
            ];

            for (const status of statuses) {
                store.state.splitterino.timer.status = status;
                const result = await service.startTimer();
                expect(result).to.equal(false);
            }
            expect(service.callStack).to.be.have.lengthOf(statuses.length);
        });

        it('should not start the timer when the splits dont have segments', async () => {
            const result = await service.startTimer();
            expect(result).to.equal(false);
            expect(service.callStack).to.be.have.lengthOf(1);
        });

        it('should start the timer correctly with provided time', async () => {
            const segments = generateSegmentArray(5);
            const { igtPersonalBest, rtaPersonalBest } = getTotalTime(segments);

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.STOPPED,
                },
                splits: {
                    segments,
                }
            });

            const time = now();
            await service.startTimer(time);

            expect(store.history).to.deep.equal([
                createCommit(HANDLER_SET_PREVIOUS_RTA_TIME, rtaPersonalBest),
                createCommit(HANDLER_SET_PREVIOUS_IGT_TIME, igtPersonalBest),
                createCommit(HANDLER_SET_SEGMENT, {
                    index: 0,
                    segment: {
                        ...segments[0],
                        startTime: time,
                    }
                }),
                createCommit(HANDLER_SET_CURRENT, 0),
                createCommit(HANDLER_SET_STATUS, {
                    time,
                    status: TimerStatus.RUNNING
                }),
            ]);
            expect(service.callStack).to.be.have.lengthOf(1);
        });

        it('should start the timer within acceptable range', async () => {
            const segments = generateSegmentArray(5);

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.STOPPED,
                },
                splits: {
                    segments,
                }
            });

            const time = now();
            await service.startTimer();

            const updatedSegment = store.history[2];
            const updatedTimerStatus = store.history[4];

            expect(updatedSegment.data.segment.startTime).to.be.within(time, time + 2);
            expect(updatedTimerStatus.data.time).to.be.within(time, time + 2);
            expect(service.callStack).to.be.have.lengthOf(1);
        });
    });

    describe('splitTimer', () => {
        it('should reset the timer when the status is finished', async () => {
            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.FINISHED,
                },
            });

            await service.splitTimer();

            expect(service.callStack).to.deep.equal([
                {
                    function: 'splitTimer',
                    args: [undefined]
                },
                {
                    function: 'resetTimer',
                    args: [undefined],
                },
                {
                    function: 'savingReset',
                    args: []
                }
            ]);
        });

        it('should not do anything when the status is not running', async () => {
            const segments = generateSegmentArray(5);
            const currentIndex = 2;
            const invalidStatuses = [
                TimerStatus.PAUSED,
                TimerStatus.RUNNING_IGT_PAUSE,
                TimerStatus.STOPPED,
            ];

            // Prepare the state
            merge(store.state.splitterino, {
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            for (const status of invalidStatuses) {
                store.state.splitterino.timer.status = status;
                const result = await service.splitTimer();
                expect(result).to.equal(false);
            }
            expect(service.callStack).to.be.have.lengthOf(invalidStatuses.length);
        });

        it('should split to the next segment', async () => {
            const time = now();
            const segments = generateSegmentArray(5);
            const currentIndex = 2;
            const segmentTime = randomInt(25_000, 10_000);
            const startTime = time - segmentTime;

            const currentSegment: Segment = {
                id: segments[currentIndex].id,
                name: 'sample',
                startTime,
            };

            segments[currentIndex] = currentSegment;

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            await service.splitTimer(time);

            expect(store.history).to.deep.equal([
                createCommit(HANDLER_SET_SEGMENT, {
                    index: currentIndex,
                    segment: {
                        ...currentSegment,
                        currentTime: {
                            rta: { rawTime: segmentTime, pauseTime: 0 },
                            igt: { rawTime: segmentTime, pauseTime: 0 },
                        },
                        overallBest: {
                            rta: { rawTime: segmentTime, pauseTime: 0 },
                            igt: { rawTime: segmentTime, pauseTime: 0 },
                        },
                        previousOverallBest: undefined,
                        hasNewOverallBest: true,
                        passed: true,
                        skipped: false,
                    },
                }),
                createCommit(HANDLER_SET_SEGMENT, {
                    index: currentIndex + 1,
                    segment: {
                        ...segments[currentIndex + 1],
                        startTime: time,
                        currentTime: null,
                        passed: false,
                        skipped: false,
                    }
                }),
                createCommit(HANDLER_SET_CURRENT, currentIndex + 1),
            ]);
            expect(service.callStack).to.be.have.lengthOf(1);
        });

        it('should set the new overallBest properly', async () => {
            const time = now();
            const segments = generateSegmentArray(5);
            const currentIndex = 2;
            const segmentTime = randomInt(25_000, 10_000);
            const overallBestTime = segmentTime + randomInt(500, 50_000);
            const startTime = time - segmentTime;

            const currentSegment: Segment = {
                id: segments[currentIndex].id,
                name: 'sample',
                startTime,
                overallBest: {
                    rta: { rawTime: overallBestTime, pauseTime: 0 },
                    igt: { rawTime: overallBestTime, pauseTime: 0 },
                },
            };

            segments[currentIndex] = currentSegment;

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            await service.splitTimer(time);

            expect(store.history[0]).to.deep.equal(createCommit(HANDLER_SET_SEGMENT, {
                index: currentIndex,
                segment: {
                    ...currentSegment,
                    currentTime: {
                        rta: { rawTime: segmentTime, pauseTime: 0 },
                        igt: { rawTime: segmentTime, pauseTime: 0 },
                    },
                    overallBest: {
                        rta: { rawTime: segmentTime, pauseTime: 0 },
                        igt: { rawTime: segmentTime, pauseTime: 0 },
                    },
                    previousOverallBest: {
                        rta: { rawTime: overallBestTime, pauseTime: 0 },
                        igt: { rawTime: overallBestTime, pauseTime: 0 },
                    },
                    hasNewOverallBest: true,
                    passed: true,
                    skipped: false,
                },
            }));
            expect(service.callStack).to.be.have.lengthOf(1);
        });

        it('should not set the overall best when it is not faster', async () => {
            const time = now();
            const segments = generateSegmentArray(5);
            const currentIndex = 2;
            const segmentTime = randomInt(25_000, 10_000);
            const overallBestTime = segmentTime - randomInt(5_000, 500);
            const startTime = time - segmentTime;

            const currentSegment: Segment = {
                id: segments[currentIndex].id,
                name: 'sample',
                startTime,
                overallBest: {
                    rta: { rawTime: overallBestTime, pauseTime: 0 },
                    igt: { rawTime: overallBestTime, pauseTime: 0 },
                },
            };

            segments[currentIndex] = currentSegment;

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            await service.splitTimer(time);

            expect(store.history[0]).to.deep.equal(createCommit(HANDLER_SET_SEGMENT, {
                index: currentIndex,
                segment: {
                    ...currentSegment,
                    currentTime: {
                        rta: { rawTime: segmentTime, pauseTime: 0 },
                        igt: { rawTime: segmentTime, pauseTime: 0 },
                    },
                    overallBest: {
                        rta: { rawTime: overallBestTime, pauseTime: 0 },
                        igt: { rawTime: overallBestTime, pauseTime: 0 },
                    },
                    previousOverallBest: null,
                    hasNewOverallBest: false,
                    passed: true,
                    skipped: false,
                },
            }));
            expect(service.callStack).to.be.have.lengthOf(1);
        });

        it('should only override the rawTime of the currentTime when present', async () => {
            const time = now();
            const segments = generateSegmentArray(5);
            const currentIndex = 2;
            const segmentTime = randomInt(25_000, 10_000);
            const previousSegmentTime = randomInt(50_000, 20_000);
            const previousSegmentPause = randomInt(1_000, 1);
            const startTime = time - segmentTime;

            const currentSegment: Segment = {
                id: segments[currentIndex].id,
                name: 'sample',
                startTime,
                currentTime: {
                    rta: { rawTime: previousSegmentTime, pauseTime: previousSegmentPause },
                    igt: { rawTime: previousSegmentTime, pauseTime: previousSegmentPause },
                }
            };

            segments[currentIndex] = currentSegment;

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            await service.splitTimer(time);

            expect(store.history[0]).to.deep.equal(createCommit(HANDLER_SET_SEGMENT, {
                index: currentIndex,
                segment: {
                    ...currentSegment,
                    currentTime: {
                        rta: { rawTime: segmentTime, pauseTime: previousSegmentPause },
                        igt: { rawTime: segmentTime, pauseTime: previousSegmentPause },
                    },
                    overallBest: {
                        rta: { rawTime: segmentTime, pauseTime: previousSegmentPause },
                        igt: { rawTime: segmentTime, pauseTime: previousSegmentPause },
                    },
                    previousOverallBest: undefined,
                    hasNewOverallBest: true,
                    passed: true,
                    skipped: false,
                },
            }));
            expect(service.callStack).to.be.have.lengthOf(1);
        });

        it('should set the timer to finished if it is the last split', async () => {
            const time = now();
            const segments = generateSegmentArray(5);
            const currentIndex = 4;
            const segmentTime = randomInt(25_000, 10_000);
            const startTime = time - segmentTime;

            const currentSegment: Segment = {
                id: segments[currentIndex].id,
                name: 'sample',
                startTime,
            };

            segments[currentIndex] = currentSegment;

            // Prepare the state
            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            await service.splitTimer(time);

            expect(store.history).to.deep.equal([
                createCommit(HANDLER_SET_SEGMENT, {
                    index: currentIndex,
                    segment: {
                        ...currentSegment,
                        currentTime: {
                            rta: { rawTime: segmentTime, pauseTime: 0 },
                            igt: { rawTime: segmentTime, pauseTime: 0 },
                        },
                        overallBest: {
                            rta: { rawTime: segmentTime, pauseTime: 0 },
                            igt: { rawTime: segmentTime, pauseTime: 0 },
                        },
                        previousOverallBest: undefined,
                        hasNewOverallBest: true,
                        passed: true,
                        skipped: false,
                    },
                }),
                createCommit(HANDLER_SET_STATUS, TimerStatus.FINISHED),
            ]);
            expect(service.callStack).to.be.have.lengthOf(1);
        });
    });

    describe('skipSplit', () => {
        it('should not skip it when the status is not running', async () => {
            const invalidStatuses = [
                TimerStatus.FINISHED,
                TimerStatus.PAUSED,
                TimerStatus.RUNNING_IGT_PAUSE,
                TimerStatus.STOPPED,
            ];

            for (const status of invalidStatuses) {
                store.state.splitterino.timer.status = status;
                const result = await service.skipSplit();
                expect(result).to.equal(false);
            }
            expect(service.callStack).to.have.lengthOf(invalidStatuses.length);
        });

        it('should not skip it when it is the last split', async () => {
            const segments = generateSegmentArray(5);

            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: 4,
                }
            });

            const result = await service.skipSplit();
            expect(result).to.equal(false);
            expect(service.callStack).to.have.lengthOf(1);
        });

        it('should skip the segment correctly', async () => {
            const segments = generateSegmentArray(5);
            const currentIndex = 2;

            merge(store.state.splitterino, {
                timer: {
                    status: TimerStatus.RUNNING,
                },
                splits: {
                    segments,
                    current: currentIndex,
                }
            });

            const result = await service.skipSplit();

            expect(result).to.equal(true);
            expect(service.callStack).to.have.lengthOf(1);
            expect(store.history).to.deep.equal([
                createCommit(HANDLER_SET_SEGMENT, {
                    index: currentIndex,
                    segment: {
                        ...segments[currentIndex],
                        skipped: true,
                        passed: false,
                        currentTime: {
                            rta: {
                                rawTime: 0,
                                pauseTime: segments[currentIndex].currentTime.rta.pauseTime,
                            },
                            igt: {
                                rawTime: 0,
                                pauseTime: segments[currentIndex].currentTime.igt.pauseTime,
                            },
                        },
                    },
                }),
                createCommit(HANDLER_SET_CURRENT, currentIndex + 1),
            ]);
        });
    });
});
