import express from 'express';
import {securityApi} from '../clients/securityApi.js';
import {CORE_SERVICES} from '../config/index.js';
import {asyncHandler} from '../lib/asyncHandler.js';
import {clearAuthCookies, setAuthCookies} from '../utils/authCookies.js';
import {makePrefixProxyHandler} from "../lib/proxyHandler.js";
import {buildForwardHeaders} from "../utils/authorization.js";
import {refreshAuth, clearAuthOnRefreshFailure} from "../utils/refreshAuth.js";

const router = express.Router();

/**
 * BFF 서버에서
 * 프론트를 대신하여
 * JWT 토큰관리
 */
router.post(
    '/auth/login',
    asyncHandler(async (req, res) => {
        const upstream = await securityApi.post('/auth/login', req.body);

        const { accessToken, refreshToken } = upstream.data?.result ?? {};

        if (accessToken && refreshToken) {
            setAuthCookies(res, { accessToken, refreshToken });
        }

        return res.status(upstream.status).json(upstream.data);
    })
);

router.post(
    '/auth/logout',
    asyncHandler(async (req, res) => {
        try {
            await securityApi.post('/auth/logout', null, {
                headers: buildForwardHeaders(req),
            });
        } finally {
            clearAuthCookies(res, 'logout');
        }

        return res.json({
            isSuccess: true,
            resCode: 200,
            resMessage: 'OK',
        });
    })
);

router.get(
    '/auth/me',
    asyncHandler(async (req, res) => {
        try {
            const meResponse = await securityApi.get('/auth/me', {
                headers: buildForwardHeaders(req),
            });

            return res.status(meResponse.status).json(meResponse.data);
        } catch (error) {
            const status = error?.response?.status;

            if (status !== 401 || !req.cookies?.RT) {
                throw error;
            }

            try {
                const refreshed = await refreshAuth(req, res, CORE_SERVICES.SECURITY);

                const retryMe = await securityApi.get('/auth/me', {
                    headers: {
                        Authorization: `Bearer ${refreshed.accessToken}`,
                    },
                });

                return res.status(retryMe.status).json(retryMe.data);
            } catch (refreshError) {
                clearAuthOnRefreshFailure(res, refreshError);
                throw refreshError;
            }
        }
    })
);


/**
 * 이하 공통 프록시로 일괄 처리
 */
router.use(
    '/accounts',
    makePrefixProxyHandler({
        client: securityApi,
        upstreamBasePath: '/accounts',
        protectedRoute: true,
        securityBaseUrl: CORE_SERVICES.SECURITY,
    })
);

export default router;
