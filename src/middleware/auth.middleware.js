const jwt = require('jsonwebtoken');

const { jwtSecret } = require('../config/env');
const { getUserByEmail } = require('../store/users.store');

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is required' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Authorization header must be in the format: Bearer <token>' });
    }

    try {
        const payload = jwt.verify(token, jwtSecret);
        const user = getUserByEmail(payload.email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired. Please login again.' });
        }

        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = authenticateToken;
