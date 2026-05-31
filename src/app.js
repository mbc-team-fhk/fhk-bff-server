import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ALLOWED_ORIGINS, CORE_SERVICES } from './config/index.js';
import securityRouter from './proxy/securityProxy.js';
import {createGatewayMiddleware} from './proxy/gateway.js';

const app = express();

app.use(cors({
    // cors 미들웨어가 호출
    origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get('/ping', (req, res) => {
    res.json({ ok: true });
});


/**
 * 서비스 라우팅 목록
 */
app.use('/api/security', securityRouter);


/**
 * 어떤 라우팅도 걸리지않는 요청에 대해
 * 공통 gateway 처리
 */
app.use(createGatewayMiddleware(CORE_SERVICES.SECURITY));

/**
 * 글로벌 에러 처리
 * 미들웨어나 라우터에서 err 인자 검출되면
 * Express에서 가장 하단의 등록된 에러 핸들러 호출
 *
 * next 핸들러 없음
 */
app.use((err, req, res, _next) => {
    console.error(err);

    const status = err?.response?.status || 500;
    const data = err?.response?.data || {
        isSuccess: false,
        resCode: status,
        resMessage: err.message || 'Internal Server Error',
    };

    res.status(status).json(data);
});

export default app;