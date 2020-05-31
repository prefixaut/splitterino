import { Inject, Injectable } from 'lightweight-di';
import { cloneDeep } from 'lodash';

import { TimerStatus } from '../common/timer-status';
import {
    ActionServiceInterface,
    ELECTRON_SERVICE_TOKEN,
    ElectronServiceInterface,
    STORE_SERVICE_TOKEN,
    StoreInterface,
} from '../models/services';
import { Segment, TimingMethod } from '../models/splits';
import { RecentlyOpenedSplit } from '../models/states/meta.state';
import { RootState } from '../models/states/root.state';
import { HANDLER_ADD_OPENED_SPLITS_FILE } from '../store/modules/meta.module';
import {
    HANDLER_DISCARDING_RESET,
    HANDLER_SAVING_RESET,
    HANDLER_SET_CURRENT,
    HANDLER_SET_PREVIOUS_IGT_TIME,
    HANDLER_SET_PREVIOUS_RTA_TIME,
    HANDLER_SET_SEGMENT,
} from '../store/modules/splits.module';
import { HANDLER_SET_STATUS } from '../store/modules/timer.module';
import { getTotalTime, now } from '../utils/time';

@Injectable
export class ActionService implements ActionServiceInterface {

    constructor(
        @Inject(ELECTRON_SERVICE_TOKEN) private electron: ElectronServiceInterface,
        @Inject(STORE_SERVICE_TOKEN) private store: StoreInterface<RootState>
    ) { }

    public async addOpenedSplitsFile(filePath: string): Promise<boolean> {
        const gameInfoState = this.store.state.splitterino.gameInfo;

        const recentlyOpenedSplit: RecentlyOpenedSplit = {
            path: filePath,
            category: gameInfoState.category,
            gameName: gameInfoState.name,
            platform: gameInfoState.platform,
            region: gameInfoState.region
        };

        return this.store.commit(HANDLER_ADD_OPENED_SPLITS_FILE, recentlyOpenedSplit);
    }

    public async startTimer(time: number = now()): Promise<boolean> {
        const status = this.store.state.splitterino.timer.status;

        if (status !== TimerStatus.STOPPED || this.store.state.splitterino.splits.segments.length < 1) {
            return false;
        }

        const commits: Promise<any>[] = [];
        const { rtaPersonalBest, igtPersonalBest } = getTotalTime(this.store.state.splitterino.splits.segments);

        commits.push(this.store.commit(HANDLER_SET_PREVIOUS_RTA_TIME, rtaPersonalBest));
        commits.push(this.store.commit(HANDLER_SET_PREVIOUS_IGT_TIME, igtPersonalBest));

        const firstSegment = this.store.state.splitterino.splits.segments[0];

        commits.push(this.store.commit(HANDLER_SET_SEGMENT, {
            index: 0,
            segment: {
                ...firstSegment,
                startTime: time
            }
        }));
        commits.push(this.store.commit(HANDLER_SET_CURRENT, 0));
        commits.push(this.store.commit(
            HANDLER_SET_STATUS,
            { time, status: TimerStatus.RUNNING }
        ));

        return Promise.all(commits).then(() => true);
    }

