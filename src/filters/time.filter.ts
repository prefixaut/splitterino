import { SegmentTime, TimingMethod } from '../models/segment';
import { getFinalTime } from '../utils/time';

export function timeFilter(value: SegmentTime, timing: TimingMethod = TimingMethod.RTA) {
    return value == null || value[timing] == null ? null : getFinalTime(value[timing]);
}
