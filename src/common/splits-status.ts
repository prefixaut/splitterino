export enum SplitsStatus {
    /**
     * When the Splits are in a _clean_ state.
     * No timer is running and it's currently idle.
     */
    STOPPED = 'stopped',
    /**
     * When the timer is running
     */
    RUNNING = 'running',
    /**
     * When the user/script paused the timer
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
