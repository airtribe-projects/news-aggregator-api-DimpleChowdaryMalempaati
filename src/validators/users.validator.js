const { newsProvider } = require('../config/env');

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

const supportedLanguagesByProvider = {
    gnews: ['ar', 'bn', 'zh', 'nl', 'en', 'fr', 'de', 'el', 'he', 'hi', 'id', 'it', 'ja', 'ml', 'mr', 'no', 'pt', 'pa', 'ro', 'ru', 'es', 'sv', 'ta', 'te', 'tr', 'uk'],
    newsapi: ['ar', 'de', 'en', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt', 'ru', 'sv', 'ud', 'zh']
};

function getSupportedLanguages() {
    return supportedLanguagesByProvider[newsProvider] || supportedLanguagesByProvider.gnews;
}

function validatePreferenceList(preferences) {
    if (!Array.isArray(preferences)) {
        return 'Preferences must be an array';
    }

    const hasInvalidPreference = preferences.some((preference) => (
        typeof preference !== 'string' || !preference.trim()
    ));

    if (hasInvalidPreference) {
        return 'Each preference must be a non-empty string';
    }

    return null;
}

function validateLanguageList(languages) {
    const listError = validatePreferenceList(languages);

    if (listError) {
        return listError;
    }

    const supportedLanguages = getSupportedLanguages();
    const hasInvalidLanguage = languages.some((language) => (
        !supportedLanguages.includes(language.trim().toLowerCase())
    ));

    if (hasInvalidLanguage) {
        return `Supported languages for ${newsProvider} are: ${supportedLanguages.join(', ')}`;
    }

    return null;
}

function validatePreferenceObject(preferences) {
    if (!isPlainObject(preferences)) {
        return 'Preferences must be an array or an object with categories and languages';
    }

    if (preferences.categories !== undefined) {
        const categoryError = validatePreferenceList(preferences.categories);

        if (categoryError) {
            return `Categories ${categoryError.toLowerCase()}`;
        }
    }

    if (preferences.languages !== undefined) {
        const languageError = validateLanguageList(preferences.languages);

        if (languageError) {
            return languageError;
        }
    }

    return null;
}

function validatePreferenceInput(body) {
    if (body.preferences !== undefined) {
        return Array.isArray(body.preferences)
            ? validatePreferenceList(body.preferences)
            : validatePreferenceObject(body.preferences);
    }

    if (body.categories !== undefined || body.languages !== undefined) {
        return validatePreferenceObject({
            categories: body.categories,
            languages: body.languages
        });
    }

    return null;
}

function normalizePreferenceList(preferences) {
    return preferences.map((preference) => preference.trim());
}

function normalizeLanguageList(languages) {
    return languages.map((language) => language.trim().toLowerCase());
}

function normalizePreferences(body) {
    if (Array.isArray(body.preferences)) {
        return normalizePreferenceList(body.preferences);
    }

    if (isPlainObject(body.preferences)) {
        return {
            categories: body.preferences.categories
                ? normalizePreferenceList(body.preferences.categories)
                : [],
            languages: body.preferences.languages
                ? normalizeLanguageList(body.preferences.languages)
                : []
        };
    }

    if (body.categories !== undefined || body.languages !== undefined) {
        return {
            categories: body.categories
                ? normalizePreferenceList(body.categories)
                : [],
            languages: body.languages
                ? normalizeLanguageList(body.languages)
                : []
        };
    }

    return [];
}

function validateSignup(body) {
    if (!isPlainObject(body)) {
        return 'Request body must be a JSON object';
    }

    const { name, email, password } = body;

    if (!name || !email || !password) {
        return 'Name, email, and password are required';
    }

    if (typeof name !== 'string' || !name.trim()) {
        return 'Name must be a non-empty string';
    }

    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
        return 'Please provide a valid email address';
    }

    if (typeof password !== 'string' || password.length < 6) {
        return 'Password must be at least 6 characters long';
    }

    if (
        body.preferences !== undefined
        || body.categories !== undefined
        || body.languages !== undefined
    ) {
        const preferenceError = validatePreferenceInput(body);

        if (preferenceError) {
            return preferenceError;
        }
    }

    return null;
}

function validateLogin(body) {
    if (!isPlainObject(body)) {
        return 'Request body must be a JSON object';
    }

    const { email, password } = body;

    if (!email || !password) {
        return 'Email and password are required';
    }

    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
        return 'Please provide a valid email address';
    }

    if (typeof password !== 'string') {
        return 'Password must be a string';
    }

    return null;
}

function validatePreferences(body) {
    if (!isPlainObject(body)) {
        return 'Request body must be a JSON object';
    }

    if (
        body.preferences === undefined
        && body.categories === undefined
        && body.languages === undefined
    ) {
        return 'Preferences, categories, or languages are required';
    }

    return validatePreferenceInput(body);
}

module.exports = {
    normalizePreferences,
    validateLogin,
    validatePreferences,
    validateSignup
};
