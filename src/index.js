import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import { ROUTING_MAP, FHK_FRONT_APP, PUBLIC_AUTH_PATH_RE, PROTECTED_PATH_RE, ALLOWED_ORIGINS } from "./config.js";
import assetRouter from "./proxy/asset.js";
import authRouter from "./proxy/auth.js";
import { proxyWithAutoRefresh,} from "./proxy/service.js";


axios.interceptors.request.use(req => {
    console.log(`[BFF → API] ${req.method.toUpperCase()} ${req.url}`);
    if (req.data) console.log(`[BFF → API BODY]`, req.data);
    req.metaStart = Date.now();
    return req;
});

axios.interceptors.response.use(res => {
    const duration = Date.now() - res.config.metaStart;
    console.log(`[API → BFF] ${res.config.url} ${res.status} (${duration}ms)`);
    return res;
});

const app = express();

const corsOption = {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOption));
app.options(/.*/, cors(corsOption));
app.use(express.json());
app.use(cookieParser());





// ===== 동적 API 라우팅 (proxyWithAutoRefresh 사용) =====
ROUTING_MAP.forEach(route => {

    if (route.prefix === "/api/security"){
        app.use(ROUTING_MAP.internalPrefix, authRouter);
    }else if(route.prefix === "/api/asset"){
        app.use(ROUTING_MAP.internalPrefix, assetRouter);
    }

    app.use(route.prefix, (req, res) => {
        proxyWithAutoRefresh(req, res, req.method, req.originalUrl);
    });

});



app.get("/ping", (req, res) => res.json({ message: "bff test" }));
//app.use((req, res) => res.status(404).json({ isSuccess: false, resCode: 404, resMessage: "bff 404" }));

/**
 * asyncHandler
 */
app.use((err, req, res, _next) => {
    console.error("[BFF ERROR]", err);

    if (err.response) {
        return res.status(err.response.status).json(
            err.response.data ?? {
                isSuccess: false,
                resCode: err.response.status,
                resMessage: "Upstream Error",
            }
        );
    }

    return res.status(500).json({
        isSuccess: false,
        resCode: 500,
        resMessage: err.message || "Internal Server Error",
    });
});

/**
 * 요청 리스닝 부분
 */
app.listen(4000, () => {
    console.log("bff 시작");
    console.log(ROUTING_MAP);
    console.log(ALLOWED_ORIGINS);
});