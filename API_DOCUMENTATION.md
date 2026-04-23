# Bharat Sangam Backend Documentation

## Docs URLs

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/api-docs/openapi.json`
- Postman collection: `/api-docs/postman-collection.json`

## Base URL

- Local: `http://localhost:8001`
- API base: `/api/v1`

## Auth

- Admin-protected endpoints use `Authorization: Bearer <admin access token>`.
- Ticket verification currently validates volunteer tokens first, so use the volunteer JWT returned by `/api/v1/admin/login-volunteer`.

## Main Endpoint Groups

- Admin auth: register admin, login admin, create volunteer, volunteer login, Cloudinary signature.
- Admin resources: booking types, venues, artists, categories.
- Public content: latest event, latest event capacity, ticket creation, ticket detail, feedback, contact, subscriber.

## Request and Response Pattern

Most endpoints return:

```json
{
  "status": true,
  "message": "success",
  "data": {}
}
```

Exceptions:

- `/health` returns a custom health payload.
- `/test` returns `{ "success": true, "message": "..." }`.
- `/api/v1/booking/create-ticket` returns `{ "success": true, "message": "...", "bookingId": "BBS123456" }`.
- Some invalid ticket-detail and ticket-verify cases currently return HTML strings from the controller.

## Environment Variables

The codebase currently relies on these environment values:

- `PORT`
- `DB_URI`
- `ACCESS_SECRET`
- `REFRESH_SECRET`
- `VOLUNTEER_SECRET`
- `CLOUD_SECRET`
- `CLOUD_KEY`
- `CLOUD_NAME`
- Mail, Redis, and queue-related variables used by worker/config files

## Known Codebase Caveats Reflected In The Docs

- Category admin routes use `accessMiddleware` without passing explicit roles, so they may reject requests until that middleware call is corrected.
- `GET /api/v1/venue/all` is mounted but currently points to an unfinished controller.
- Feedback and subscriber creation currently accept only `@gmail.com` addresses.
- Ticket verification is documented around the current implementation, not an idealized future state.

## Importing The Collection

1. Open Postman.
2. Import `docs/postman_collection.json` or use `/api-docs/postman-collection.json`.
3. Set `baseUrl`, `adminToken`, `volunteerToken`, and resource id variables before testing protected flows.
