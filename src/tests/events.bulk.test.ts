import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server";

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
    const uniqueId = `atomic-test-${Date.now()}`;

    const res = await request(app)
      .post("/events/bulk")
      .send([
        {
          actor_id: "user-123",
          action: "CREATE",
          resource_type: "document",
          resource_id: uniqueId,
        },
        {
          actor_id: "",
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-invalid",
        },
      ]);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    const check = await request(app).get(`/events?resource_id=${uniqueId}`);
    expect(check.body.total).toBe(0);
  });

  it("returns MISSING_FIELD code when a bulk event is missing a required field", async () => {
    const res = await request(app)
      .post("/events/bulk")
      .send([
        {
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-1",
        },
      ]);
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.errors[0].code).toBe("MISSING_FIELD");
  });

  it("returns INVALID_TYPE code when a bulk event has wrong field type", async () => {
    const res = await request(app)
      .post("/events/bulk")
      .send([
        {
          actor_id: 123,
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-1",
        },
      ]);
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.errors[0].code).toBe("INVALID_TYPE");
  });

  it("each event in batch gets its own id and timestamp", async () => {
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
          action: "CREATE",
          resource_type: "document",
          resource_id: "doc-2",
        },
      ]);
    expect(res.status).toBe(201);
    const ids = res.body.events.map((e: any) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(2);
  });
});
