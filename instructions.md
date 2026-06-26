# Sprint 2: Immutable Audit Log Service

**Duration:** 2 days  
**Format:** Solo · timed · mandatory peer review · one mid-sprint requirement injection  
**Trains:** Data integrity, security thinking, HMAC, immutable records, REST discipline

---

## Background

You have joined a software team that builds several web applications. Across these apps, users perform sensitive actions every day — deleting records, changing other people's permissions, updating prices and account details. Right now, when something goes wrong (a record disappears, a price quietly changes, an account is touched that shouldn't have been), nobody can answer the questions that matter: who did it, when, what changed, and from where? Each application scatters a few log lines into files that are wiped within days.

Your task is to build a REST API service that records audit events into one permanent, queryable record — a record that can be written and read, but never updated or deleted.

This sprint puts the REST and persistence skills from your back-end phases to work, and it carries the same discipline as Sprint 1: validate input at the boundary, and return a clear, structured response for every request. It introduces one genuinely new idea, delivered as a mid-sprint requirement injection: making a stored record tamper-evident.

---

## Technical Constraints

- Do not expose any `UPDATE`, `PUT`, `PATCH`, or `DELETE` endpoint for events. This is the central rule of the sprint.
- Do not let the client set an event's `id` or `timestamp`. The server assigns both on write.
- Do not return a bare status code with no body, or a bare `true`/`false`. Every response carries a structured JSON body.
- Do not write a partial batch. If one event in a bulk request is invalid, none of the batch is written.
- Do not accept an unbounded batch. Enforce the 100-event limit.
- Do not validate only some inputs. Validate the request body at the API boundary on every write.
- Do not hardcode configuration. The data store connection, the server secret, and the port must be configurable.
- Do not use an external audit-logging SaaS for the core logic. Your back-end framework, your ORM/data layer, and your language's standard cryptography module are expected.
- Do not skip the OpenAPI document or the README.
- Do not mix request-handling code with business logic in one undifferentiated layer.

---

## Functional Requirements

The requirements are grouped into five phases. Build and test each phase before moving to the next — the phases are ordered so that you always have a running service in your hands, and the harder ideas come later.

