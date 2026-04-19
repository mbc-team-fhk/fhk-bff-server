import axios from 'axios';
import {clearAuthCookies, setAuthCookies} from './authCookies.js';
import {withRefreshLock} from "./refreshLocks.js";

export async function refreshAuth(req, res, securityBaseUrl) {
    const refreshToken = req.cookies?.RT;

    if (!refreshToken) {
        throw new Error('Refresh token missing');
    }

    return withRefreshLock(refreshToken, async () => {
        const response = await axios.post(
            `${securityBaseUrl}/auth/refresh`,
            { refreshToken },
            { timeout: 5000 }
        );

        const { accessToken, refreshToken: nextRefreshToken } = response.data?.result ?? {};

        if (!accessToken || !nextRefreshToken) {
            throw new Error('Invalid refresh response');
        }

        setAuthCookies(res, {
            accessToken,
            refreshToken: nextRefreshToken,
        });

        return {
            accessToken,
            refreshToken: nextRefreshToken,
            raw: response.data,
        };
    });
}

export function clearAuthOnRefreshFailure(res, reason = 'refresh-failed') {
    clearAuthCookies(res, reason);
}