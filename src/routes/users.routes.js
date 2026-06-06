const express = require('express');

const authenticateToken = require('../middleware/auth.middleware');
const {
    getPreferences,
    login,
    signup,
    updatePreferences
} = require('../controllers/users.controller');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, updatePreferences);

module.exports = router;
