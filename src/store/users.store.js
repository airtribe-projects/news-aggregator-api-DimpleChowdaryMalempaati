const users = new Map();

function normalizeEmail(email) {
    return email.toLowerCase();
}

function getUserByEmail(email) {
    return users.get(normalizeEmail(email));
}

function hasUser(email) {
    return users.has(normalizeEmail(email));
}

function saveUser(user) {
    users.set(user.email, user);
    return user;
}

module.exports = {
    getUserByEmail,
    hasUser,
    normalizeEmail,
    saveUser
};
