const { rateLimit } = require('express-rate-limit');

const {
    authRateLimitMax,
    authRateLimitWindowMs,
    newsRateLimitMax,
    newsRateLimitWindowMs
} = require('../config/env');

function createJsonRateLimiter({ max, message, windowMs }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => res.status(429).json({ error: message })
    });
}

const authRateLimiter = createJsonRateLimiter({
    windowMs: authRateLimitWindowMs,
    max: authRateLimitMax,
    message: 'Too many authentication requests. Please try again later.'
});

const newsRateLimiter = createJsonRateLimiter({
    windowMs: newsRateLimitWindowMs,
    max: newsRateLimitMax,
    message: 'Too many news requests. Please try again later.'
});

module.exports = {
    authRateLimiter,
    newsRateLimiter
};
