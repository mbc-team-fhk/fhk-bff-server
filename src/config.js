import dotenv from 'dotenv';
dotenv.config();

function envOrDefault(envName, defaultValue) {
    return process.env[envName] || defaultValue;
}

// 서비스 URL 환경 변수
const SECURITY_SERVER = envOrDefault("FHK_SECURITY_SERVER_URL", "http://fhk-security-server:8080");
const ASSET_SERVER = envOrDefault("FHK_ASSET_SERVER_URL", "http://fhk-asset-server:8080");

/**
 * ...... dev환경의 default 옵션 같음 -> 배포시 deployment에서 경로지정
 * @todo http://localhost:XXXX 로 수정해야하는지 확인
 * @type {{TICKETING: {PAYMENT: string, MOVIE: string, FRONT_APP: string, RESERVATION: string, TICKET: string, MEMBER: string}, FINANCIAL: {PAYMENT: string, FRONT_APP: string, CUSTOMER: string, MERCHANT: string}}}
 */
const SERVICES = {
    TICKETING: {
        PAYMENT: envOrDefault("FHK_TICKETING_PAYMENT_SERVICE_URL", "http://fhk-ticketing-payment-service:8080"),
        RESERVATION: envOrDefault("FHK_TICKETING_RESERVATION_SERVICE_URL", "http://fhk-ticketing-reservation-service:8080"),
    },
    CHATTING: {
        CHAT: envOrDefault("FHK_CHATTING_CHATTING_SERVICE_URL", "http://fhk-chatting-chat-service:8080"),
        NOTIFICATION: envOrDefault("FHK_CHATTING_NOTIFICATION_SERVICE_URL", "http://fhk-chatting-notification-service:8080"),
    },
    FINANCIAL: {
        CUSTOMER: envOrDefault("FHK_FINANCIAL_CUSTOMER_SERVICE_URL", "http://fhk-financial-customer-service:8080"),
        MERCHANT: envOrDefault("FHK_FINANCIAL_MERCHANT_SERVICE_URL", "http://fhk-financial-merchant-service:8080"),
        PAYMENT: envOrDefault("FHK_FINANCIAL_PAYMENT_SERVICE_URL", "http://fhk-financial-payment-service:8080"),
    },
};


const ARTIFACT_ROUTES = {
    ticketing: [
        { sub: "payment", url: SERVICES.TICKETING.PAYMENT, internal: "/payment" },
        { sub: "reservation", url: SERVICES.TICKETING.RESERVATION, internal: "/reservation" },
    ],
    chatting: [
        { sub: "chatrooms", url: SERVICES.CHATTING.CHAT, internal: "/chatrooms" },
        { sub: "chat-users", url: SERVICES.CHATTING.CHAT, internal: "/chat-users" },
        { sub: "notification", url: SERVICES.CHATTING.NOTIFICATION, internal: "/notification" },
    ],
    financial: [
        { sub: "customer", url: SERVICES.FINANCIAL.CUSTOMER, internal: "/customer" },
        { sub: "merchant", url: SERVICES.FINANCIAL.MERCHANT, internal: "/merchant" },
        { sub: "payment", url: SERVICES.FINANCIAL.PAYMENT, internal: "/payment" },
    ],
};


const ROUTING_MAP = [
    { prefix: "/api/asset", url: ASSET_SERVER, internalPrefix: "/asset" },

    ...Object.entries(ARTIFACT_ROUTES).flatMap(([artifact, routes]) =>
        routes.map(route => ({
            prefix: `/api/${artifact}/${route.sub}`,
            url: route.url,
            internalPrefix: route.internal,
        }))
    ),
];

const PROTECTED_PATH_RE = /^\/api\/(member|orders|payment|store)(\/|$)/i;
const PUBLIC_AUTH_PATH_RE = /^\/api\/auth\/(login|logout|refresh|v1\/login)$/i;

const ALLOWED_ORIGINS = envOrDefault(
    "FHK_ALLOWED_ORIGINS",
    "http://localhost:5173"
).split(",").map(origin => origin.trim()).filter(Boolean);

export {
    SECURITY_SERVER,
    ASSET_SERVER,
    ROUTING_MAP,
    PROTECTED_PATH_RE,
    PUBLIC_AUTH_PATH_RE,
    ALLOWED_ORIGINS,
};
