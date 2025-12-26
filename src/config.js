import dotenv from 'dotenv';
dotenv.config();

// 서비스 URL 환경 변수
const SECURITY_SERVER = "http://fhk-security-server:8080";
const ASSET_SERVER = "http://fhk-asset-server:8080";


const SERVICES = {
    TICKETING: {
        FRONT_APP: "http://fhk-ticketing-front-app:80",
        MEMBER: "http://fhk-ticketing-member-service:8080",
        MOVIE: "http://fhk-ticketing-movie-service:8080",
        PAYMENT: "http://fhk-ticketing-payment-service:8080",
        RESERVATION: "http://fhk-ticketing-reservation-service:8080",
        TICKET: "http://fhk-ticketing-ticket-service:8080",
    },
/*    CHATTING: {
        FRONT_APP: "http://fhk-chatting-front-app:80",
        CHAT: "http://fhk-chatting-chat-service:8080",
        NOTIFICATION: "http://fhk-chatting-notification-service:8080",
    },*/
    FINANCIAL: {
        FRONT_APP: "http://fhk-financial-front-app:80",
        CUSTOMER: "http://fhk-financial-customer-service:8080",
        MERCHANT: "http://fhk-financial-merchant-service:8080",
        PAYMENT: "http://fhk-financial-payment-service:8080",
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
        { sub: "customer", url: SERVICES.FINANCIAL.CUSTOMER, internal: "/customer" },
        { sub: "merchant", url: SERVICES.FINANCIAL.MERCHANT, internal: "/merchant" },
        { sub: "payment", url: SERVICES.FINANCIAL.PAYMENT, internal: "/payment" },
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
const FHK_FRONT_APP = "https://fhk-portal-front-app:80";
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
