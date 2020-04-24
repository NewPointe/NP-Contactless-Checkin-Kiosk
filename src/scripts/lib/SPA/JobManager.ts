
export interface JobToken {
    isCanceled: boolean;
}

/**
 * Manages a job that wants to be canceled if it triggers itself again.
 * For example: A navigation request which, in the process of loading a new
 * page, triggers another navigation request.
 */
export class JobManager {

    /**
     * Maintains the count of concurrent job executions.
     */
    private concurrentJobCount = 0;

    /**
     * Tracks the currently active Job.
     */
    private currentJob: JobToken | null = null;

    /**
     * Records the start of a job and returns a token that can be used to check
     * if the current job has been canceled. In order to maintain state, this
     * MUST be called at the beginning of the job execution.
     */
    public startJob(): JobToken {
        this.concurrentJobCount++;
        if (this.currentJob) this.currentJob.isCanceled = true;
        return this.currentJob = { isCanceled: false };
    }

    /**
     * Records the end of a job. In order to maintain state, this MUST be
     * called at the end of the job execution - including any exceptions or
     * early returns.
     *
     * It's recommended to wrap your job with a try block to ensure proper
     * state is maintained:
     * ```
     * try { ... } finally { endJob(); }
     * ```
     */
    public endJob(): void {
        this.concurrentJobCount--;
        if (this.concurrentJobCount <= 0) this.reset();
    }

    /**
     * Resets the state of the Job Manager.
     */
    private reset(): void {
        this.concurrentJobCount = 0;
        this.currentJob = null;
    }

}
