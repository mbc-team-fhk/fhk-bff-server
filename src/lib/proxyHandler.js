import { asyncHandler } from "./asyncHandler.js";
import {buildForwardHeaders} from "../utils/authorization.js";


export function makePrefixProxyHandler({ client, upstreamBasePath }) {
    return asyncHandler(async (req, res) => {
        const suffix = req.path === "/" ? "" : req.path;

        const response = await client.request({
            method: req.method,
            url: `${upstreamBasePath}${suffix}`,
            params: req.query,
            data: req.body,
            headers: buildForwardHeaders(req),
        });

        return res.status(response.status).json(response.data);
    });
}

