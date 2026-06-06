require('dotenv').config({ quiet: true });

function getRequiredEnv(key) {
    const value = process.env[key];

    if (!value) {
        throw new Error(`${key} is required. Add it to your .env file.`);
    }

    return value;
}

function getNumberEnv(key, fallbackValue) {
    const value = Number(process.env[key]);

    return Number.isFinite(value) && value > 0 ? value : fallbackValue;
}

module.exports = {
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtSecret: getRequiredEnv('JWT_SECRET'),
    authRateLimitMax: getNumberEnv('AUTH_RATE_LIMIT_MAX', 20),
    authRateLimitWindowMs: getNumberEnv('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    newsApiKey: process.env.NEWS_API_KEY || process.env.GNEWS_API_KEY,
    newsCacheTtlMs: getNumberEnv('NEWS_CACHE_TTL_MS', 5 * 60 * 1000),
    newsCacheRefreshMs: getNumberEnv('NEWS_CACHE_REFRESH_MS', 15 * 60 * 1000),
    newsApiTimeoutMs: getNumberEnv('NEWS_API_TIMEOUT_MS', 10000),
    newsProvider: (process.env.NEWS_PROVIDER || 'gnews').toLowerCase(),
    newsRateLimitMax: getNumberEnv('NEWS_RATE_LIMIT_MAX', 60),
    newsRateLimitWindowMs: getNumberEnv('NEWS_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    port: process.env.PORT || 3000
};
