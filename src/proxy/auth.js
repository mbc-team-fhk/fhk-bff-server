import express from "express";
import { securityApi } from "../clients/securityApi.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/response.js";
import { makeProxyHandler } from "../lib/proxyHandler.js";
import { clearAuthCookies, setAuthCookies } from "../utils.js";

const authRouter = express.Router();

/**
 * 로그인
 * 기존 JWT 토큰방식을 BFF에서 관리하고
 * 쿠키-세션 형태로 제공
 */
authRouter.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
        const r = await securityApi.post("/auth/login", req.body);

        const at = r?.data?.result?.accessToken;
        const rt = r?.data?.result?.refreshToken;

        if (!at || !rt) {
            throw new Error("토큰 발급 실패");
        }

        setAuthCookies(res, { accessToken: at, refreshToken: rt });

        return ok(res, {
            user: r?.data?.result ?? r?.data,
        });
    })
);

/**
 * FHK 통합계정 회원가입
 * 각 토이프로젝트 별 별도가입 (닉네임 설정 등) 필요
 */
authRouter.post(
    "/accounts",
    makeProxyHandler({
        client: securityApi,
        method: "post",
        pathResolver: () => "/accounts",
    })
);

/**
 * FHK 통합계정 조회
 */
authRouter.get(
    "/accounts/:accountId",
    makeProxyHandler({
        client: securityApi,
        method: "get",
        pathResolver: (req) => `/accounts/${req.params.accountId}`,
    })
);

/**
 * FHK 통합계정 로그아웃
 * Security 서버측에서는 JWT 토큰버전 관리
 * BFF 에서는 쿠키 삭제처리
 */
authRouter.post(
    "/auth/logout",
    asyncHandler(async (_req, res) => {
        try {
            await securityApi.post("/auth/logout");
        } finally { // 서버측 JWT 토큰 관리 실패해도 웹상 쿠키삭제 우선
            clearAuthCookies(res, "logout");
        }

        return ok(res);
    })
);

export default authRouter;