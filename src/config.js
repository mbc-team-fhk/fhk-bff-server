import dotenv from 'dotenv';
dotenv.config();

// 서비스 URL 환경 변수
const SECURITY_SERVER = process.env.FHK_SECURITY_SERVER_URL;
const ASSET_SERVER = process.env.FHK_ASSET_SERVER_URL;


const SERVICES = {
    TICKETING: {
        FRONT_APP: process.env.FHK_TICKETING_FRONT_APP_URL,
        MEMBER: process.env.FHK_TICKETING_MEMBER_SERVICE_URL,
        MOVIE: process.env.FHK_TICKETING_MOVIE_SERVICE_URL,
        PAYMENT: process.env.FHK_TICKETING_PAYMENT_SERVICE_URL,
        RESERVATION: process.env.FHK_TICKETING_RESERVATION_SERVICE_URL,
        TICKET: process.env.FHK_TICKETING_TICKET_SERVICE_URL,
    },
/*    CHATTING: {
        FRONT_APP: process.env.FHK_CHATTING_FRONT_APP_URL,
        CHAT: process.env.FHK_CHATTING_CHATTING_SERVICE_URL,
        NOTIFICATION: process.env.FHK_CHATTING_NOTIFICATION_SERVICE_URL,
    },*/
    FINANCIAL: {
        FRONT_APP: process.env.FHK_FINANCIAL_FRONT_APP_URL,
        CLIENT: process.env.FHK_FINANCIAL_CLIENT_SERVICE_URL,
        PAYMENT: process.env.FHK_FINANCIAL_PAYMENT_SERVICE_URL,
    },
};


const ARTIFACT_ROUTES = {
    ticketing: [
        { sub: "front-app", url: SERVICES.TICKETING.FRONT, internal: "/" },
        { sub: "member", url: SERVICES.TICKETING.MEMBER, internal: "/member" },
        { sub: "movie", url: SERVICES.TICKETING.MOVIE, internal: "/movie" },
        { sub: "payment", url: SERVICES.TICKETING.PAYMENT, internal: "/payment" },
        { sub: "reservation", url: SERVICES.TICKETING.RESERVATION, internal: "/reservation" },
        { sub: "ticket", url: SERVICES.TICKETING.TICKET, internal: "/ticket" },
    ],
/*    chatting: [
        { sub: "front-app", url: SERVICES.CHATTING.FRONT, internal: "/" },
        { sub: "chatrooms", url: SERVICES.CHATTING.CHAT, internal: "/chatrooms" },
        { sub: "chat-users", url: SERVICES.CHATTING.CHAT, internal: "/chat-users" },
        { sub: "notification", url: SERVICES.CHATTING.NOTIFICATION, internal: "/notification" },
    ],*/
    financial: [
        { sub: "front-app", url: SERVICES.FINANCIAL.FRONT, internal: "/" },
        { sub: "client", url: SERVICES.FINANCIAL.CLIENT, internal: "/" },
        { sub: "payment", url: SERVICES.FINANCIAL.PAYMENT, internal: "/" },
    ],
};


const ROUTING_MAP = [
    { prefix: "/api/auth", url: SECURITY_SERVER, internalPrefix: "/auth" },
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
const FHK_FRONT_APP = process.env.FHK_FRONT_APP_URL;
const ALLOWED_ORIGINS = [FHK_FRONT_APP, SERVICES.TICKETING.FRONT_APP, SERVICES.FINANCIAL.FRONT_APP];

export {
    SECURITY_SERVER,
    ASSET_SERVER,
    ROUTING_MAP,
    PROTECTED_PATH_RE,
    PUBLIC_AUTH_PATH_RE,
    FHK_FRONT_APP,
    ALLOWED_ORIGINS,
};
