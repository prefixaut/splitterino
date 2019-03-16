import * as SegmentSchema from '../schemas/segment.schema.json';
import { createValidator, validate } from '../utils/validate-schema.js';

const validatorFunction = createValidator(SegmentSchema);

export function isSegment(data: any): data is Segment {
    return validate(data, validatorFunction);
}

export { SegmentSchema };
export { validatorFunction as SegmentValidator };

export interface Segment {
    /** ID of the segment to identify it. Format is a UUID */
    id: string;
    /**
     * Display-Name of the Segment
     */
    name: string;
    /**
     * The time of the Segment in milliseconds
     */
    time?: number;
    /**
     * The time of how long the timer was paused in this segment
     */
    pauseTime?: number;
    /**
     * The time of the personal best in milliseconds
     */
    personalBest?: number;
    /**
     * The time of the overall best in milliseconds
     */
    overallBest?: number;
    /**
     * If the Segment has been passed successfully
     */
    passed?: boolean;
    /**
     * If the Segment has been skipped
     */
    skipped?: boolean;

    /*
     * Internal properties used for calculations and to keep
     * track of the segment state.
     */

    /**
     * Internal timestamp when the segment started.
     */
    startTime?: number;
    /**
     * If the currently set personal best has been overridden
     * and can be reverted from {@link previousPersonalBest}.
     */
    hasNewPersonalBest?: boolean;
    /**
     * Backup of the personal best for when the segment is
     * getting resetted and should revert the content.
     */
    previousPersonalBest?: number;
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
