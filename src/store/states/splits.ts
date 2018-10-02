import { Segment } from '@/common/segment';
import { SplitsStatus } from '@/common/splits-status';

export interface SplitsState {
    /**
     * Status of the splits/segments
     */
    status: SplitsStatus;
    /**
     * Index of the current segment.
     * Is -1 when the splits are not running.
     */
    current: number;
    /**
     * If there's a new personal best
     */
    hasPersonalBest: boolean;
    /**
     * If there's a new overall best
     */
    hasOverallBest: boolean;
    /**
     * All segments
     */
    segments: Segment[];
}
