import { ok } from "./response.js";
import { asyncHandler } from "./asyncHandler.js";

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
    });
}