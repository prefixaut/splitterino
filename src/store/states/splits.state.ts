import { Segment } from '../../common/interfaces/segment';

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
     * The sum of time of the previous segments.
     * Used to check if a run was a new PB or not.
     * Only calculated when a new run is starting.
     */
    previousSegmentsTotalTime: number;
    /**
     * Currently open .splits file
     */
    currentOpenFile: string;
}
