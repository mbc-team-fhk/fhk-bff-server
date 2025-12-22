const refreshLocks = new Map();
const COOKIE_BASE = { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" };

function withRefreshLock(key, task) {

    const prev = refreshLocks.get(key) || Promise.resolve();
    const next = prev.catch(() => {}).then(() => task());
    refreshLocks.set(key, next);
    return next.finally(() => {
        if (refreshLocks.get(key) === next) refreshLocks.delete(key);
    });
}

function setAuthCookies(res, tokens) {
    const opts = { ...COOKIE_BASE };
    res.cookie("AT", tokens.accessToken, { ...opts, maxAge: 1000 * 60 * 30 }); // 30분
    res.cookie("RT", tokens.refreshToken, { ...opts, maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7일
}

function clearAuthCookies(res, reason = "") {
    console.warn("[AUTH] clearAuthCookies:", reason);
    const opts = { ...COOKIE_BASE };
    res.clearCookie("AT", opts);
    res.clearCookie("RT", opts);
}


export { setAuthCookies, clearAuthCookies, withRefreshLock };