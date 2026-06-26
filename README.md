# Immutable Audit Log Service

## What This Service Does

This service records audit events in a permanent, queryable log. Events can be written and read, but they should not be updated or deleted through the API.

## Setup & Configuration

Create a `.env` file using `.env.example` as a guide:

```bash
PORT=3000
APP_STAGE=development
DATABASE_URL=postgres://username:password@localhost:5432/immutable_audit_log
SERVER_SECRET=replace-with-a-long-random-secret
```

`PORT`, `DATABASE_URL`, and `SERVER_SECRET` are read from the environment instead of being hardcoded.

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
  },
  "ip_address": "127.0.0.1",
  "user_agent": "curl"
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
- `ip_address`
- `user_agent`

The client must not choose `id` or `timestamp`. The server assigns both when the event is written. Timestamps use ISO 8601 UTC format, for example `2026-06-26T10:15:30.123Z`.

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
    "resource_id": "inv_456"
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
