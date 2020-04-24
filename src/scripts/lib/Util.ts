
/**
 * Sleeps for the specified number of milliseconds.
 * @param ms The number of milliseconds to sleep.
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
