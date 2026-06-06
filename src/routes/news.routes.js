const express = require('express');

const {
    getFavoriteArticles,
    getNews,
    getReadArticles,
    markArticleAsFavorite,
    markArticleAsRead,
    searchNewsByKeyword
} = require('../controllers/news.controller');
const authenticateToken = require('../middleware/auth.middleware');
const { newsRateLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(newsRateLimiter);

router.get('/', getNews);
router.get('/read', getReadArticles);
router.get('/favorites', getFavoriteArticles);
router.get('/search/:keyword', searchNewsByKeyword);
router.post('/:id/read', markArticleAsRead);
router.post('/:id/favorite', markArticleAsFavorite);

module.exports = router;
