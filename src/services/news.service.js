const axios = require('axios');
const crypto = require('crypto');

const {
    newsApiKey,
    newsApiTimeoutMs,
    newsCacheRefreshMs,
    newsCacheTtlMs,
    newsProvider
} = require('../config/env');

const newsCache = new Map();
const articleIndex = new Map();

class NewsServiceError extends Error {
    constructor(message, statusCode = 502) {
        super(message);
        this.name = 'NewsServiceError';
        this.statusCode = statusCode;
    }
}

async function getCachedNews(cacheKey) {
    cleanupExpiredCache();

    const cached = newsCache.get(cacheKey);

    if (!cached) {
        return null;
    }

    return cached.articles;
}

async function setCachedNews(cacheKey, query, language, articles) {
    articles.forEach((article) => {
        articleIndex.set(article.id, article);
    });

    newsCache.set(cacheKey, {
        createdAt: Date.now(),
        language,
        query,
        articles
    });
}

function rebuildArticleIndex() {
    articleIndex.clear();

    Array.from(newsCache.values()).forEach((cached) => {
        cached.articles.forEach((article) => {
            articleIndex.set(article.id, article);
        });
    });
}

function cleanupExpiredCache() {
    let removedExpiredEntry = false;

    Array.from(newsCache.entries()).forEach(([cacheKey, cached]) => {
        if (Date.now() - cached.createdAt > newsCacheTtlMs) {
            newsCache.delete(cacheKey);
            removedExpiredEntry = true;
        }
    });

    if (removedExpiredEntry) {
        rebuildArticleIndex();
    }
}

function getPreferenceDetails(preferences) {
    if (Array.isArray(preferences)) {
        return {
            categories: preferences,
            languages: []
        };
    }

    if (preferences && typeof preferences === 'object') {
        return {
            categories: Array.isArray(preferences.categories) ? preferences.categories : [],
            languages: Array.isArray(preferences.languages) ? preferences.languages : []
        };
    }

    return {
        categories: [],
        languages: []
    };
}

function buildSearchQuery(preferences) {
    const preferenceDetails = getPreferenceDetails(preferences);
    const topics = preferenceDetails.categories
        .filter((preference) => typeof preference === 'string' && preference.trim())
        .map((preference) => preference.trim());

    return topics.length ? topics.join(' OR ') : 'general';
}

function getPreferredLanguage(preferences) {
    const preferenceDetails = getPreferenceDetails(preferences);
    const [language] = preferenceDetails.languages
        .filter((preference) => typeof preference === 'string' && preference.trim())
        .map((preference) => preference.trim().toLowerCase());

    return language || 'en';
}

function createArticleId(article) {
    const source = article.url || `${article.title || ''}:${article.publishedAt || ''}`;

    return crypto
        .createHash('sha256')
        .update(source)
        .digest('hex')
        .slice(0, 16);
}

function normalizeArticle(article) {
    const normalizedArticle = {
        title: article.title || null,
        description: article.description || article.content || null,
        source: article.source && typeof article.source === 'object'
            ? article.source.name
            : article.source || null,
        url: article.url || null,
        imageUrl: article.image || article.urlToImage || null,
        publishedAt: article.publishedAt || null
    };

    return {
        id: createArticleId(normalizedArticle),
        ...normalizedArticle
    };
}

function buildCacheKey(type, query, language) {
    return `${newsProvider}:${type}:${language}:${query.toLowerCase()}`;
}

function buildNewsApiRequest(query, language) {
    if (newsProvider === 'newsapi') {
        return {
            url: 'https://newsapi.org/v2/everything',
            params: {
                q: query,
                apiKey: newsApiKey,
                language,
                pageSize: 20,
                sortBy: 'publishedAt'
            }
        };
    }

    if (newsProvider === 'gnews') {
        return {
            url: 'https://gnews.io/api/v4/search',
            params: {
                q: query,
                apikey: newsApiKey,
                lang: language,
                max: 10
            }
        };
    }

    throw new NewsServiceError('Invalid NEWS_PROVIDER. Use either "gnews" or "newsapi".', 500);
}

function getNewsApiFailure(error) {
    if (error.code === 'ECONNABORTED') {
        return {
            message: 'News API request timed out. Please try again.',
            statusCode: 504
        };
    }

    if (!error.response) {
        return {
            message: 'Unable to connect to the news API. Please try again later.',
            statusCode: 502
        };
    }

    if (error.response.status === 401 || error.response.status === 403) {
        return {
            message: 'News API authentication failed. Please check your NEWS_API_KEY.',
            statusCode: 502
        };
    }

    if (error.response.status === 429) {
        return {
            message: 'News API rate limit reached. Please try again later.',
            statusCode: 429
        };
    }

    if (error.response.status >= 400 && error.response.status < 500) {
        return {
            message: 'News API rejected the request. Please check your news provider configuration.',
            statusCode: 502
        };
    }

    return {
        message: 'News API is currently unavailable. Please try again later.',
        statusCode: 502
    };
}

async function fetchArticlesFromApi(query, language) {
    if (!newsApiKey) {
        throw new NewsServiceError('NEWS_API_KEY is missing. Add your news API key to the .env file.', 503);
    }

    const requestConfig = buildNewsApiRequest(query, language);
    const response = await axios.get(requestConfig.url, {
        params: requestConfig.params,
        timeout: newsApiTimeoutMs
    });

    return (response.data.articles || []).map(normalizeArticle);
}

async function getArticlesWithCache(type, query, language) {
    const cacheKey = buildCacheKey(type, query, language);
    const cachedArticles = await getCachedNews(cacheKey);

    if (cachedArticles) {
        return cachedArticles;
    }

    try {
        const articles = await fetchArticlesFromApi(query, language);
        await setCachedNews(cacheKey, query, language, articles);
        return articles;
    } catch (error) {
        if (error instanceof NewsServiceError) {
            throw error;
        }

        const failure = getNewsApiFailure(error);
        throw new NewsServiceError(failure.message, failure.statusCode);
    }
}

async function fetchNews(preferences) {
    const query = buildSearchQuery(preferences);
    const language = getPreferredLanguage(preferences);

    return getArticlesWithCache('preferences', query, language);
}

async function searchNews(keyword, preferences) {
    const query = keyword.trim();
    const language = getPreferredLanguage(preferences);

    if (!query) {
        throw new NewsServiceError('Search keyword is required', 400);
    }

    return getArticlesWithCache('search', query, language);
}

function getArticleById(articleId) {
    cleanupExpiredCache();

    return articleIndex.get(articleId);
}

async function refreshCachedNews() {
    cleanupExpiredCache();

    if (!newsApiKey || newsCache.size === 0) {
        return;
    }

    const cachedEntries = Array.from(newsCache.entries());

    await Promise.all(cachedEntries.map(async ([cacheKey, cached]) => {
        try {
            const articles = await fetchArticlesFromApi(cached.query, cached.language);
            await setCachedNews(cacheKey, cached.query, cached.language, articles);
        } catch (error) {
            // Keep the last successful cache if the background refresh fails.
        }
    }));
}

function startCacheRefreshJob() {
    const timer = setInterval(() => {
        refreshCachedNews();
    }, newsCacheRefreshMs);

    if (typeof timer.unref === 'function') {
        timer.unref();
    }
}

startCacheRefreshJob();

module.exports = {
    fetchNews,
    getArticleById,
    searchNews
};
