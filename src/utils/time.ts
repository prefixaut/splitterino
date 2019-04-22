import { Time } from 'aevum';

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
