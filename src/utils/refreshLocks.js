const refreshLocks = new Map();

export async function withRefreshLock(key, task) {
    if (refreshLocks.has(key)) {
        return refreshLocks.get(key);
    }

    const promise = (async () => {
        try {
            return await task();
        } finally {
            refreshLocks.delete(key);
        }
    })();

    refreshLocks.set(key, promise);
    return promise;
}