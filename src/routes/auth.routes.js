const express = require('express');

const {
    login,
    signup
} = require('../controllers/users.controller');
const { authRateLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

router.post('/register', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);

module.exports = router;
