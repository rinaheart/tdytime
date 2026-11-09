/**
 * Main-Thread Task Scheduler Utilities — TdyTime v2
 * Provides cooperative yielding (`scheduler.yield` / macrotask fallback)
 * to break up Long Tasks (> 50ms) during initial hydration and indexing.
 */

export const yieldToMain = (): Promise<void> => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
        return Promise.resolve();
    }
    const g = globalThis as unknown as {
        scheduler?: { yield?: () => Promise<void> };
    };
    if (g.scheduler && typeof g.scheduler.yield === 'function') {
        return g.scheduler.yield();
    }
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
};
