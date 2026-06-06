const {
    fetchNews,
    getArticleById,
    searchNews
} = require('../services/news.service');

function ensureArticleLists(user) {
    if (!Array.isArray(user.readArticles)) {
        user.readArticles = [];
    }

    if (!Array.isArray(user.favoriteArticles)) {
        user.favoriteArticles = [];
    }
}

function getStoredArticles(articleIds) {
    return articleIds
        .map((articleId) => getArticleById(articleId))
        .filter(Boolean);
}

function addArticleToUserList(user, listName, articleId) {
    ensureArticleLists(user);

    const article = getArticleById(articleId);

    if (!article) {
        return null;
    }

    if (!user[listName].includes(articleId)) {
        user[listName].push(articleId);
    }

    return article;
}

function handleNewsError(res, error) {
    return res.status(error.statusCode || 502).json({
        error: error.message || 'Unable to fetch news articles. Please try again.'
    });
}

function getPagination(query) {
    const page = query.page === undefined ? 1 : Number(query.page);
    const limit = query.limit === undefined ? 10 : Number(query.limit);

    if (!Number.isInteger(page) || page < 1) {
        return { error: 'Page must be a positive integer' };
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        return { error: 'Limit must be a positive integer between 1 and 50' };
    }

    return { page, limit };
}

function paginateArticles(articles, page, limit) {
    const totalItems = articles.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;

    return {
        articles: articles.slice(startIndex, startIndex + limit),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
}

async function getNews(req, res) {
    try {
        const paginationInput = getPagination(req.query);

        if (paginationInput.error) {
            return res.status(400).json({ error: paginationInput.error });
        }

        const news = await fetchNews(req.user.preferences);
        const paginatedNews = paginateArticles(news, paginationInput.page, paginationInput.limit);

        return res.status(200).json({
            message: 'News articles fetched successfully',
            news: paginatedNews.articles,
            pagination: paginatedNews.pagination
        });
    } catch (error) {
        return handleNewsError(res, error);
    }
}

async function searchNewsByKeyword(req, res) {
    try {
        const paginationInput = getPagination(req.query);

        if (paginationInput.error) {
            return res.status(400).json({ error: paginationInput.error });
        }

        const news = await searchNews(req.params.keyword, req.user.preferences);
        const paginatedNews = paginateArticles(news, paginationInput.page, paginationInput.limit);

        return res.status(200).json({
            message: 'News search completed successfully',
            news: paginatedNews.articles,
            pagination: paginatedNews.pagination
        });
    } catch (error) {
        return handleNewsError(res, error);
    }
}

function markArticleAsRead(req, res) {
    const article = addArticleToUserList(req.user, 'readArticles', req.params.id);

    if (!article) {
        return res.status(404).json({ error: 'Article not found. Fetch or search news before marking it.' });
    }

    return res.status(200).json({
        message: 'Article marked as read',
        article
    });
}

function markArticleAsFavorite(req, res) {
    const article = addArticleToUserList(req.user, 'favoriteArticles', req.params.id);

    if (!article) {
        return res.status(404).json({ error: 'Article not found. Fetch or search news before marking it.' });
    }

    return res.status(200).json({
        message: 'Article marked as favorite',
        article
    });
}

function getReadArticles(req, res) {
    ensureArticleLists(req.user);

    return res.status(200).json({
        message: 'Read articles retrieved successfully',
        news: getStoredArticles(req.user.readArticles)
    });
}

function getFavoriteArticles(req, res) {
    ensureArticleLists(req.user);

    return res.status(200).json({
        message: 'Favorite articles retrieved successfully',
        news: getStoredArticles(req.user.favoriteArticles)
    });
}

module.exports = {
    getFavoriteArticles,
    getNews,
    getReadArticles,
    markArticleAsFavorite,
    markArticleAsRead,
    searchNewsByKeyword
};
