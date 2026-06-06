const express = require('express');

const authRoutes = require('./src/routes/auth.routes');
const newsRoutes = require('./src/routes/news.routes');
const preferencesRoutes = require('./src/routes/preferences.routes');
const usersRoutes = require('./src/routes/users.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ message: 'News Aggregator API' });
});

app.use(authRoutes);
app.use('/preferences', preferencesRoutes);
app.use('/users', usersRoutes);
app.use('/news', newsRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON body. Please check your request format.' });
    }

    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;