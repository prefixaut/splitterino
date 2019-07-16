export enum TimerStatus {
    /**
     * When the Splits are in a _clean_ state.
     * No timer is running and it's currently idle.
     */
    STOPPED = 'stopped',
    /**
     * When the timer is running.
     */
    RUNNING = 'running',
    /**
     * When the timer is running,
     * but the time should not get counted towards the IGT.
     */
    RUNNING_IGT_PAUSE = 'running_igt_pause',
    /**
     * When the timer is paused.
     */
    PAUSED = 'paused',
    /**
     * When the last segment has been finished.
     * This state remains in this until the user splits again which _confirms_
     * the state.
     * On confirmation the content is getting saved, cleaned up and set to
     * {@link STOPPED} again to be able to start a new run.
     */
    FINISHED = 'finished'
}
