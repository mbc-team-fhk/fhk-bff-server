export function buildForwardHeaders(req) {
    const headers = {};

    const accessToken = req.cookies?.AT;
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
        return headers;
    }

    if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
    }

    return headers;
}
