import {
    CORE_SERVICES,
    TICKETING_SERVICES,
    CHATTING_SERVICES,
    FINANCIAL_SERVICES,
} from './services.js';

export const ROUTING_MAP = [
    // Asset
    {
        prefix: '/api/asset',
        target: CORE_SERVICES.ASSET,
        protected: false,
    },

    // Ticketing
    {
        prefix: '/api/ticketing/member',
        target: TICKETING_SERVICES.MEMBER,
        protected: true,
    },
    {
        prefix: '/api/ticketing/movie',
        target: TICKETING_SERVICES.MOVIE,
        protected: false,
    },
    {
        prefix: '/api/ticketing/payment',
        target: TICKETING_SERVICES.PAYMENT,
        protected: true,
    },
    {
        prefix: '/api/ticketing/reservation',
        target: TICKETING_SERVICES.RESERVATION,
        protected: true,
    },
    {
        prefix: '/api/ticketing/ticket',
        target: TICKETING_SERVICES.TICKET,
        protected: true,
    },

    // Chatting
    {
        prefix: '/api/chatting/chat',
        target: CHATTING_SERVICES.CHAT,
        protected: true,
    },
    {
        prefix: '/api/chatting/notification',
        target: CHATTING_SERVICES.NOTIFICATION,
        protected: true,
    },

    // Financial
    {
        prefix: '/api/financial/client',
        target: FINANCIAL_SERVICES.CLIENT,
        protected: true,
    },
    {
        prefix: '/api/financial/payment',
        target: FINANCIAL_SERVICES.PAYMENT,
        protected: true,
    },
];