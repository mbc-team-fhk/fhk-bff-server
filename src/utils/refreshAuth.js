import axios from 'axios';
import {clearAuthCookies, setAuthCookies} from './authCookies.js';
import {withRefreshLock} from "./refreshLocks.js";

function buildAuthError(status, message) {
    const error = new Error(message);
    error.response = {
        status,
        data: {
            isSuccess: false,
            resCode: status,
            resMessage: message,
        },
    };
    return error;
}

function buildRefreshHeaders(req) {
    const headers = {};

    if (req.headers['user-agent']) {
        headers['User-Agent'] = req.headers['user-agent'];
    }

    if (req.headers['x-forwarded-for']) {
        headers['X-Forwarded-For'] = req.headers['x-forwarded-for'];
    } else if (req.ip) {
        headers['X-Forwarded-For'] = req.ip;
    }

    if (req.headers['x-forwarded-proto']) {
        headers['X-Forwarded-Proto'] = req.headers['x-forwarded-proto'];
    } else if (req.protocol) {
        headers['X-Forwarded-Proto'] = req.protocol;
    }

    return headers;
}

export async function refreshAuth(req, res, securityBaseUrl) {
    const refreshToken = req.cookies?.RT;

    if (!refreshToken) {
        throw buildAuthError(401, 'authentication required');
    }

    const refreshed = await withRefreshLock(refreshToken, async () => {
        const response = await axios.post(
            `${securityBaseUrl}/auth/refresh`,
            { refreshToken },
            {
                headers: buildRefreshHeaders(req),
                timeout: 5000,
            }
        );

        const { accessToken, refreshToken: nextRefreshToken } = response.data?.result ?? {};

        if (!response.data?.isSuccess || !accessToken || !nextRefreshToken) {
            throw new Error('Invalid refresh response');
        }

        return {
            accessToken,
            refreshToken: nextRefreshToken,
            raw: response.data,
        };
    });

    setAuthCookies(res, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
    });

    return refreshed;
}

export function clearAuthOnRefreshFailure(res, reason = 'refresh-failed') {
    const status = reason?.response?.status;
    if (status === 401 || status === 403 || !status) {
        clearAuthCookies(res, 'refresh-auth-rejected');
    }
}
