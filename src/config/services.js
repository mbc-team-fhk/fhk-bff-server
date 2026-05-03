import dotenv from 'dotenv';
dotenv.config();

function envOrDefault(envName, devValue) {
    return process.env[envName] || devValue;
}

export const PORT = Number(process.env.PORT || 4000);

/**
 * Core Services
 * @type {{SECURITY: *, ASSET: *}}
 */
export const CORE_SERVICES = {
    SECURITY: envOrDefault(
        'FHK_SECURITY_SERVER_URL',
        'http://localhost:9000'
    ),
    ASSET: envOrDefault(
        'FHK_ASSET_SERVER_URL',
        'http://localhost:9001'
    ),
};

/**
 * Ticketing
 * @type {{RESERVATION: *, PAYMENT: *}}
 */
export const TICKETING_SERVICES = {
    RESERVATION: envOrDefault(
        'FHK_TICKETING_RESERVATION_SERVICE_URL',
        'http://localhost:9101'
    ),
    PAYMENT: envOrDefault(
        'FHK_TICKETING_PAYMENT_SERVICE_URL',
        'http://localhost:9102'
    ),
};

/**
 * Chat
 * @type {{NOTIFICATION: *, CHAT: *}}
 */
export const CHATTING_SERVICES = {
    CHAT: envOrDefault(
        'FHK_CHATTING_CHATTING_SERVICE_URL',
        'http://localhost:9201'
    ),
    NOTIFICATION: envOrDefault(
        'FHK_CHATTING_NOTIFICATION_SERVICE_URL',
        'http://localhost:9202'
    ),
};

/**
 * Financial
 * @type {{PAYMENT: *, STORE: *, CUSTOMER: *}}
 */
export const FINANCIAL_SERVICES = {
    CUSTOMER: envOrDefault(
        'FHK_FINANCIAL_CUSTOMER_SERVICE_URL',
        'http://localhost:9301'
    ),
    PAYMENT: envOrDefault(
        'FHK_FINANCIAL_PAYMENT_SERVICE_URL',
        'http://localhost:9302'
    ),
    STORE: envOrDefault(
        'FHK_FINANCIAL_STORE_SERVICE_URL',
        'http://localhost:9303'
    ),
};
