import { SplitsStatus } from '@/common/splits-status';

export interface TimerState {
    /**
     * Status of the timer
     */
    status: SplitsStatus;
    /**
     * Start delay for certain runs in ms
     */
    startDelay: number;
    /**
     * Time when the timer started
     */
    startTime: number;
    /**
     * Time when the timer was set to paused state
     */
    pauseStart: number;
    /**
     * Total time in ms on how long the timer was paused
     */
    pauseTotal: number;
    /**
     * Time when the status was changed to finished
     */
    finishTime: number;
}