> The sixth concept, tamper-evidence, arrives as a requirement injection partway through the sprint; see [Extended Requirements](#extended-requirements-day-1-requirement-injection).

---

### Phase 1 — Stand Up the Service and Record One Event

#### REQ-001: Create a REST API Service

Build a runnable REST API service using your back-end framework. The project should follow a conventional structure that separates routing, request handling, business logic, and the data layer.

**Acceptance criteria:**
- The service starts and listens on a configurable port.
- Routes are separated from business logic, which is separated from the data layer.
- The project runs from a documented command.
- Configuration (port, data store, secret) is read from the environment, not hardcoded.
- The code is organized so another developer can navigate it.

---

#### REQ-002: Define and Validate the Event Shape

An audit event answers six questions: who, what, what-to, what-changed, when, and from-where. Define the event shape and validate every incoming write against it before anything is stored.

| Field | Meaning | Required? |
|---|---|---|
| `actor_id` | who performed the action | Required |
| `action` | what they did (e.g. `delete`, `update`) | Required |
| `resource_type` | the kind of thing acted on (e.g. `invoice`) | Required |
| `resource_id` | which specific thing | Required |
| `before_state` | the data before the change (JSON) | Optional |
| `after_state` | the data after the change (JSON) | Optional |
| `ip_address` | where the request came from | Optional |
| `user_agent` | what client was used | Optional |

**Acceptance criteria:**
- A request missing any required field is rejected with `400` and a structured error.
- The error names exactly which field is missing and why.
- A request with all required fields is accepted.
- Optional fields are stored when present and not required when absent.
- A field of the wrong type (e.g. `actor_id` as an object) is rejected, not silently stored.

---

#### REQ-003: Record a Single Event — `POST /events`

Expose `POST /events`. It accepts an event in the request body, validates it, stores it, and returns the stored event.

**Acceptance criteria:**
- A valid request stores the event and responds `201 Created`.
- The response body contains the full stored event, including the fields the server assigned.
- An invalid request responds `400` and stores nothing.
- Recording one event does not alter or remove any earlier event.
- The endpoint does not require the client to supply an `id` or `timestamp`.

---

#### REQ-004: Server Assigns `id` and `timestamp`

The server assigns each event a unique `id` and a `timestamp` at the moment it is written. Any `id` or `timestamp` in the request body is ignored.

**Acceptance criteria:**
- Every stored event has a unique `id`.
- Every stored event has a server-set `timestamp`.
- An `id` supplied by the client is ignored, never trusted.
- A `timestamp` supplied by the client is ignored, never trusted.
- The timestamp format is documented in the README.

---

#### REQ-005: Structured Responses and Correct Status Codes

Every response — success or failure — carries a structured JSON body, and every endpoint returns the correct HTTP status code.

A failed write looks like:

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

**Acceptance criteria:**
- A successful write returns `201` with `ok: true` and the stored event.
- A validation failure returns `400` with `ok: false` and a non-empty `errors` array.
- Each error includes the `field`, a human-readable `message`, and a machine-readable `code`.
- When more than one thing is wrong, all problems are reported together, not just the first.
- Reads return `200`; a request for an event that does not exist returns `404`.

---

### Phase 2 — Persist and Enforce Write-Only

#### REQ-006: Persist Events Durably

Events must survive the service restarting. Store them in a persistent data store.

**Acceptance criteria:**
- Events recorded before a restart are still present after it.
- The data store connection is configurable, not hardcoded.
- A fresh, empty store is handled gracefully on first run.
- Stored events retain every field exactly as written.
- The README documents how to set up and connect the store.

---

#### REQ-007: Enforce Write-Only at the API

This is the heart of the sprint. The API exposes only writing and reading. There is no route, method, or flag that changes or removes an event once written.

**Acceptance criteria:**
- The API exposes no `PUT`, `PATCH`, or `DELETE` route for events.
- A request using a disallowed method on an events route returns `405 Method Not Allowed`.
- There is no query parameter or flag that re-enables editing or deletion.
- Once written, an event's stored fields cannot be changed through the API.
- The README explains the write-only decision and why it matters.

---

### Phase 3 — Query the Log

#### REQ-008: Query and Filter Events — `GET /events`

Expose `GET /events`, filterable by `actor_id`, `action`, `resource_type`, `resource_id`, and a date range (`from` / `to`) supplied as query parameters. Also expose `GET /events/:id` to retrieve a single event.

**Acceptance criteria:**
- With no filters, events are returned (subject to pagination).
- Filtering by `actor_id` returns only that actor's events.
- Filtering by `action`, `resource_type`, or `resource_id` returns only matching events.
- A date range returns only events whose timestamp falls inside it, inclusive of the documented boundaries.
- Filters can be combined (e.g. one actor's deletes within a date range).
- `GET /events/:id` returns the event, or `404` if no such event exists.

---

#### REQ-009: Paginate Results

`GET /events` supports pagination through query parameters (`limit` and `offset`), so a caller can page through a large log instead of loading all of it.

**Acceptance criteria:**
- A caller can request a limited number of events with `limit`.
- A caller can request the next page with `offset`.
- The response reports the `limit`, the `offset`, and the total number of matching events.
- Requesting beyond the end of the data returns an empty list, not an error.
- A documented default limit applies when none is supplied.

---

### Phase 4 — Bulk Insert

#### REQ-010: Record a Batch — `POST /events/bulk`

Expose `POST /events/bulk`, which accepts an array of events and records each one. The batch is capped at 100 events; a larger batch is rejected before any work is done.

**Acceptance criteria:**
- A request of valid events stores every event in the batch and responds `201`.
- Each event in the batch receives its own `id` and `timestamp`.
- A batch larger than 100 events is rejected with `400` and a clear message.
- An empty batch is handled gracefully.
- The response reports how many events were written.

---

#### REQ-011: Make the Bulk Insert Atomic

A bulk insert must be all-or-nothing: either every event is written, or none is. Use your data store's transaction support — validate the whole batch, then commit it as one unit, rolling back if anything fails.

**Acceptance criteria:**
- If every event in the batch is valid, all of them are committed.
- If any single event is invalid, the whole request is rejected and nothing is written.
- The response identifies which event failed (by its position in the batch) and why.
- After a rejected batch, the store is exactly as it was before the request — no partial writes remain.
- The README explains why a partial batch would be dangerous for an audit log.

---

### Phase 5 — Document and Test

These run alongside the work above, not after it. Write tests as each phase is finished, and keep the OpenAPI document current.

#### REQ-012: Provide an OpenAPI Document

Describe every endpoint — paths, methods, request bodies, query parameters, responses, and status codes — in an OpenAPI document.

**Acceptance criteria:**
- Every endpoint is described in the OpenAPI document.
- Request bodies and query parameters are specified.
- Success and error responses, with their status codes, are specified.
- The document is valid and can be loaded by a standard OpenAPI viewer.
- The README links to the OpenAPI document.

---

#### REQ-013: Edge-Case Tests

Each behaviour must have at least 5 edge-case tests covering both success and failure paths.

**Acceptance criteria:**
- Recording a single event has at least 5 edge-case tests.
- Validation of the event shape has at least 5 edge-case tests.
- Querying and filtering have at least 5 edge-case tests.
- Pagination has at least 5 edge-case tests.
- The atomic bulk insert has at least 5 edge-case tests, including a rejected partial batch.
- Write-only enforcement is tested (a disallowed method returns `405`).
- Tests include both passing and failing cases and run from a documented command.

---

#### REQ-014: Provide a README.md

Create a `README.md` written for another developer, not for the instructor.

**Acceptance criteria:**
- The README explains what the service does.
- The README shows how to configure, run, and test the service.
- The README documents the event shape and the response format.
- The README shows how to record an event and how to query events.
- The README explains the write-only decision.
- The README includes at least 3 usage examples (with example requests and responses).

---

## Extended Requirements (Day-1 Requirement Injection)

On the announced day mid-sprint, the following is introduced. You adapt the working service to it without restarting. It is part of the deliverable.

> The write-only rule (REQ-007) stops tampering through the API, but it cannot stop someone who edits the stored data directly. Signing makes that kind of tampering detectable.

#### EXT-001: Sign Each Event on Write

On write, compute an HMAC signature over the event's contents using a server secret, and store the signature alongside the event. The secret is configuration; it is never stored in the data store.

**Acceptance criteria:**
- Each stored event has a signature computed from its own contents.
- The signature is produced using HMAC with a configurable server secret.
- The server secret is never written into the data store.
- Two events with different contents produce different signatures.
- The README explains, in plain language, what signing does and does not protect against.

---

#### EXT-002: Verify an Event — `GET /events/:id/verify`

Expose `GET /events/:id/verify`. It recomputes the signature for the stored event and returns whether the record is intact or has been tampered with.

**Acceptance criteria:**
- Verifying an untouched event reports that it is intact.
- Verifying an event whose stored contents were changed reports that it has been tampered with.
- Verification recomputes the signature rather than trusting the stored one blindly.
- The response clearly distinguishes intact from tampered.
- Verifying a non-existent event returns `404`, not a crash.

---

## Suggested Build Order

Follow this path. Build and test each phase before starting the next.

1. **Stand it up (Phase 1).** Get the service running and `POST /events` accepting one valid event and rejecting one invalid event — in memory is fine at first — with correct status codes and a structured body. Don't connect the store yet.
2. **Make it permanent and locked (Phase 2).** Connect the data store, restart the service, and prove the event is still there. Then confirm there is no way to edit or delete it and that disallowed methods return `405`. This is the core lesson — get it solid.
3. **Read it back (Phase 3).** Add filtering on `GET /events`, then pagination.
4. **Then bulk (Phase 4).** Get the simple version storing an array first; only then wrap it in a transaction to make it all-or-nothing.
5. **When the injection lands (Extended).** Add signing on write, then the verify endpoint. It is far easier to add tamper-evidence to a service that already works than to build it alongside everything else.
6. **Tests, OpenAPI, and README throughout (Phase 5).** Document and test each phase as you finish it, not all at the end.

---

## README.md Must Include

```
# Immutable Audit Log Service

## What This Service Does
## Setup & Configuration
## Running the Server
## Running Tests
## The Event Shape
## Recording an Event (POST /events)
## Recording a Batch (POST /events/bulk)
## Querying Events (GET /events)
## Pagination
## Signing & Verification (GET /events/:id/verify)
## Why Write-Only
## API Reference (OpenAPI)
## Known Limitations
```

---

## Grading Criteria

| Area | Weight |
|---|---|
| Write-only enforcement and REST discipline (methods, status codes) | 25% |
| Event recording and structured responses | 10% |
| Query, filter, and pagination correctness | 15% |
| Atomic bulk insert | 15% |
| Tamper-evidence (HMAC signing + verification) | 10% |
| Edge-case testing | 10% |
| OpenAPI document | 5% |
| README documentation | 5% |
| Code organization and readability | 5% |

---

## Assessment Questions

During review, be prepared to answer:

1. Why is the API write-only? What threat does refusing `UPDATE` and `DELETE` actually defend against?
2. What status code does each endpoint return, and why? What happens when a client uses a disallowed method?
3. How do you guarantee a bulk insert of 100 events is atomic?
4. Why does the server assign the `id` and `timestamp` instead of trusting the client?
5. What exactly does signature verification prove, and what does it not prove?
6. What stops a single oversized bulk request from exhausting memory and stalling the service?
7. How is an incoming audit event validated at the API boundary?
8. Which fields did you make required versus optional, and why?
9. How would another developer add a new way to filter events?
10. How would your API behave if two requests recorded events at the same moment?