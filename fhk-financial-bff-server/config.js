// 서비스 URL 환경 변수
const SECURITY_SERVER_URL = process.env.SECURITY_SERVER_URL;
const ASSET_SERVER_URL = process.env.ASSET_SERVER_URL;

const SERVICES = {

    CHAT: {
        MEMBER: process.env.CHAT_MEMBER_SERVICE_URL,
        NOTIFICATION: process.env.CHAT_NOTIFICATION_SERVICE_URL,
    },

    RESERVATION: {
        MEMBER: process.env.RESERVATION_MEMBER_SERVICE_URL,
    },

    FINANCIAL: {
        MEMBER: process.env.FINANCIAL_MEMBER_SERVICE_URL,
        PAYMENT: process.env.FINANCIAL_PAYMENT_SERVICE_URL,
    },
};

const ARTIFACT_ROUTES = {

    chat: [
        { sub: "member", url: SERVICES.CHAT.MEMBER, internal: "/member" },
        { sub: "notification", url: SERVICES.CHAT.NOTIFICATION, internal: "/notification" },
    ],

    reservation: [
        { sub: "member", url: SERVICES.RESERVATION.MEMBER, internal: "/member" },
    ],

    financial: [
        { sub: "member", url: SERVICES.FINANCIAL.MEMBER, internal: "/member" },
        { sub: "payment", url: SERVICES.FINANCIAL.PAYMENT, internal: "/payment" },
    ],
};

const ROUTING_MAP = [

    { prefix: "/api/auth",  url: SECURITY_SERVER_URL, internalPrefix: "/auth" },
    { prefix: "/api/asset", url: ASSET_SERVER_URL,    internalPrefix: "/asset" },

    ...Object.entries(ARTIFACT_ROUTES).flatMap(([artifact, routes]) =>
        routes.map(route => ({
            prefix: `/api/${artifact}/${route.sub}`,
            url: route.url,
            internalPrefix: route.internal,
        }))
    ),
];

const PROTECTED_PATH_RE = /^\/api\/(member|orders|payment)(\/|$)/i;
const PUBLIC_AUTH_PATH_RE = /^\/api\/auth\/(login|logout|refresh|v1\/login)$/i;
const FRONTEND_URL = process.env.FRONTEND_URL;
const ALLOWED_ORIGINS = [FRONTEND_URL, ];

export {
    SECURITY_SERVER_URL,
    ASSET_SERVER_URL,
    ROUTING_MAP,

    PROTECTED_PATH_RE,
    PUBLIC_AUTH_PATH_RE,
    FRONTEND_URL,
    ALLOWED_ORIGINS,
};