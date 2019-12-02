import { Time } from 'aevum';

import { DetailedTime } from '../models/segment';
import { asCleanNumber } from './converters';

export function now() {
    return new Date().getTime();
}

export function timeToTimestamp(time: Time) {
    let total = 0;
    total += time.milliseconds % 1000;
    total += (time.seconds % 59) * 1000;
    total += (time.minutes % 59) * 60000;
    total += time.hours * 3600000;

    return total;
}

export function getFinalTime(time: DetailedTime): number {
    return time == null ? 0 : Math.max(
        Math.max(asCleanNumber(time.rawTime), 0) - Math.max(asCleanNumber(time.pauseTime), 0),
        0);
}
