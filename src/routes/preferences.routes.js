const express = require('express');

const {
    getPreferences,
    updatePreferences
} = require('../controllers/users.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, getPreferences);
router.put('/', authenticateToken, updatePreferences);

module.exports = router;
