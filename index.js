import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import { SECURITY_SERVER, ROUTING_MAP, FRONTEND_URL, PUBLIC_AUTH_PATH_RE, PROTECTED_PATH_RE, ALLOWED_ORIGINS } from "./config.js";
import { proxyWithAutoRefresh, handleMultipartProxy, proxyAssetRequest } from "./proxy.js";
import { clearAuthCookies, setAuthCookies } from "./authUtils.js";
import { requestLogger } from "./logger.js";

axios.interceptors.request.use(req => {
    console.log(`[BFF → API] ${req.method.toUpperCase()} ${req.url}`);
    if (req.data) console.log(`[BFF → API BODY]`, req.data);
    req.metaStart = Date.now();
    return req;
});

axios.interceptors.response.use(res => {
    const duration = Date.now() - res.config.metaStart;
    console.log(`[API → BFF] ${res.config.url} ${res.status} (${duration}ms)`);
    return res;
});

const app = express();

const corsOption = {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOption));
app.options(/.*/, cors(corsOption));
app.use(express.json());
app.use(cookieParser());

function handleApiError(res, e) {
    const st = e?.response?.status ?? 500;
    res.status(st).json(e?.response?.data ?? {isSuccess: false, resMessage: String(e)});
}

// ========== Security ==========
// ----- fhk 계정 로그인 -----
app.post("/api/auth/login", async (req, res) => {

    try {
        const authUpstream = axios.create({
            baseURL: SECURITY_SERVER,
            timeout: 6000
        });

        const r = await authUpstream.post("/api/auth/login", req.body);

        const at = r?.data?.result?.accessToken;
        const rt = r?.data?.result?.refreshToken;
        if (!at || !rt) throw new Error("토큰 발급 실패");

        setAuthCookies(res, { accessToken: at, refreshToken: rt });

        return res.json({
            isSuccess: true,
            resCode: 200,
            resMessage: "OK",
            result: { user: r?.data?.result ?? r?.data }
        });

    } catch (e) {
        handleApiError(res, e);
    }
});

// ----- fhk 계정 등록 -----
app.post("/api/accounts", async (req, res) => {
    try {

        const authUpstream = axios.create({
            baseURL: SECURITY_SERVER,
            timeout: 5000
        });
        const accountRes = await authUpstream.post("/api/accounts", req.body);

        return res.json({
            isSuccess: true,
            resCode: 200,
            resMessage: "OK",
            result: accountRes?.data?.result ?? accountRes?.data
        });

    } catch (e) {
        return handleApiError(res, e);
    }
});

// ----- fhk 계정 조회 -----
app.get("/api/accounts/:accountId", async (req, res) => {
    const { accountId } = req.params;

    try {
        const authUpstream = axios.create({
            baseURL: SECURITY_SERVER,
            timeout: 5000
        });

        const accountRes = await authUpstream.get(`/api/accounts/${accountId}`);

        return res.json({
            isSuccess: true,
            resCode: 200,
            resMessage: "OK",
            result: accountRes?.data?.result ?? accountRes?.data
        });

    } catch (e) {
        return handleApiError(res, e);
    }
});

// =======================================================


app.post("/api/auth/logout", async (_req, res) => {
    try {
        const authUpstream = axios.create({ baseURL: SECURITY_SERVER, timeout: 5000 });
        // 인증 서버의 로그아웃 엔드포인트 호출 (RT 무효화 등)
        await authUpstream.post("/auth/logout");
    } catch (e) {
        handleApiError(res, e);
    }
    clearAuthCookies(res, "logout");
    return res.json({ isSuccess: true });
});

// ===== 동적 API 라우팅 (proxyWithAutoRefresh 사용) =====
ROUTING_MAP.forEach(route => {

    if (route.prefix === "/images" || route.prefix === "/api/auth") return;

    app.use(route.prefix, (req, res) => {
        proxyWithAutoRefresh(req, res, req.method, req.originalUrl);
    });

});


/*
// ===== 파일/에셋 라우팅 (별도 처리) =====
// 1. 에셋 파일 프록시 (GET /images/...)
app.get("/images/!*", proxyAssetRequest);

// 2. 파일 업로드 (POST/PUT /api/items/...)
const upload = multer();
app.post("/api/items", upload.array("images"), (req, res) => handleMultipartProxy(req, res, "POST", "/api/items"));
app.put("/api/items/:id", upload.array("images"), (req, res) => handleMultipartProxy(req, res, "PUT", `/api/items/${req.params.id}`));
*/


app.get("/ping", (_req, res) => res.json({ message: "bff test" }));
//app.use((req, res) => res.status(404).json({ isSuccess: false, resCode: 404, resMessage: "bff 404" }));

app.listen(4000, () => {
    console.log("bff 시작");
    console.log(ROUTING_MAP);
    console.log(ALLOWED_ORIGINS);

});