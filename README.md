[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=24085358&assignment_repo_type=AssignmentRepo)

# News Aggregator API

A RESTful API for a personalized news aggregator built with Node.js, Express.js, bcrypt, JWT, axios, and an external news API.

The app supports user registration, login, JWT-protected routes, user news preferences, external news fetching, caching, article search, and read/favorite article tracking.

For step-by-step Postman testing instructions, see [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md).

## Features

- User registration with password hashing
- User login with JWT token generation
- JWT authentication middleware
- User preferences management
- External news API integration using axios
- News caching to reduce external API calls
- Background cache refresh
- Mark articles as read or favorite
- Retrieve read and favorite articles
- Search news by keyword
- Clear JSON success and error responses

## Tech Stack

- Node.js
- Express.js
- bcrypt
- jsonwebtoken
- axios
- dotenv

## Project Structure

```text
.
├── app.js
├── index.js
├── src
│   ├── config
│   │   └── env.js
│   ├── controllers
│   │   ├── news.controller.js
│   │   └── users.controller.js
│   ├── middleware
│   │   └── auth.middleware.js
│   ├── routes
│   │   ├── auth.routes.js
│   │   ├── news.routes.js
│   │   ├── preferences.routes.js
│   │   └── users.routes.js
│   ├── services
│   │   └── news.service.js
│   ├── store
│   │   └── users.store.js
│   └── validators
│       └── users.validator.js
├── test
│   └── server.test.js
├── .env.example
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- A news API key from one of these providers:
  - GNews API
  - NewsAPI

The current code supports `gnews` and `newsapi` through the `NEWS_PROVIDER` value.

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root. You can copy `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your values:

```env
PORT=3000
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
NEWS_PROVIDER=gnews
NEWS_API_KEY=your_news_api_key_here
NEWS_CACHE_TTL_MS=300000
NEWS_API_TIMEOUT_MS=10000
NEWS_CACHE_REFRESH_MS=900000
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
NEWS_RATE_LIMIT_WINDOW_MS=900000
NEWS_RATE_LIMIT_MAX=60
```

Important:

- Do not commit `.env`.
- `.env` is already listed in `.gitignore`.
- Restart the server after changing `.env`.

## Environment Variables

`PORT`: Port where the server runs. Default example is `3000`.

`JWT_SECRET`: Secret used to sign and verify JWT tokens. Use a long random value.

`JWT_EXPIRES_IN`: JWT expiry time, such as `1h`.

`NEWS_PROVIDER`: News provider to use. Supported values are `gnews` and `newsapi`.

`NEWS_API_KEY`: API key from your selected news provider.

`NEWS_CACHE_TTL_MS`: How long cached news remains valid. `300000` is 5 minutes.

`NEWS_API_TIMEOUT_MS`: How long to wait for the external news API. `10000` is 10 seconds.

`NEWS_CACHE_REFRESH_MS`: How often cached news is refreshed in the background. `900000` is 15 minutes.

`AUTH_RATE_LIMIT_WINDOW_MS`: Time window for registration/login rate limiting. `900000` is 15 minutes.

`AUTH_RATE_LIMIT_MAX`: Maximum registration/login requests allowed per IP during the auth rate-limit window.

`NEWS_RATE_LIMIT_WINDOW_MS`: Time window for news endpoint rate limiting. `900000` is 15 minutes.

`NEWS_RATE_LIMIT_MAX`: Maximum news requests allowed per IP during the news rate-limit window.

## Run The Server

```bash
npm start
```

The API will run at:

```text
http://localhost:3000
```

## API Testing Flow

Use Postman and test in this order.

### 1. Register

`POST /register`

URL:

```text
http://localhost:3000/register
```

