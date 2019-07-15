import * as SegmentSchema from '../../schemas/segment.schema.json';
import { createValidator, validate } from '../../utils/schemas';
import { asCleanNumber } from '../../utils/converters';

const validatorFunction = createValidator(SegmentSchema);

export function isSegment(data: any): data is Segment {
    return validate(data, validatorFunction);
}

export function getFinalTime(time: DetailedTime): number {
    return time == null ? 0 : Math.max(
        Math.max(asCleanNumber(time.rawTime), 0) - Math.max(asCleanNumber(time.pauseTime), 0),
        0);
}

export { SegmentSchema };
export { validatorFunction as SegmentValidator };

/**
 * Defines a single Segment in a Split.
 * Contains all basic information need to calculate
 * and save the times.
 */
export interface Segment {
    /**
     * ID of the segment to identify it.
     * Format is a UUID (v4).
     */
    id: string;
    /**
     * Display-Name of the Segment.
     */
    name: string;
    /**
     * The time of the personal best in milliseconds.
     */
    personalBest?: SegmentTime;
    /**
     * The time of the overall best in milliseconds.
     */
    overallBest?: SegmentTime;
    /**
     * If the Segment has been passed successfully.
     * Usually the opposite of `skipped`.
     */
    passed?: boolean;
    /**
     * If the Segment has been skipped.
     * Usually the opposite of `passed`.
     */
    skipped?: boolean;

    /*
     * Internal properties used for calculations and to keep
     * track of the segment state.
     */

    /**
     * The time of the current Segment.
     */
    currentTime?: SegmentTime;
    /**
     * Internal timestamp when the segment started.
     */
    startTime?: number;
    /**
     * If the currently set overall best has been overridden
     * and can be reverted from {@link previousOverallBest}.
     */
    hasNewOverallBest?: boolean;
    /**
     * Backup of the overall best for when the segment is
     * getting resetted and should revert the content.
     */
    previousOverallBest?: SegmentTime;
}

export interface SegmentTime {
    igt: DetailedTime;
    rta: DetailedTime;
}

export interface DetailedTime {
    rawTime: number;
    pauseTime: number;
}

export enum TimingMethod {
    /** Real-Time Attack */
    RTA = 'rta',
    /** In Game Time */
    IGT = 'igt',
}
