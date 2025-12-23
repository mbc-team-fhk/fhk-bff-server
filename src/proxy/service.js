import axios from "axios";
import {SECURITY_SERVER, PROTECTED_PATH_RE, ROUTING_MAP } from "../config.js";
import { clearAuthCookies, setAuthCookies, withRefreshLock, handleApiError, requestLogger} from "../utils.js";


function getServiceRoute(urlPath) {
    for (const route of ROUTING_MAP) {
        if (urlPath.startsWith(route.prefix)) {
            const servicePath = route.internalPrefix;
            const target = urlPath.substring(route.prefix.length);
            return {
                serviceUrl: route.url,
                targetPath: servicePath + target,
            };
        }
    }
    return null;
}


// ----------------------------------------------------
// 단일 호출 함수
// ----------------------------------------------------
async function callUp(req, method, urlPath, extra = {}, overrideAT) {

    const route = getServiceRoute(urlPath);
    console.log("[DEBUG] serviceUrl =", route.serviceUrl);
    console.log("[DEBUG] targetPath =", route.targetPath);

    if (!route) throw new Error(`[ROUTE ERR] Unknown path: ${urlPath}`);
    console.log(`[UP CALL] ${method} ${urlPath} -> ${route.serviceUrl}${route.targetPath} ...`);

    const upstream = axios.create({ baseURL: route.serviceUrl, timeout: 10000 });

    const at = overrideAT ?? req.cookies?.AT;
    const headers = { ...(extra.headers || {}) };
    if (at) headers.Authorization = `Bearer ${at}`;
    console.log(headers.Authorization);

    return upstream.request({
        method,
        url: route.targetPath,
        headers,
        params: extra.params ?? req.query,
        data: extra.data ?? req.body,
    });
}


// ===== 자동 갱신 및 프록시 함수 =====
function proxyWithAutoRefresh(req, res, method, urlPath, extra = {}) {

    console.log("[DEBUG] proxyWithAutoRefresh =", method, urlPath, extra);

    try {
        const reqUpstream = callUp(req, method, urlPath, extra);

        return res.status(reqUpstream.status).json(reqUpstream.data);

    } catch (error) {

        const errorStatus = error?.response?.status ?? 500;
        const isProtected = PROTECTED_PATH_RE.test(urlPath);
        const refreshToken = req.cookies?.RT;
        const errorData = error?.response?.data;

        console.log("[DEBUG] Error Info:", {
            errorStatus,
            isProtected,
            refreshToken,
            errorData,
        });

        // ===== 404 MEMBER_NOT_FOUND 처리 (각 service artifact 멤버 서버 관련 문제) =====
        if (res.status === 404 && res.code === "MEMBER_NOT_FOUND") {
            return res;
        }

        // ===== 401 Unauthorized 처리 (토큰/인증 서버 관련 문제) =====
        if (errorStatus !== 401 || !isProtected) {
            return res.status(errorStatus).json(errorData ?? { isSuccess:false });
        }else if (!refreshToken) {
            clearAuthCookies(res, "no-rt-cookie");
            return res.status(401).json({ isSuccess:false, resMessage:"Unauthorized: No RT cookie" });
        }

        // ===== 토큰 자동 갱신 시도 (FHK 인증 서버 호출) =====
        try {
            const tokens = withRefreshLock(refreshToken, async (rt) => {
                const authUpstream = axios.create({ baseURL: SECURITY_SERVER, timeout: 5000 });
                const refreshRes = await authUpstream.post("/auth/refresh", { refreshToken: rt });
                const payload = refreshRes?.data?.result ?? refreshRes?.data;
                const at2 = payload?.accessToken;
                const rt2 = payload?.refreshToken;
                if (!at2 || !rt2) throw new Error("refresh-no-tokens");
                return { at: at2, rt: rt2 };
            });

            setAuthCookies(res, { accessToken: tokens.at, refreshToken: tokens.rt });
            const reqRefreshed = callUp(req, method, urlPath, extra, tokens.at);
            return res.status(reqRefreshed.status).json(reqRefreshed.data);

        } catch (errorRefreshed) {

            const errorStatus2 = errorRefreshed?.response?.status ?? 0;
            if (errorStatus2 === 401 || errorStatus2 === 403) {
                clearAuthCookies(res, "refresh-unauth");
            }
            return res.status(errorStatus2).json({ isSuccess:false, resMessage:"Unauthorized: Session expired or invalid." });
        }
    }
}



export { proxyWithAutoRefresh,};