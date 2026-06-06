const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { jwtExpiresIn, jwtSecret } = require('../config/env');
const {
    getUserByEmail,
    hasUser,
    normalizeEmail,
    saveUser
} = require('../store/users.store');
const {
    normalizePreferences,
    validateLogin,
    validatePreferences,
    validateSignup
} = require('../validators/users.validator');

const saltRounds = 10;

async function signup(req, res) {
    const validationError = validateSignup(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const { name, email, password } = req.body;
    const preferences = normalizePreferences(req.body);
    const normalizedEmail = normalizeEmail(email.trim());

    if (hasUser(normalizedEmail)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        saveUser({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            preferences,
            readArticles: [],
            favoriteArticles: []
        });

        return res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to register user. Please try again.' });
    }
}

async function login(req, res) {
    const validationError = validateLogin(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const { email, password } = req.body;
    const user = getUserByEmail(email.trim());

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });

        return res.status(200).json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to login. Please try again.' });
    }
}

function getPreferences(req, res) {
    return res.status(200).json({
        message: 'Preferences retrieved successfully',
        preferences: req.user.preferences
    });
}

function updatePreferences(req, res) {
    const validationError = validatePreferences(req.body);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const preferences = normalizePreferences(req.body);
    req.user.preferences = preferences;

    return res.status(200).json({
        message: 'Preferences updated successfully',
        preferences
    });
}

module.exports = {
    getPreferences,
    login,
    signup,
    updatePreferences
};
