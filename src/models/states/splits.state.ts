import { Segment, TimingMethod } from '../../models/segment';

export interface SplitsState {
    /**
     * Index of the current segment.
     * Is -1 when the splits are not running.
     */
    current: number;
    /**
     * All segments
     */
    segments: Segment[];
    /**
     * Which timing method should be used for the splits.
     */
    timing: TimingMethod;
    /**
     * The sum of all segment RTA times before the run started.
     * Used to determine if the run was a PB or not.
     */
    previousRTATotal: number;
    /**
     * The sum of all segment IGT times before the run started.
     * Used to determine if the run was a PB or not.
     */
    previousIGTTotal: number;
}
