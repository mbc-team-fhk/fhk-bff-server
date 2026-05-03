const refreshLocks = new Map();
const REFRESH_RESULT_CACHE_MS = 5000;

export async function withRefreshLock(key, task) {
    if (refreshLocks.has(key)) {
        return refreshLocks.get(key);
    }

    const promise = (async () => {
        try {
            const result = await task();
            setTimeout(() => {
                if (refreshLocks.get(key) === promise) {
                    refreshLocks.delete(key);
                }
            }, REFRESH_RESULT_CACHE_MS).unref?.();
            return result;
        } catch (error) {
            refreshLocks.delete(key);
            throw error;
        }
    })();

    refreshLocks.set(key, promise);
    return promise;
}
