# Notification API Reference for Ad-Hoc Tools

`base_uri = https://tools.ad-hoc.app/`

## Get Bearer Token

POST /api/auth/login

```
{
    "email" : "user_email@email.com",
    "passowrd": "usersPassWord"
}
```

Success response 200:

```
{
    "success": true,
    "data": {
        "accessToken": "eyJhbG[...].eyJpZC[...].VY1dt[...]",
        "refreshToken": "eyJhbG[...].eyJpZC[...].NDAC8w[...]"
    },
    "message": "Login successful",
    "requestId": "00000000-0000-0000-0000-000000000000"
}
```

All four endpoints require an Authorization: Bearer <token> header. All responses are JSON with the shape { success: boolean, data?: ... }. Errors return { success: false, error: string } with an appropriate HTTP status code.

## 1. List Recent Notifications

GET /api/notifications

Returns the authenticated user's notification history, newest first.

Query params (all optional):

Param Type Default Max
limit integer 50 100
offset integer 0 —
Success response 200:

```
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "body": "string",
      "data": { "key": "value" },
      "platform": "fcm",
      "status": "sent",
      "sent_at": "2026-06-25T12:00:00Z",
      "read_at": null
    }
  ]
}
```

read_at is null until marked read. data is an arbitrary JSON object or null.

## 2. Mark a Notification as Read

PATCH /api/notifications/:notificationId/read

Idempotent — safe to call multiple times. If already read, returns the original read_at unchanged.

URL param: notificationId — UUID of the notification

No request body.

Success response 200:

```
{
  "success": true,
  "data": {
    "id": "uuid",
    "read_at": "2026-06-25T12:01:00Z"
  }
}
```

Error responses:

400 — notificationId is not a valid UUID
404 — notification not found or belongs to a different user

## 3. Delete a Notification

DELETE /api/notifications/:notificationId

Permanently removes a single notification from the user's log.

URL param: notificationId — UUID of the notification

No request body.

Success response 204 — no body.

Error responses:

400 — notificationId is not a valid UUID
404 — notification not found or belongs to a different user

## 4. Unregister Device

DELETE /api/notifications/device

Removes the calling user's device from the push notification system. Use this on logout or when the user opts out of notifications.

Request body (JSON):

```
{
  "push_token": "FCM_TOKEN_STRING"
}
```

Success response 204 — no body.

Error responses:

400 — push_token is missing
404 — no device with that push token registered to this user
