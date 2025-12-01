import axios from "axios";
import FormData from "form-data";
import {SECURITY_SERVER_URL, PROTECTED_PATH_RE, ROUTING_MAP } from "./config.js";
import { clearAuthCookies, setAuthCookies, withRefreshLock } from "./authUtils";

function getServiceRoute(urlPath) {
    for (const route of ROUTING_MAP) {
        if (urlPath.startsWith(route.prefix)) {
            const targetPath = urlPath.substring(route.prefix.length);
            return {
                baseURL: route.url,
                targetPath: route.internalPrefix + targetPath,
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
    if (!route) throw new Error(`[ROUTE ERR] Unknown path: ${urlPath}`);
    const upstream = axios.create({ baseURL: route.baseURL, timeout: 10000 });
    console.log(`[UP CALL] ${method} ${urlPath} -> ${route.baseURL}${route.targetPath} ...`);

    const at = overrideAT ?? req.cookies?.AT;
    const headers = { ...(extra.headers || {}) };
    if (at) headers.Authorization = `Bearer ${at}`;

    return upstream.request({
        method,
        url: route.targetPath,
        headers,
        params: extra.params ?? req.query,
        data: extra.data ?? req.body,
    });
}


// ===== 자동 갱신 및 프록시 함수 =====
async function proxyWithAutoRefresh(req, res, method, urlPath, extra = {}) {

    try {

        const reqUpstream = await callUp(req, method, urlPath, extra);
        return res.status(reqUpstream.status).json(reqUpstream.data);
    } catch (error) {

        const errorStatus = error?.response?.status ?? 500;
        const isProtected = PROTECTED_PATH_RE.test(urlPath);
        const refreshToken = req.cookies?.RT;
        const errorData = error?.response?.data;

        // ===== 403 Forbidden 처리 (financial 멤버 서버 관련 문제) =====
        if (errorStatus === 403) {
            return res.status(403).json(errorData ?? {
                isSuccess: false,
                resMessage: "Forbidden: Not a registered or active member of this service."
            });
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
            const tokens = await withRefreshLock(refreshToken, async (rt) => {
                const authUpstream = axios.create({ baseURL: SECURITY_SERVER_URL, timeout: 5000 });
                const refreshRes = await authUpstream.post("/auth/refresh", { refreshToken: rt });
                const payload = refreshRes?.data?.result ?? refreshRes?.data;
                const at2 = payload?.accessToken;
                const rt2 = payload?.refreshToken;
                if (!at2 || !rt2) throw new Error("refresh-no-tokens");
                return { at: at2, rt: rt2 };
            });

            setAuthCookies(res, { accessToken: tokens.at, refreshToken: tokens.rt });
            const reqRefreshed = await callUp(req, method, urlPath, extra, tokens.at);
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


// ----------------------------------------------------
// 멀티파트 데이터 프록시 함수
// ----------------------------------------------------
async function handleMultipartProxy(req, res, method, urlPath) {
    // 파일 업로드 로직은 토큰 갱신 없이 단순 프록시만 수행
    try {
        const at = req.cookies?.AT;
        if (!at) {
            clearAuthCookies(res, "upload-no-at");
            return res.status(401).json({ isSuccess: false, resMessage: "Unauthorized: No AT cookie for upload" });
        }

        const fd = new FormData();
        // ... (FormData 구성 로직)

        const headers = { ...fd.getHeaders(), Authorization: `Bearer ${at}` };
        const targetServiceURL = getServiceBaseURL(urlPath);

        const itemUpstream = axios.create({ baseURL: targetServiceURL, timeout: 20000 });
        const targetPath = urlPath.startsWith("/api") ? urlPath.replace("/api", "") : urlPath;

        const r = await itemUpstream.request({ method, url: targetPath, data: fd, headers });
        res.status(r.status).json(r.data);
    } catch (e) {
        res.status(e?.response?.status ?? 500).json(e?.response?.data ?? {isSuccess: false, resMessage: "Upload failed"});
    }
}


// ----------------------------------------------------
// 에셋 서버 전용 프록시 함수 (재사용성 극대화)
// ----------------------------------------------------
async function proxyAssetRequest(req, res) {
    try {
        const route = getServiceRoute(req.path);
        if (!route || route.baseURL !== ASSET_SERVICE_URL) {
            return res.status(404).end();
        }

        // 에셋 요청은 인증 불필요 (대부분의 경우)
        const assetUpstream = axios.create({ baseURL: route.baseURL, responseType: "stream" });

        // targetPath는 /images/filename.jpg 형태가 됩니다.
        const r = await assetUpstream.get(route.targetPath);

        // 헤더 복사 및 스트리밍
        Object.entries(r.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
        r.data.pipe(res);

    } catch (e) {
        res.status(e?.response?.status ?? 500).end();
    }
}

export { proxyWithAutoRefresh, handleMultipartProxy, proxyAssetRequest };