    public async splitTimer(time: number = now()): Promise<boolean> {
        const { timer: timerState, splits: splitsState } = this.store.state.splitterino;
        const currentStatus = timerState.status;

        switch (currentStatus) {
            case TimerStatus.FINISHED:
                // Cleanup via reset
                return this.resetTimer();
            case TimerStatus.RUNNING:
                break;
            default:
                // Ignore the split-event when it's not running
                return Promise.resolve(false);
        }

        const { current: currentIndex, segments, timing } = splitsState;

        // Get the segment and spread it to create a copy to be able
        // to modify it.
        const currentSegment: Segment = cloneDeep(segments[currentIndex]);
        const rawTime = time - currentSegment.startTime;

        if (currentSegment.currentTime == null) {
            currentSegment.currentTime = {
                rta: { rawTime: rawTime, pauseTime: 0 },
                igt: { rawTime: rawTime, pauseTime: 0 },
            };
        } else {
            currentSegment.currentTime.rta.rawTime = rawTime;
            currentSegment.currentTime.igt.rawTime = rawTime;
        }

        currentSegment.passed = true;
        currentSegment.skipped = false;

        if (
            currentSegment.overallBest == null ||
            currentSegment.overallBest[timing] == null ||
            currentSegment.overallBest[timing].rawTime === 0 ||
            currentSegment.overallBest[timing].rawTime > rawTime
        ) {
            // Backup of the previous time to be able to revert it
            currentSegment.previousOverallBest = currentSegment.overallBest;
            currentSegment.overallBest = currentSegment.currentTime;
            currentSegment.hasNewOverallBest = true;
        } else {
            currentSegment.hasNewOverallBest = false;
            currentSegment.previousOverallBest = null;
        }

        this.store.commit(HANDLER_SET_SEGMENT, {
            index: currentIndex,
            segment: currentSegment
        });

        // Check if it is the last split
        if (currentIndex + 1 >= splitsState.segments.length) {
            await this.store.commit(HANDLER_SET_STATUS, TimerStatus.FINISHED);

            return true;
        }

        const next: Segment = {
            ...cloneDeep(splitsState.segments[currentIndex + 1]),
            startTime: time,
            currentTime: null,
            passed: false,
            skipped: false
        };

        await this.store.commit(HANDLER_SET_SEGMENT, {
            index: currentIndex + 1,
            segment: next
        });
        await this.store.commit(HANDLER_SET_CURRENT, currentIndex + 1);

        return true;
    }

    public async skipSplit(): Promise<boolean> {
        const status = this.store.state.splitterino.timer.status;
        const { current: index, segments } = this.store.state.splitterino.splits;

        if (
            status !== TimerStatus.RUNNING ||
            index >= segments.length - 1
        ) {
            return false;
        }

        const segment: Segment = {
            ...cloneDeep(segments[index]),
            // Only reset the raw-time
            currentTime: segments[index].currentTime != null ? {
                rta: {
                    rawTime: 0,
                    pauseTime: segments[index].currentTime.rta.pauseTime,
                },
                igt: {
                    rawTime: 0,
                    pauseTime: segments[index].currentTime.igt.pauseTime,
                },
            } : null,
            skipped: true,
            passed: false
        };

        await this.store.commit(HANDLER_SET_SEGMENT, { index, segment });
        await this.store.commit(HANDLER_SET_CURRENT, index + 1);

        return true;
    }

    public async revertSplit(): Promise<boolean> {
        const status = this.store.state.splitterino.timer.status;
        const { current: index, segments } = this.store.state.splitterino.splits;

        if (status !== TimerStatus.RUNNING || index < 1) {
            return Promise.resolve(false);
        }

        const segment: Segment = {
            ...cloneDeep(segments[index]),
            startTime: -1,
            passed: false,
            skipped: false
        };

        // Revert OB
        if (segment.hasNewOverallBest) {
            segment.overallBest = segment.previousOverallBest;
            segment.hasNewOverallBest = false;
        }
        segment.previousOverallBest = null;

        const previous: Segment = cloneDeep(segments[index - 1]);

        if (segment.currentTime != null) {
            if (!previous.passed || previous.currentTime == null) {
                previous.currentTime = segments[index].currentTime;
            } else {
                [TimingMethod.RTA, TimingMethod.IGT].forEach(timing => {
                    if (previous.currentTime[timing] == null) {
                        previous.currentTime[timing] = segment.currentTime[timing];
                    } else {
                        previous.currentTime[timing].pauseTime += segment.currentTime[timing].pauseTime;
                    }
                });
            }
        }

        // Mark the previous segment as neither passed or skipped
        previous.passed = false;
        previous.skipped = false;

        // Remove the currentTime from the segment now
        segment.currentTime = null;

        await this.store.commit(HANDLER_SET_SEGMENT, { index, segment });
        await this.store.commit(HANDLER_SET_SEGMENT, { index: index - 1, segment: previous });
        await this.store.commit(HANDLER_SET_CURRENT, index - 1);

        return true;
    }

    public async pauseTimer(igtOnly: boolean = false, time: number = now()): Promise<boolean> {
        const status = this.store.state.splitterino.timer.status;

        if (igtOnly ? (
            status === TimerStatus.RUNNING_IGT_PAUSE ||
            status !== TimerStatus.RUNNING
        ) : status !== TimerStatus.RUNNING) {
            return false;
        }

        let toStatus = TimerStatus.PAUSED;
        if (igtOnly) {
            toStatus = TimerStatus.RUNNING_IGT_PAUSE;
        }

        await this.store.commit(
            HANDLER_SET_STATUS,
            { time, status: toStatus }
        );

        return true;
    }

