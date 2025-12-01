import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import { SECURITY_SERVER_URL, ROUTING_MAP, FRONTEND_URL, PUBLIC_AUTH_PATH_RE, PROTECTED_PATH_RE, ALLOWED_ORIGINS, ASSET_SERVICE_URL } from "./config.js";
import { proxyWithAutoRefresh, handleMultipartProxy, proxyAssetRequest } from "./proxy.js";
import { clearAuthCookies, setAuthCookies } from "./authUtils";


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

// ===== Security =====
app.post("/api/auth/login", async (req, res) => {
    try {
        const authUpstream = axios.create({ baseURL: SECURITY_SERVER_URL, timeout: 5000 });
        const r = await authUpstream.post("/auth/v1/login", req.body);

        const at = r?.data?.result?.accessToken;
        const rt = r?.data?.result?.refreshToken;
        if (!at || !rt) throw new Error("토큰 발급 실패");

        setAuthCookies(res, { accessToken: at, refreshToken: rt });

        // 로그인 성공 후 멤버 서비스로 사용자 정보 조회 재시도 (BFF의 집계 역할)
        const meRes = await proxyWithAutoRefresh({ ...req, cookies: { ...req.cookies, AT: at } }, res, "GET", "/api/member/me", {}, at);

        return res.json({
            isSuccess: true,
            resCode: 200,
            resMessage: "OK",
            result: { user: meRes?.data?.result ?? meRes?.data }
        });
    } catch (e) {
        handleApiError(res, e);
    }
});

app.post("/api/auth/logout", async (_req, res) => {
    try {
        const authUpstream = axios.create({ baseURL: SECURITY_SERVER_URL, timeout: 5000 });
        // 인증 서버의 로그아웃 엔드포인트 호출 (RT 무효화 등)
        await authUpstream.post("/auth/v1/logout");
    } catch (_) {}
    clearAuthCookies(res, "logout");
    return res.json({ isSuccess: true });
});


// ===== 동적 API 라우팅 (proxyWithAutoRefresh 사용) =====
ROUTING_MAP.forEach(route => {

    if (route.prefix === "/images" || route.prefix === "/api/auth") return;

    app.all(`${route.prefix}/*`, (req, res) => {
        // 모든 HTTP 메서드 (GET, POST, PUT, DELETE 등)에 대해 공통 프록시 함수 적용
        // req.path는 /api/member/me 등 전체 경로를 포함합니다.
        proxyWithAutoRefresh(req, res, req.method, req.path);
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
app.use((req, res) => res.status(404).json({ isSuccess: false, resCode: 404, resMessage: "bff 404" }));

app.listen(4000, () => {
    console.log("bff 시작");
    console.log(`FRONTEND: ${FRONTEND}`);
    console.log(`BACKEND: ${BACKEND}`);
});