Body -> raw -> JSON:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Secret123",
  "preferences": {
    "categories": ["technology", "business"],
    "languages": ["en"]
  }
}
```

Success response:

```json
{
  "message": "User registered successfully"
}
```

### 2. Login

`POST /login`

URL:

```text
http://localhost:3000/login
```

Body -> raw -> JSON:

```json
{
  "email": "test@example.com",
  "password": "Secret123"
}
```

Success response:

```json
{
  "message": "Login successful",
  "token": "your_jwt_token"
}
```

Copy the token. Use it for protected routes.

### Authorization Header

For protected routes, add this header in Postman:

```text
Authorization: Bearer your_jwt_token
```

## Preferences Endpoints

### Get Preferences

`GET /preferences`

URL:

```text
http://localhost:3000/preferences
```

Success response:

```json
{
  "message": "Preferences retrieved successfully",
  "preferences": {
    "categories": ["technology", "business"],
    "languages": ["en"]
  }
}
```

### Update Preferences

`PUT /preferences`

URL:

```text
http://localhost:3000/preferences
```

Body -> raw -> JSON:

```json
{
  "preferences": {
    "categories": ["sports", "technology"],
    "languages": ["en"]
  }
}
```

Success response:

```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "categories": ["sports", "technology"],
    "languages": ["en"]
  }
}
```

For backward compatibility, the API also accepts the older format:

```json
{
  "preferences": ["sports", "technology"]
}
```

Only supported language codes are accepted. For `gnews`, supported examples include `en`, `hi`, `fr`, `de`, `es`, `it`, `ja`, and `zh`. Unsupported values return a validation error listing all allowed codes.

## News Endpoints

All news routes require the `Authorization` header.

### Fetch Personalized News

`GET /news`

URL:

```text
http://localhost:3000/news?page=1&limit=10
```

Success response:

```json
{
  "message": "News articles fetched successfully",
  "news": [
    {
      "id": "article_id",
      "title": "Article title",
      "description": "Article description",
      "source": "Source name",
      "url": "https://example.com/article",
      "imageUrl": "https://example.com/image.jpg",
      "publishedAt": "2026-06-06T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

`page` and `limit` are optional. `limit` must be between `1` and `50`.

### Search News

`GET /news/search/:keyword`

Example:

```text
http://localhost:3000/news/search/technology?page=1&limit=10
```

Success response:

```json
{
  "message": "News search completed successfully",
  "news": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Mark Article As Read

First call `GET /news` or `GET /news/search/:keyword`, then copy an article `id`.

`POST /news/:id/read`

Example:

```text
http://localhost:3000/news/article_id/read
```

Success response:

```json
{
  "message": "Article marked as read",
  "article": {
    "id": "article_id"
  }
}
```

### Mark Article As Favorite

First call `GET /news` or `GET /news/search/:keyword`, then copy an article `id`.

`POST /news/:id/favorite`

Example:

```text
http://localhost:3000/news/article_id/favorite
```

Success response:

```json
{
  "message": "Article marked as favorite",
  "article": {
    "id": "article_id"
  }
}
```

### Get Read Articles

`GET /news/read`

URL:

```text
http://localhost:3000/news/read
```

Success response:

```json
{
  "message": "Read articles retrieved successfully",
  "news": []
}
```

### Get Favorite Articles

`GET /news/favorites`

URL:

```text
http://localhost:3000/news/favorites
```

Success response:

```json
{
  "message": "Favorite articles retrieved successfully",
  "news": []
}
```

## Error Responses

Examples of common errors:

Missing or invalid input:

```json
{
  "error": "Please provide a valid email address"
}
```

Missing token:

```json
{
  "error": "Authorization header is required"
}
```

Invalid token format:

```json
{
  "error": "Authorization header must be in the format: Bearer <token>"
}
```

Missing news API key:

```json
{
  "error": "NEWS_API_KEY is missing. Add your news API key to the .env file."
}
```

Unknown route:

```json
{
  "error": "Route not found"
}
```

Too many requests:

```json
{
  "error": "Too many news requests. Please try again later."
}
```

## Notes

- This project uses in-memory storage.
- Users, preferences, read articles, favorite articles, and cache are reset when the server restarts.
- No database is required for the current assignment.
- The external news API requires a valid API key.
- Cached news is refreshed periodically in the background.
- Expired cache entries are cleared, and article IDs from expired cache entries are removed from the in-memory article index.
- The project currently uses CommonJS syntax with `require` and `module.exports`.

## Run Tests

```bash
npm test
```
