import { ok } from "./response.js";
import { asyncHandler } from "./asyncHandler.js";
<<<<<<< Updated upstream

export function makeProxyHandler({ client, method, pathResolver }) {
    return asyncHandler(async (req, res) => {
        const response = await client.request({
            method,
            url: pathResolver(req),
            data: req.body,
            params: req.query,
            headers: {
                authorization: req.headers.authorization,
            },
        });

        return ok(res, response?.data?.result ?? response?.data);
=======
import {buildForwardHeaders} from "../utils/authorization.js";
import {clearAuthOnRefreshFailure, refreshAuth} from "../utils/refreshAuth.js";


export function makePrefixProxyHandler({ client, upstreamBasePath, protectedRoute = false, securityBaseUrl }) {
    return asyncHandler(async (req, res) => {
        const suffix = req.path === "/" ? "" : req.path;
        const requestConfig = {
            method: req.method,
            url: `${upstreamBasePath}${suffix}`,
            params: req.query,
            data: req.body,
        };

        try {
            const response = await client.request({
                ...requestConfig,
                headers: buildForwardHeaders(req),
            });

            return res.status(response.status).json(response.data);
        } catch (error) {
            const status = error?.response?.status;

            if (!protectedRoute || status !== 401 || !req.cookies?.RT || !securityBaseUrl) {
                throw error;
            }

            try {
                const refreshed = await refreshAuth(req, res, securityBaseUrl);
                const retryResponse = await client.request({
                    ...requestConfig,
                    headers: {
                        ...buildForwardHeaders(req),
                        Authorization: `Bearer ${refreshed.accessToken}`,
                    },
                });

                return res.status(retryResponse.status).json(retryResponse.data);
            } catch (refreshError) {
                clearAuthOnRefreshFailure(res, refreshError);
                throw refreshError;
            }
        }
>>>>>>> Stashed changes
    });
}