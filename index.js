const app = require('./app');
const { port } = require('./src/config/env');

app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }

    return console.log(`Server is listening on ${port}`);
});
