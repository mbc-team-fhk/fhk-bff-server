import axios from 'axios';
import { ROUTING_MAP } from '../config/index.js';
import { buildForwardHeaders } from '../utils/authorization.js';
import { clearAuthOnRefreshFailure, refreshAuth } from '../utils/refreshAuth.js';

export function createGatewayMiddleware(securityBaseUrl) {
    return async function gatewayMiddleware(req, res, next) {
        return proxyServiceRequest(req, res, next, securityBaseUrl);
    };
}

function matchRoute(pathname) {
    return ROUTING_MAP.find((route) => pathname.startsWith(route.prefix));
}

function buildUpstreamPath(route, originalUrl) {
    return originalUrl.replace(route.prefix, '') || '/';
}

async function proxyServiceRequest(req, res, next, securityBaseUrl) {
    const route = matchRoute(req.originalUrl);
    if (!route) {
        return next();
    }

    const upstreamUrl = `${route.target}${buildUpstreamPath(route, req.originalUrl)}`;
    const requestHeaders = buildForwardHeaders(req);

    try {
        const response = await axios.request({
            method: req.method,
            url: upstreamUrl,
            params: req.query,
            data: req.body,
            headers: requestHeaders,
            timeout: 5000,
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        const status = error?.response?.status;

        if (!route.protected || status !== 401) {
            return next(error);
        }

        if (!req.cookies?.RT) {
            clearAuthOnRefreshFailure(res);
            return res.status(401).json(error?.response?.data || {
                isSuccess: false,
                resCode: 401,
                resMessage: 'authentication required',
            });
        }

        try {
            const refreshed = await refreshAuth(req, res, securityBaseUrl);

            const retryResponse = await axios.request({
                method: req.method,
                url: upstreamUrl,
                params: req.query,
                data: req.body,
                headers: {
                    ...buildForwardHeaders(req),
                    Authorization: `Bearer ${refreshed.accessToken}`,
                },
                timeout: 5000,
            });

            return res.status(retryResponse.status).json(retryResponse.data);
        } catch (refreshError) {
            clearAuthOnRefreshFailure(res, refreshError);
            return next(refreshError);
        }
    }
}
