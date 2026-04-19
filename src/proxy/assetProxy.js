import express from "express";
import axios from "axios";
import {clearAuthCookies, setAuthCookies} from '../utils/authCookies.js';
import FormData from "form-data";

const assetRouter = express.Router();

// TODO : 에셋 서버 적용 필요

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


assetRouter.post("/upload-intents", (req, res) => {

})


assetRouter.post("/upload-intents/{uploadIntentId}/commit", (req, res) => {

})


assetRouter.get("/:assetId", (req, res) => {

})


assetRouter.delete("/:assetId", (req, res) => {

})
/*
// ===== 파일/에셋 라우팅 (별도 처리) =====
// 1. 에셋 파일 프록시 (GET /images/...)
app.get("/images/!*", proxyAssetRequest);

// 2. 파일 업로드 (POST/PUT /api/items/...)
const upload = multer();
app.post("/api/items", upload.array("images"), (req, res) => handleMultipartProxy(req, res, "POST", "/api/items"));
app.put("/api/items/:id", upload.array("images"), (req, res) => handleMultipartProxy(req, res, "PUT", `/api/items/${req.params.id}`));
*/

export default assetRouter;
