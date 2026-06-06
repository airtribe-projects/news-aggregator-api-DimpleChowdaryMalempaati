# Postman API Testing Guide

This guide explains how to test the News Aggregator API using Postman.

## Before You Start

Make sure dependencies are installed:

```bash
npm install
```

Make sure `.env` exists in the project root:

```env
PORT=3000
JWT_SECRET=your_random_jwt_secret
JWT_EXPIRES_IN=1h
NEWS_PROVIDER=gnews
NEWS_API_KEY=your_news_api_key
NEWS_CACHE_TTL_MS=300000
NEWS_API_TIMEOUT_MS=10000
NEWS_CACHE_REFRESH_MS=900000
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
NEWS_RATE_LIMIT_WINDOW_MS=900000
NEWS_RATE_LIMIT_MAX=60
```

Start the server:

```bash
npm start
```

Base URL:

```text
http://localhost:3000
```

## Recommended Postman Setup

Create a new Postman collection named:

```text
News Aggregator API
```

Create a collection variable:

```text
baseUrl = http://localhost:3000
```

After login, create another collection variable:

```text
token = paste_login_token_here
```

For protected routes, use this header:

```text
Authorization: Bearer {{token}}
```

## Test Order

Test the API in this order because users are stored in memory.

If you restart the server, register and login again.

## 1. Health Check

Request:

```text
GET {{baseUrl}}/
```

Expected response:

```json
{
  "message": "News Aggregator API"
}
```

## 2. Register User

Request:

```text
POST {{baseUrl}}/register
```

Headers:

```text
Content-Type: application/json
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

Expected response:

```json
{
  "message": "User registered successfully"
}
```

Useful error checks:

- Missing fields should return `400`.
- Invalid email should return `400`.
- Password shorter than 6 characters should return `400`.
- Registering the same email twice should return `409`.

## 3. Login User

Request:

```text
POST {{baseUrl}}/login
```

Headers:

```text
Content-Type: application/json
```

Body -> raw -> JSON:

```json
{
  "email": "test@example.com",
  "password": "Secret123"
}
```

Expected response:

```json
{
  "message": "Login successful",
  "token": "jwt_token_here"
}
```

Copy the `token` value and save it as the Postman collection variable `token`.

Useful error checks:

- Wrong password should return `401`.
- Missing email or password should return `400`.

## 4. Get Preferences

Request:

```text
GET {{baseUrl}}/preferences
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "message": "Preferences retrieved successfully",
  "preferences": {
    "categories": ["technology", "business"],
    "languages": ["en"]
  }
}
```

Useful error checks:

- No token should return `401`.
- Invalid token should return `401`.

## 5. Update Preferences

Request:

```text
PUT {{baseUrl}}/preferences
```

Headers:

```text
Content-Type: application/json
Authorization: Bearer {{token}}
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

Expected response:

```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "categories": ["sports", "technology"],
    "languages": ["en"]
  }
}
```

The API also accepts the older array format:

```json
{
  "preferences": ["sports", "technology"]
}
```

Only supported language codes are accepted. For `gnews`, supported examples include `en`, `hi`, `fr`, `de`, `es`, `it`, `ja`, and `zh`. Unsupported values return a validation error listing all allowed codes.

Useful error checks:

- `preferences`, `categories`, or `languages` missing should return `400`.
- `preferences` in the wrong format should return `400`.
- Empty preference strings should return `400`.
- Invalid language codes should return `400`.

## 6. Fetch Personalized News

Request:

```text
GET {{baseUrl}}/news?page=1&limit=10
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

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

Copy one article `id`. You will need it for read/favorite testing.

Pagination notes:

- `page` is optional and defaults to `1`.
- `limit` is optional and defaults to `10`.
- `limit` must be between `1` and `50`.

Useful error checks:

- Missing token should return `401`.
- Missing `NEWS_API_KEY` should return `503`.
- Invalid news API key may return a news API authentication error.
- API limit reached may return `429`.

## 7. Search News

Request:

```text
GET {{baseUrl}}/news/search/technology?page=1&limit=10
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

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

You can replace `technology` with any keyword.

## 8. Mark Article As Read

Use an article `id` from `GET /news` or `GET /news/search/:keyword`.

Request:

```text
POST {{baseUrl}}/news/article_id/read
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "message": "Article marked as read",
  "article": {
    "id": "article_id"
  }
}
```

If the article id is unknown, the API returns `404`.

## 9. Mark Article As Favorite

Use an article `id` from `GET /news` or `GET /news/search/:keyword`.

Request:

```text
POST {{baseUrl}}/news/article_id/favorite
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "message": "Article marked as favorite",
  "article": {
    "id": "article_id"
  }
}
```

If the article id is unknown, the API returns `404`.

## 10. Get Read Articles

Request:

```text
GET {{baseUrl}}/news/read
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "message": "Read articles retrieved successfully",
  "news": []
}
```

## 11. Get Favorite Articles

Request:

```text
GET {{baseUrl}}/news/favorites
```

Headers:

```text
Authorization: Bearer {{token}}
```

Expected response:

```json
{
  "message": "Favorite articles retrieved successfully",
  "news": []
}
```

## Common Postman Issues

If you get `Authorization header is required`, add the `Authorization` header.

If you get `Authorization header must be in the format: Bearer <token>`, make sure the value starts with `Bearer ` followed by the token.

If you get `Invalid token`, login again and copy the new token.

If you get `NEWS_API_KEY is missing`, add your news API key to `.env` and restart the server.

If news does not update after changing `.env`, restart the server.

If registered users disappear, the server was restarted. This project uses in-memory storage, so register and login again.

If you get `Too many authentication requests. Please try again later.`, wait for the auth rate-limit window to reset or increase `AUTH_RATE_LIMIT_MAX` in `.env` for local testing.

If you get `Too many news requests. Please try again later.`, wait for the news rate-limit window to reset or increase `NEWS_RATE_LIMIT_MAX` in `.env` for local testing.
