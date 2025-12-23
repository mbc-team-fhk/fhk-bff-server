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

function handleApiError(res, e) {
    const st = e?.response?.status ?? 500;
    res.status(st).json(e?.response?.data ?? {isSuccess: false, resMessage: String(e)});
}

function requestLogger(req, res, next) {
    const start = Date.now();

    console.log(`[REQ] ${req.method} ${req.originalUrl}`);

    if (Object.keys(req.body || {}).length > 0) {
        console.log(`[REQ BODY]`, req.body);
    }


    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[RES] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });

    next();
}

export {
    setAuthCookies,
    clearAuthCookies,
    withRefreshLock,
    handleApiError,
    requestLogger,
};