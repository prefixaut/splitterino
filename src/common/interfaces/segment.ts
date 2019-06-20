import * as SegmentSchema from '../../schemas/segment.schema.json';
import { createValidator, validate } from '../../utils/schemas.js';

const validatorFunction = createValidator(SegmentSchema);

export function isSegment(data: any): data is Segment {
    return validate(data, validatorFunction);
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
     * The time of how long the timer was paused in this segment.
     */
    pauseTime?: number;
    /**
     * Additional pause time for IGT calculations.
     */
    igtPauseTime?: number;
    /**
     * The time of the personal best in milliseconds.
     */
    personalBest?: number;
    /**
     * The time of the overall best in milliseconds.
     */
    overallBest?: number;
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
     * The RTA time of the Segment in milliseconds.
     */
    time?: number;
    /**
     * The IGT time of the Segment in milliseconds.
     */
    inGameTime?: number;
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
    previousOverallBest?: number;
}