    public async unpauseTimer(igtOnly: boolean = false, time: number = now()): Promise<boolean> {
        const { timer: timerState, splits: splitsState } = this.store.state.splitterino;
        const status = timerState.status;

        if (igtOnly ? status !== TimerStatus.RUNNING_IGT_PAUSE : status !== TimerStatus.PAUSED) {
            return false;
        }

        const index = splitsState.current;
        // Create a copy of the segment so it can be safely edited
        const segment: Segment = cloneDeep(splitsState.segments[index]);

        if (segment.currentTime == null) {
            segment.currentTime = {
                rta: { rawTime: 0, pauseTime: 0 },
                igt: { rawTime: 0, pauseTime: 0 },
            };
        }

        if (!igtOnly) {
            const pauseAddition = time - timerState.pauseTime;
            if (segment.currentTime.rta == null) {
                segment.currentTime.rta = { rawTime: 0, pauseTime: 0 };
            }
            segment.currentTime.rta.pauseTime += pauseAddition;
        }

        const igtPauseAddition = time - timerState.igtPauseTime;
        if (segment.currentTime.igt == null) {
            segment.currentTime.igt = { rawTime: 0, pauseTime: 0 };
        }
        segment.currentTime.igt.pauseTime += igtPauseAddition;

        await this.store.commit(HANDLER_SET_SEGMENT, { index, segment });
        await this.store.commit(HANDLER_SET_STATUS, {
            time,
            status: TimerStatus.RUNNING
        });

        return true;
    }

    public async resetTimer(windowId?: number): Promise<boolean> {
        const status = this.store.state.splitterino.timer.status;
        const { previousIGTTotal, previousRTATotal, segments, timing } = this.store.state.splitterino.splits;

        // When the Timer is already stopped, nothing to do
        if (status === TimerStatus.STOPPED) {
            return true;
        }

        const previousRTAPB = Math.max(0, previousRTATotal);
        const previousIGTPB = Math.max(0, previousIGTTotal);
        const { igtCurrent, rtaCurrent } = getTotalTime(segments);

        const isNewRTAPB = previousRTAPB === 0 || (rtaCurrent > 0 && rtaCurrent < previousRTAPB);
        const isNewIGTPB = previousIGTPB === 0 || (igtCurrent > 0 && igtCurrent < previousIGTPB);
        const isNewPersonalBest = timing === TimingMethod.RTA ? isNewRTAPB : isNewIGTPB;
        const isNewOverallBest = segments.findIndex(segment => segment.passed) !== -1;

        // if the time is a new PB or the splits should get saved as
        // the status is finished.
        if (isNewPersonalBest || status === TimerStatus.FINISHED) {
            return this.savingReset();
        }

        // We can safely discard when the run hasn't finished yet and no new OB is set yet
        if (!isNewOverallBest) {
            return this.discardingReset();
        }

        let win = null;

        if (typeof windowId !== 'number' && !isNaN(windowId) && isFinite(windowId)) {
            win = this.electron.getWindowById(windowId);
        }

        return this.electron.showMessageDialog(
            win,
            {
                title: 'Save Splits?',
                message: `
    You're about to reset the timer, but you got some new best times!\n
    Do you wish to save or discard the times?
    `,
                buttons: ['Cancel', 'Discard', 'Save']
            }
        ).then(res => {
            switch (res) {
                case 0:
                    return false;
                case 1:
                    return this.discardingReset();
                case 2:
                    return this.savingReset();
            }
        });
    }

    public async discardingReset(): Promise<boolean> {
        await this.store.commit(HANDLER_SET_STATUS, TimerStatus.STOPPED);
        await this.store.commit(HANDLER_SET_CURRENT, -1);
        await this.store.commit(HANDLER_DISCARDING_RESET);

        return true;
    }

    public async savingReset(): Promise<boolean> {
        await this.store.commit(HANDLER_SET_STATUS, TimerStatus.STOPPED);
        await this.store.commit(HANDLER_SET_CURRENT, -1);
        await this.store.commit(HANDLER_SAVING_RESET);

        return true;
    }
}
