import express from "express";
import axios from "axios";
import {SECURITY_SERVER} from "../config.js";
import {clearAuthCookies, setAuthCookies} from "../utils.js";

const authRouter = express.Router();


// ----- fhk 계정 로그인 -----
authRouter.post("/api/auth/login", async (req, res) => {

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
authRouter.post("/api/accounts", async (req, res) => {
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
authRouter.get("/api/accounts/:accountId", async (req, res) => {
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


authRouter.post("/api/auth/logout", async (_req, res) => {
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


export default authRouter;