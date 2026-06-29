# Immutable Audit Log Service

## What This Service Does

This service records audit events in a permanent, queryable log. Events can be written and read, but they cannot be updated or deleted through the API. This is by design — an audit log is only trustworthy if its records are immutable.

## Setup & Configuration

Create a `.env` file using `.env.example` as a guide:

```bash
PORT=3000
APP_STAGE=development
DATABASE_URL=postgres://username:password@localhost:5432/immutable_audit_log
SERVER_SECRET=replace-with-a-long-random-secret
```

`PORT`, `DATABASE_URL`, and `SERVER_SECRET` are read from the environment instead of being hardcoded.

## Database Setup

This service requires a running PostgreSQL instance. Create the database before starting the server:

```bash
createdb your_db_name
```

Or create it through pgAdmin: right-click **Databases → Create → Database** and name it `your_db_name`.

Update `DATABASE_URL` in your `.env` file with your actual credentials:

```bash
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/your_db_name
```

Migrations run automatically when the server starts. A fresh, empty database is handled gracefully — the `events` table will be created on first run if it does not already exist.

## Running the Server

Start the development server with:

```bash
npm run dev
```

For a one-time start without watch mode:

```bash
npm start
```

## Phase 1 API

### Health Check

```bash
curl http://localhost:3000/health
```

Successful response:

```json
{
  "status": "OK",
  "timestamp": "2026-06-26T10:15:30.123Z",
  "service": "Immutable Audit Log Service API"
}
```

### The Event Shape

Clients may send these fields when recording an event:

```json
{
  "actor_id": "user_123",
  "action": "delete",
  "resource_type": "invoice",
  "resource_id": "inv_456",
  "before_state": {
    "status": "draft"
  },
  "after_state": {
    "status": "deleted"
  }
}
```

Required fields:

- `actor_id`
- `action`
- `resource_type`
- `resource_id`

Optional fields:

- `before_state`
- `after_state`

The client must not choose `id` or `timestamp`. The server assigns both when the event is written. Timestamps use ISO 8601 UTC format, for example `2026-06-26T10:15:30.123Z`.

`ip_address` and `user_agent` are captured automatically from the incoming request. The client cannot provide or override these values. This ensures rogue clients cannot provide wrong `ip_address` and `user_agent`.

### Recording an Event

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "actor_id": "user_123",
    "action": "delete",
    "resource_type": "invoice",
    "resource_id": "inv_456"
  }'
```

Successful response:

```json
{
  "ok": true,
  "event": {
    "id": "server-generated-uuid",
    "timestamp": "2026-06-26T10:15:30.123Z",
    "actor_id": "user_123",
    "action": "delete",
    "resource_type": "invoice",
    "resource_id": "inv_456",
    "before_state": null,
    "after_state": null,
    "ip_address": null,
    "user_agent": null
  },
  "errors": []
}
```

Validation failure response:

```json
{
  "ok": false,
  "event": null,
  "errors": [
    {
      "field": "actor_id",
      "message": "actor_id is required.",
      "code": "MISSING_FIELD"
    }
  ]
}
```

## Phase 2 API

### Persistence

 Events are stored in PostgreSQL.
 Every field is stored exactly as written. The database connection is configured through `DATABASE_URL` in the environment; nothing is hardcoded

### Write-Only Design

The API deliberately exposes no way to update or delete an event once it has been written. There are no `PUT`, `PATCH`, or `DELETE` routes. There are no query parameters or flags that re-enable editing or deletion.

Sending a disallowed method to an events route returns `405 Method Not Allowed`:

```bash
curl -X DELETE http://localhost:3000/events
```

```json
{
  "ok": false,
  "event": null,
  "errors": [
    {
      "field": "",
      "message": "Method not allowed.",
      "code": "METHOD_NOT_ALLOWED"
    }
  ]
}
```

The Write-only design is intentional. An audit log exists to answer the question "what happened and who did it?" That question only has a reliable answer if the records cannot be quietly changed or removed after the fact. Write-only enforcement at the API level means no caller, regardless of permissions, can alter history through this service.