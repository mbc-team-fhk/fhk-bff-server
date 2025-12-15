import axios from "axios";

export function requestLogger(req, res, next) {
    const start = Date.now();

    console.log(`[REQ] ${req.method} ${req.originalUrl}`);

    if (Object.keys(req.body || {}).length > 0) {
        console.log(`[REQ BODY]`, req.body);
    }


    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[RES] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });

    next();
}



