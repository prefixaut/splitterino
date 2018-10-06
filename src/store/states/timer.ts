import { TimerStatus } from '@/common/timer-status';

export interface TimerState {
    /**
     * State of the timer
     */
    status: TimerStatus;
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
    pauseTime: number;
    /**
     * Total time in ms on how long the timer was paused
     */
    pauseTotal: number;
    /**
     * Time when the status was changed to finished
     */
    finishTime: number;
}
