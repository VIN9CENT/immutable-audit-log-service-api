import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server";

describe("POST /events", () => {
  it("returns 201 with valid data", async () => {
    const res = await request(app)
      .post("/events")
      .send({
        actor_id: "user-123",
        action: "CREATE",
        resource_type: "document",
        resource_id: "doc-456",
        before_state: null,
        after_state: { title: "My Doc" },
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.signature).toBeUndefined();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/events").send({
      action: "CREATE",
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("returns 400 when required fields are empty", async () => {
    const res = await request(app).post("/events").send({
      actor_id: "",
      action: "CREATE",
      resource_type: "document",
      resource_id: "doc-456",
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

describe("Write-only enforcement", () => {
  it("returns 405 for DELETE /events", async () => {
    const res = await request(app).delete("/events");
    expect(res.status).toBe(405);
  });

  it("returns 405 for PUT /events", async () => {
    const res = await request(app).put("/events");
    expect(res.status).toBe(405);
  });

  it("returns 405 for PATCH /events", async () => {
    const res = await request(app).patch("/events");
    expect(res.status).toBe(405);
  });
});

describe("GET /events", () => {
  it("returns 200 with list of events", async () => {
    const res = await request(app).get("/events");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.total).toBeDefined();
    expect(res.body.limit).toBeDefined();
    expect(res.body.offset).toBeDefined();
  });

  it("filters by actor_id", async () => {
    const res = await request(app).get("/events?actor_id=user-123");
    expect(res.status).toBe(200);
    res.body.events.forEach((e: any) => {
      expect(e.actor_id).toBe("user-123");
    });
  });
});

describe("GET /events/:id", () => {
  it("returns 404 for non-existent event", async () => {
    const res = await request(app).get(
      "/events/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
it("returns empty list when offset is beyond total records", async () => {
  const res = await request(app).get("/events?offset=99999");
  expect(res.status).toBe(200);
  expect(res.body.events).toEqual([]);
});

describe("POST /events/bulk", () => {
  it("returns 201 with inserted count when batch is valid", async () => {
    const res = await request(app)
      .post("/events/bulk")
      .send([
        {
          actor_id: "user-123",
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-1",
        },
        {
          actor_id: "user-123",
          action: "UPDATE",
          resource_type: "document",
          resource_id: "doc-2",
          before_state: { title: "Old" },
          after_state: { title: "New" },
        },
      ]);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.inserted).toBe(2);
    expect(res.body.events).toHaveLength(2);
  });

  it("returns 400 when batch exceeds 100 events", async () => {
    const batch = Array.from({ length: 101 }, (_, i) => ({
      actor_id: "user-123",
      action: "CREATE",
      resource_type: "document",
      resource_id: `doc-${i}`,
    }));

    const res = await request(app).post("/events/bulk").send(batch);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("returns 400 when batch is empty", async () => {
    const res = await request(app).post("/events/bulk").send([]);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("returns 400 and writes nothing when one event is invalid", async () => {
    const countBefore = (await request(app).get("/events")).body.total;

    const res = await request(app)
      .post("/events/bulk")
      .send([
        {
          actor_id: "user-123",
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-valid",
        },
        {
          actor_id: "",
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-invalid",
        },
      ]);

    const countAfter = (await request(app).get("/events")).body.total;

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(countAfter).toBe(countBefore);
  });
});
