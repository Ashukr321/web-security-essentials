# API Endpoints

## Base URL

```
Development: http://localhost:8000/api
Staging:     https://api.staging.example.com
Production:  https://api.example.com
```

## Authentication

| Method | Endpoint              | Description           | Auth Required |
| ------ | --------------------- | --------------------- | ------------- |
| POST   | `/auth/login`         | User login            | No            |
| POST   | `/auth/register`      | User registration     | No            |
| POST   | `/auth/forgot-password` | Request password reset | No          |
| POST   | `/auth/reset-password`  | Reset password        | No            |
| POST   | `/auth/refresh`       | Refresh access token  | Yes (refresh) |
| POST   | `/auth/logout`        | User logout           | Yes           |

## Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Error Response Format

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```
