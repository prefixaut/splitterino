import { Injectable, InjectionToken } from 'lightweight-di';
import { v4 as uuid } from 'uuid';

import { Run, RunRef, SegmentRef as LiveSplitSegment, TimeRef, TimeSpanRef } from '../../wasm/livesplit-core';
import { LiveSplitCoreInterface } from '../models/livesplit-core';
import { DetailedTime, Segment, SegmentTime, TimingMethod } from '../models/segment';
import { Splits } from '../models/splits';
import { Region } from '../models/states/game-info.state';
import { Logger } from '../utils/logger';

export const LIVESPLIT_CORE_SERVICE_TOKEN = new InjectionToken<LiveSplitCoreInterface>('livesplit-core');

@Injectable
export class LiveSplitCoreService implements LiveSplitCoreInterface {
    public loadSplitsViaLiveSplit(filePath: string, loadedFile: string): false | Splits {
        const parsedRun = Run.parseString(loadedFile, filePath, true);
        if (parsedRun == null || !parsedRun.parsedSuccessfully()) {
            Logger.error('Could not parse the splits!');

            return false;
        }
        const run = parsedRun.unwrap();
        const loadedSplits = this.liveSplitRunToSplits(run);

        return loadedSplits;
    }

    private liveSplitRunToSplits(run: RunRef): Splits {
        const segments: Segment[] = [];
        for (let i = 0; i < run.len(); i++) {
            segments.push(this.liveSplitSegmentToSegment(run.segment(i)));
        }

        return {
            game: {
                name: run.gameName(),
                category: run.categoryName(),
                platform: run.metadata().platformName(),
                region: run.metadata().regionName() as Region,
            },
            timing: TimingMethod.RTA,
            segments,
        };
    }

    private liveSplitSegmentToSegment(segment: LiveSplitSegment): Segment {
        return {
            id: uuid(),
            name: segment.name(),
            personalBest: this.liveSplitTimeToSegmentTime(segment.personalBestSplitTime()),
            overallBest: this.liveSplitTimeToSegmentTime(segment.bestSegmentTime()),
            currentTime: null,
            passed: false,
            skipped: false,
            startTime: -1,
            hasNewOverallBest: false,
            previousOverallBest: null,
        };
    }

    private liveSplitTimeToSegmentTime(time: TimeRef): SegmentTime {
        if (time == null) {
            return {
                rta: this.liveSplitTimeSpanToDetailedTime(null),
                igt: this.liveSplitTimeSpanToDetailedTime(null),
            };
        } else {
            return {
                rta: this.liveSplitTimeSpanToDetailedTime(time.realTime()),
                igt: this.liveSplitTimeSpanToDetailedTime(time.gameTime()),
            };
        }
    }

    private liveSplitTimeSpanToDetailedTime(timeSpan: TimeSpanRef): DetailedTime {
        if (timeSpan == null) {
            return { pauseTime: 0, rawTime: 0 };
        } else {
            return { pauseTime: 0, rawTime: timeSpan.totalSeconds() * 1000 };
        }
    }
}
